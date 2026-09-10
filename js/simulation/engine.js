/**
 * Monte Carlo Simulation Engine for MPL Pro Simulator
 * Computes Playoff Qualification, Upper Bracket, and Elimination Probabilities.
 */

import { activeSessionId, getSessionMatches } from '../store.js';
import { calculateStandings } from '../rules/standings.js';

export const DEFAULT_RIVALRIES = [
    { teams: ["RRQ", "EVOS"], intensity: 1.2 },
    { teams: ["ONIC", "BTR"], intensity: 1.15 },
    { teams: ["AE", "GEEK"], intensity: 1.1 }
];

/**
 * Pure deterministic / Monte Carlo simulation iteration logic
 * Can be executed in both Web Worker and Node/Test environments.
 */
export function simulateMonteCarlo(teams = [], allMatches = [], settings = {}, iterations = 10000) {
    if (!teams || teams.length === 0) return [];

    const volatility = typeof settings.volatility === 'number' ? settings.volatility : 50;
    const h2hBias = !!settings.h2hBias;
    const momentum = settings.momentum !== false;
    const fatigue = settings.fatigue !== false;
    const rivalry = settings.rivalry !== false;

    const scheduledMatches = allMatches.filter(m => m.status === 'SCHEDULED');
    const completedMatches = allMatches.filter(m => m.status === 'COMPLETED');

    // Instant short-circuit when all matches are completed (deterministic 100% / 0% outcome)
    if (scheduledMatches.length === 0 && teams.length > 0) {
        const finalStandings = calculateStandings(teams, allMatches);
        return finalStandings.map((t, idx) => ({
            id: t.id,
            tag: t.tag,
            team_name: t.team_name,
            prob_upper: idx < 2 ? "100.00%" : "0.00%",
            prob_playin: (idx >= 2 && idx < 6) ? "100.00%" : "0.00%",
            prob_playoff: idx < 6 ? "100.00%" : "0.00%",
            prob_elim: idx >= 6 ? "100.00%" : "0.00%"
        }));
    }

    const teamBaseStats = {};
    const h2hCache = {};

    // 1. Build initial momentum & base win rates
    teams.forEach(t => {
        let wr = (parseInt(t.match_win) + 1) / (parseInt(t.match_played) + 2 || 2);

        if (momentum) {
            const teamMatches = completedMatches
                .filter(m => (m.team_a_id === t.id || m.team_b_id === t.id))
                .sort((a, b) => b.id.localeCompare(a.id))
                .slice(0, 3);

            const winStreak = teamMatches.filter(m => 
                (m.team_a_id === t.id && m.score_a > m.score_b) || 
                (m.team_b_id === t.id && m.score_b > m.score_a)
            ).length;

            if (winStreak === 3) wr += 0.05;
        }

        teamBaseStats[t.id] = {
            id: t.id,
            tag: t.tag,
            team_name: t.team_name,
            wr,
            match_win: parseInt(t.match_win) || 0,
            points: parseInt(t.points) || 0,
            last_match_day: 0
        };
    });

    // 2. Build H2H Cache
    if (h2hBias) {
        completedMatches.forEach(m => {
            const key = m.team_a_id < m.team_b_id ? `${m.team_a_id}_${m.team_b_id}` : `${m.team_b_id}_${m.team_a_id}`;
            if (!h2hCache[key]) h2hCache[key] = { [m.team_a_id]: 0, [m.team_b_id]: 0 };
            const winnerId = m.score_a > m.score_b ? m.team_a_id : m.team_b_id;
            h2hCache[key][winnerId]++;
        });
    }

    const simResults = {};
    teams.forEach(t => {
        simResults[t.id] = { upper: 0, playoff: 0, elim: 0 };
    });

    // 3. Monte Carlo iterations
    for (let i = 0; i < iterations; i++) {
        const iterTeams = {};
        for (const id in teamBaseStats) {
            iterTeams[id] = { ...teamBaseStats[id], fatigue: 0 };
        }

        scheduledMatches.forEach(m => {
            const tA = iterTeams[m.team_a_id];
            const tB = iterTeams[m.team_b_id];
            if (!tA || !tB) return;

            // Fatigue
            if (fatigue) {
                const currentDay = (m.week - 1) * 7 + (m.day || 1);
                [tA, tB].forEach(t => {
                    if (t.last_match_day === currentDay - 1) t.fatigue += 15;
                    else if (t.last_match_day < currentDay - 2) t.fatigue = Math.max(0, t.fatigue - 10);
                    t.last_match_day = currentDay;
                });
            }

            let probA = tA.wr / (tA.wr + tB.wr || 1);

            // Rivalry
            if (rivalry) {
                const riv = DEFAULT_RIVALRIES.find(r => 
                    r.teams.includes(tA.tag) && r.teams.includes(tB.tag)
                );
                if (riv) {
                    const isUnderdogA = probA < 0.5;
                    const boost = (riv.intensity - 1) * 0.5;
                    probA = isUnderdogA ? (probA + boost) : (probA - boost);
                }
            }

            // H2H Bias
            if (h2hBias) {
                const key = m.team_a_id < m.team_b_id ? `${m.team_a_id}_${m.team_b_id}` : `${m.team_b_id}_${m.team_a_id}`;
                const h2h = h2hCache[key];
                if (h2h) {
                    const winA = h2h[m.team_a_id] || 0;
                    const winB = h2h[m.team_b_id] || 0;
                    if (winA + winB > 0) {
                        const h2hProbA = winA / (winA + winB);
                        probA = (probA * 0.7) + (h2hProbA * 0.3);
                    }
                }
            }

            // Fatigue penalty
            if (fatigue) {
                const penaltyA = (tA.fatigue / 100) * 0.1;
                const penaltyB = (tB.fatigue / 100) * 0.1;
                probA = probA - penaltyA + penaltyB;
            }

            // Volatility
            const volFactor = volatility / 100;
            probA = Math.max(0.1, Math.min(0.9, (probA * (1 - volFactor)) + (0.5 * volFactor)));

            // Simulation outcome (Bo3 match)
            if (Math.random() < probA) {
                tA.match_win++;
                tA.points += (Math.random() > 0.5 ? 2 : 1);
            } else {
                tB.match_win++;
                tB.points += (Math.random() > 0.5 ? 2 : 1);
            }
        });

        // Rank iteration standings
        const simStandings = Object.values(iterTeams).sort((a, b) => {
            if (b.match_win !== a.match_win) return b.match_win - a.match_win;
            return b.points - a.points;
        });

        simStandings.forEach((st, idx) => {
            if (idx < 2) simResults[st.id].upper++;
            if (idx < 6) simResults[st.id].playoff++;
            if (idx >= 6) simResults[st.id].elim++;
        });
    }

    return teams.map(t => {
        const upper = (simResults[t.id].upper / iterations) * 100;
        const playoff = (simResults[t.id].playoff / iterations) * 100;
        const elim = (simResults[t.id].elim / iterations) * 100;
        return {
            ...t,
            prob_upper: upper.toFixed(2) + '%',
            prob_playoff: playoff.toFixed(2) + '%',
            prob_playin: Math.max(0, playoff - upper).toFixed(2) + '%',
            prob_elim: elim.toFixed(2) + '%'
        };
    });
}

/**
 * Executes simulation in browser using Web Worker (or fallback).
 * Debounce 300ms + timeout 8 detik + fallback bila Worker gagal.
 */
let simDebounceTimer = null;
let simPendingResolve = null;
const SIM_DEBOUNCE_MS = 300;
const SIM_WORKER_TIMEOUT_MS = 8000;

export async function runSimulation(teams) {
    return new Promise((resolve) => {
        if (simPendingResolve) {
            simPendingResolve(null);
            simPendingResolve = null;
        }
        clearTimeout(simDebounceTimer);
        simPendingResolve = resolve;
        simDebounceTimer = setTimeout(() => {
            const done = simPendingResolve;
            simPendingResolve = null;
            spawnSimulation(teams, (result) => {
                if (result) done(result);
            });
        }, SIM_DEBOUNCE_MS);
    });
}

function spawnSimulation(teams, done) {
    return new Promise((resolve) => {
        const finish = (result) => {
            resolve(result);
            done(result);
        };
        let settings = { volatility: 50, h2hBias: false, momentum: true, fatigue: true, rivalry: true };
        try {
            if (typeof localStorage !== 'undefined' && activeSessionId) {
                const raw = localStorage.getItem('mpl_settings_' + activeSessionId);
                if (raw) settings = JSON.parse(raw);
            }
        } catch (_) {}

        const allMatches = getSessionMatches();

        if (typeof Worker !== 'undefined') {
            let worker = null;
            let timedOut = false;
            try {
                worker = new Worker('js/simulation/worker.js');
            } catch (_) {
                finish(simulateMonteCarlo(teams, allMatches, settings, 2000));
                return;
            }
            const timer = setTimeout(() => {
                timedOut = true;
                try { worker.terminate(); } catch (_) {}
                finish(simulateMonteCarlo(teams, allMatches, settings, 2000));
            }, SIM_WORKER_TIMEOUT_MS);
            worker.onmessage = function (e) {
                if (timedOut) return;
                clearTimeout(timer);
                finish(e.data);
                try { worker.terminate(); } catch (_) {}
            };
            worker.onerror = function () {
                if (timedOut) return;
                clearTimeout(timer);
                try { worker.terminate(); } catch (_) {}
                finish(simulateMonteCarlo(teams, allMatches, settings, 2000));
            };
            worker.postMessage({ teams, allMatches, settings });
        } else {
            const results = simulateMonteCarlo(teams, allMatches, settings, 2000);
            finish(results);
        }
    });
}
