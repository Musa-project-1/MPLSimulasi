/**
 * What-If Scenario Sandbox Engine
 * Simulates speculative match outcomes and computes real-time rank shifts and clinch impact.
 */

import * as Store from '../store.js';
import { calculateStandings, recalculateTeamStatsFromMatches } from '../rules/standings.js';
import { calculateClinchStatus } from '../rules/clinch.js';

/**
 * Computes comparative standings between current state and speculative sandbox matches.
 * @param {Array} speculativeMatches - Array of { matchId, scoreA, scoreB }
 * @param {string} sessionId
 */
export function computeWhatIfScenario(speculativeMatches = [], sessionId = Store.activeSessionId) {
    const teams = Store.getSessionTeams(sessionId);
    const matches = Store.getSessionMatches(sessionId);

    if (!teams || teams.length === 0) return { baseline: [], comparison: [] };

    // 1. Baseline Standings & Clinch
    const baselineTeams = recalculateTeamStatsFromMatches(teams, matches);
    const baselineStandings = calculateStandings(baselineTeams, matches);
    const baselineEnriched = calculateClinchStatus(baselineStandings, 16);
    const baselineRankMap = {};
    baselineEnriched.forEach((t, idx) => {
        baselineRankMap[t.id] = { rank: idx + 1, points: t.points, clinch: t.clinch };
    });

    // 2. Clone matches and apply speculative outcomes
    const clonedMatches = matches.map(m => ({ ...m }));
    const specMap = {};
    speculativeMatches.forEach(sm => {
        specMap[sm.matchId] = sm;
    });

    clonedMatches.forEach(m => {
        if (specMap[m.id]) {
            const sm = specMap[m.id];
            m.score_a = sm.scoreA;
            m.score_b = sm.scoreB;
            m.status = 'COMPLETED';
        }
    });

    // 3. Recompute Scenario Standings & Clinch
    const scenarioTeams = recalculateTeamStatsFromMatches(teams, clonedMatches);
    const scenarioStandings = calculateStandings(scenarioTeams, clonedMatches);
    const scenarioEnriched = calculateClinchStatus(scenarioStandings, 16);

    // 4. Compute Deltas
    const comparison = scenarioEnriched.map((t, newIdx) => {
        const newRank = newIdx + 1;
        const oldData = baselineRankMap[t.id] || { rank: newRank, points: t.points, clinch: t.clinch };
        const oldRank = oldData.rank;
        const rankDelta = oldRank - newRank; // positive = moved up, negative = moved down
        const pointsDelta = t.points - oldData.points;

        return {
            ...t,
            newRank,
            oldRank,
            rankDelta,
            pointsDelta,
            oldClinch: oldData.clinch,
            newClinch: t.clinch
        };
    });

    return {
        baseline: baselineEnriched,
        comparison
    };
}

export function openWhatIfSandbox() {
    const upcoming = Store.getSessionMatches(Store.activeSessionId)
        .filter(match => match.status !== 'COMPLETED');
    if (!upcoming.length) {
        if (typeof customAlert === 'function') customAlert('Tidak ada pertandingan mendatang untuk dianalisis.');
        return;
    }
    const raw = prompt('Masukkan skenario: matchId=2-1,matchId2=1-2');
    if (!raw) return;
    const speculativeMatches = raw.split(',').map(item => {
        const [matchId, score] = item.trim().split('=');
        const [scoreA, scoreB] = (score || '').split('-').map(Number);
        return { matchId, scoreA, scoreB };
    }).filter(item => item.matchId && [0, 1, 2].includes(item.scoreA) && [0, 1, 2].includes(item.scoreB));
    const result = computeWhatIfScenario(speculativeMatches);
    const changed = result.comparison.filter(team => team.rankDelta || team.pointsDelta || team.oldClinch !== team.newClinch);
    const summary = changed.map(team => `${team.tag}: ${team.oldRank} → ${team.newRank} | poin ${team.pointsDelta >= 0 ? '+' : ''}${team.pointsDelta}`).join('\\n');
    if (typeof customAlert === 'function') customAlert(summary || 'Skenario tidak mengubah klasemen.');
}
