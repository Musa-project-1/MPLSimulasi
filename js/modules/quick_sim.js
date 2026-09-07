/**
 * Quick Match Simulation & Auto-Fill Tool
 * Allows simulating a single week or the rest of the season in one click.
 */

import * as Store from '../store.js';
import { currentViewWeek, showToast, customAlert } from '../ui/core.js';
import { fetchAPI } from './schedule.js';

export async function simulateCurrentWeekMatches() {
    const week = currentViewWeek;
    const matches = Store.getSessionMatches();
    const scheduled = matches.filter(m => parseInt(m.week) === week && m.status === 'SCHEDULED');

    if (scheduled.length === 0) {
        showToast(`Tidak ada pertandingan terjadwal di Week ${week}.`, 'info');
        return;
    }

    const teams = Store.getSessionTeams();
    const teamMap = {};
    teams.forEach(t => { teamMap[t.id] = t; });

    for (const match of scheduled) {
        if (!match.team_a_id || !match.team_b_id) continue;

        const tA = teamMap[match.team_a_id];
        const tB = teamMap[match.team_b_id];
        if (!tA || !tB) continue;

        const wrA = (parseInt(tA.match_win) + 1) / (parseInt(tA.match_played) + 2 || 2);
        const wrB = (parseInt(tB.match_win) + 1) / (parseInt(tB.match_played) + 2 || 2);
        const probA = Math.max(0.15, Math.min(0.85, wrA / (wrA + wrB || 1)));

        let scoreA = 0;
        let scoreB = 0;

        if (Math.random() < probA) {
            scoreA = 2;
            scoreB = Math.random() < 0.45 ? 1 : 0;
        } else {
            scoreB = 2;
            scoreA = Math.random() < 0.45 ? 1 : 0;
        }

        await fetchAPI('update_score', {
            match_id: match.id,
            score_a: scoreA,
            score_b: scoreB,
            status: 'COMPLETED'
        });
    }

    showToast(`Pertandingan Week ${week} berhasil disimulasikan!`, 'success');

    if (window.loadMatches) window.loadMatches();
    if (window.loadStandings) window.loadStandings();
    if (window.loadDashboard) window.loadDashboard();
}

export async function resetCurrentWeekMatches() {
    const week = currentViewWeek;
    const matches = Store.getSessionMatches();
    const completed = matches.filter(m => parseInt(m.week) === week && m.status === 'COMPLETED');

    if (completed.length === 0) {
        showToast(`Tidak ada pertandingan yang perlu direset di Week ${week}.`, 'info');
        return;
    }

    for (const match of completed) {
        await fetchAPI('update_score', {
            match_id: match.id,
            score_a: '',
            score_b: '',
            status: 'SCHEDULED'
        });
    }

    showToast(`Skor pertandingan Week ${week} telah direset.`, 'info');

    if (window.loadMatches) window.loadMatches();
    if (window.loadStandings) window.loadStandings();
    if (window.loadDashboard) window.loadDashboard();
}

export async function simulateAllRemainingMatches() {
    const matches = Store.getSessionMatches();
    const remaining = matches.filter(m => m.status === 'SCHEDULED');

    if (remaining.length === 0) {
        showToast("Semua pertandingan musim ini sudah selesai!", 'info');
        return;
    }

    const teams = Store.getSessionTeams();
    const teamMap = {};
    teams.forEach(t => { teamMap[t.id] = t; });

    for (const match of remaining) {
        if (!match.team_a_id || !match.team_b_id) continue;

        const tA = teamMap[match.team_a_id];
        const tB = teamMap[match.team_b_id];
        if (!tA || !tB) continue;

        const wrA = (parseInt(tA.match_win) + 1) / (parseInt(tA.match_played) + 2 || 2);
        const wrB = (parseInt(tB.match_win) + 1) / (parseInt(tB.match_played) + 2 || 2);
        const probA = Math.max(0.15, Math.min(0.85, wrA / (wrA + wrB || 1)));

        let scoreA = 0;
        let scoreB = 0;

        if (Math.random() < probA) {
            scoreA = 2;
            scoreB = Math.random() < 0.45 ? 1 : 0;
        } else {
            scoreB = 2;
            scoreA = Math.random() < 0.45 ? 1 : 0;
        }

        await fetchAPI('update_score', {
            match_id: match.id,
            score_a: scoreA,
            score_b: scoreB,
            status: 'COMPLETED'
        });
    }

    showToast("Seluruh sisa pertandingan musim ini berhasil disimulasikan!", 'success');

    if (window.loadMatches) window.loadMatches();
    if (window.loadStandings) window.loadStandings();
    if (window.loadDashboard) window.loadDashboard();
}
