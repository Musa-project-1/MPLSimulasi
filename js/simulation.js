import { activeSessionId, getSessionMatches } from './store.js';

let debounceTimer = null;
let pendingResolve = null;
const DEBOUNCE_MS = 300;
const WORKER_TIMEOUT_MS = 8000;
const FALLBACK_ITERATIONS = 5000;

function runFallback(teams, allMatches, settings) {
    const counts = {};
    teams.forEach(t => { counts[t.id] = { upper: 0, playoff: 0, playin: 0, elim: 0 }; });
    const scheduled = allMatches.filter(m => m.status === 'SCHEDULED');
    for (let i = 0; i < FALLBACK_ITERATIONS; i++) {
        const pts = {};
        teams.forEach(t => { pts[t.id] = parseInt(t.points) || 0; });
        scheduled.forEach(m => {
            const winner = Math.random() < 0.5 ? m.team_a_id : m.team_b_id;
            if (pts[winner] !== undefined) pts[winner] += 1;
        });
        const ranked = [...teams].sort((a, b) => (pts[b.id] || 0) - (pts[a.id] || 0));
        ranked.forEach((t, idx) => {
            const rank = idx + 1;
            if (rank <= 2) counts[t.id].upper++;
            else if (rank <= 6) counts[t.id].playin++;
            else counts[t.id].elim++;
            if (rank <= 6) counts[t.id].playoff++;
        });
    }
    return teams.map((t, idx) => ({
        ...t,
        prob_upper: Math.round((counts[t.id].upper / FALLBACK_ITERATIONS) * 100) + '%',
        prob_playoff: Math.round((counts[t.id].playoff / FALLBACK_ITERATIONS) * 100) + '%',
        prob_playin: Math.round((counts[t.id].playin / FALLBACK_ITERATIONS) * 100) + '%',
        prob_elim: Math.round((counts[t.id].elim / FALLBACK_ITERATIONS) * 100) + '%',
    }));
}

function spawnWorker(teams, allMatches, settings, resolve) {
    let worker = null;
    let timedOut = false;
    try {
        worker = new Worker('js/simulation.worker.js');
    } catch (err) {
        resolve(runFallback(teams, allMatches, settings));
        return;
    }
    const timer = setTimeout(() => {
        timedOut = true;
        try { worker.terminate(); } catch (e) {}
        resolve(runFallback(teams, allMatches, settings));
    }, WORKER_TIMEOUT_MS);
    worker.onmessage = function(e) {
        if (timedOut) return;
        clearTimeout(timer);
        resolve(e.data);
        try { worker.terminate(); } catch (err) {}
    };
    worker.onerror = function() {
        if (timedOut) return;
        clearTimeout(timer);
        try { worker.terminate(); } catch (err) {}
        resolve(runFallback(teams, allMatches, settings));
    };
    worker.postMessage({ teams, allMatches, settings });
}

export function runSimulation(teams) {
    return new Promise((resolve) => {
        if (pendingResolve) {
            pendingResolve(null);
            pendingResolve = null;
        }
        clearTimeout(debounceTimer);
        pendingResolve = resolve;
        debounceTimer = setTimeout(() => {
            const done = pendingResolve;
            pendingResolve = null;
            const settings = JSON.parse(localStorage.getItem('mpl_settings_' + activeSessionId) || '{"volatility":50,"h2hBias":false,"momentum":true}');
            const allMatches = getSessionMatches();
            spawnWorker(teams, allMatches, settings, (result) => {
                if (result) done(result);
            });
        }, DEBOUNCE_MS);
    });
}
