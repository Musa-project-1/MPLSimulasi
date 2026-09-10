/**
 * Modul Tampilan Klasemen & Probabilitas Simulasi
 * Batas: <450 baris
 */

import { getTeamSquircle } from './components.js';
import { getZoneByRank } from '../modules/standings.js';

export function renderStandingsTable(teams, totalMatches) {
    const tbody = document.getElementById('standings-table-body');
    if (!tbody) return;

    if (!teams || teams.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-xs text-slate-500">Belum ada data tim.</td></tr>`;
        return;
    }

    const totalTeams = teams.length;
    const maxMatchesPerTeam = totalMatches > 0 ? Math.round(totalMatches / (totalTeams / 2)) : 16;

    let html = '';
    teams.forEach((t, index) => {
        const rank = index + 1;
        const zone = getZoneByRank(rank, totalTeams);

        const sisa = Math.max(0, maxMatchesPerTeam - (parseInt(t.match_played) || 0));
        const played = parseInt(t.match_played) || 0;
        const win = parseInt(t.match_win) || 0;
        const wrMatch = played > 0 ? Math.round((win / played) * 100) + '%' : '0%';

        const gameWin = parseInt(t.game_win) || 0;
        const gameLose = parseInt(t.game_lose) || 0;
        const totalGames = gameWin + gameLose;
        const wrGame = totalGames > 0 ? Math.round((gameWin / totalGames) * 100) + '%' : '0%';
        const pts = parseInt(t.points) || 0;
        const pointsFormatted = pts > 0 ? `+${pts}` : pts;

        // Styling baris berdasarkan zona
        let rankBadgeClass = 'bg-slate-800 text-slate-400';
        let rowBorderClass = 'border-b border-slate-800/60';
        let zoneClass = '';
        let zoneLabel = '';
        if (zone.key === 'upper') {
            rankBadgeClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            zoneClass = 'zone-upper';
            zoneLabel = 'Upper Bracket';
        } else if (zone.key === 'playin') {
            rankBadgeClass = 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
            zoneClass = 'zone-playin';
            zoneLabel = 'Play-in';
        } else {
            rankBadgeClass = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
            zoneClass = 'zone-elim';
            zoneLabel = 'Eliminasi';
        }

        if (rank === 2 || rank === 6) {
            rowBorderClass = 'border-b-2 border-slate-700/80';
        }

        html += `
            <tr class="hover:bg-slate-800/40 transition-colors ${rowBorderClass} ${zoneClass}">
                <td class="px-3 py-3 text-center">
                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-mono font-black ${rankBadgeClass}" title="${zoneLabel}">
                        ${rank}
                    </span>
                    <span class="sr-only">${zoneLabel}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        ${getTeamSquircle(t.tag, 'w-7 h-7', 'text-[10px]')}
                        <div class="min-w-0">
                            <span class="font-bold text-sm text-slate-100 block leading-tight truncate">${t.team_name}</span>
                            <span class="text-[10px] font-mono text-slate-500 uppercase tracking-wider">${t.tag}</span>
                        </div>
                    </div>
                </td>
                <td class="px-3 py-3 text-center font-mono text-xs font-bold text-emerald-400">${t.match_win}</td>
                <td class="px-3 py-3 text-center font-mono text-xs font-bold text-rose-400">${t.match_lose}</td>
                <td class="px-3 py-3 text-center font-mono text-xs text-slate-400">${wrMatch}</td>
                <td class="px-3 py-3 text-center font-mono text-xs text-slate-300">${t.game_win}</td>
                <td class="px-3 py-3 text-center font-mono text-xs text-slate-400">${t.game_lose}</td>
                <td class="px-3 py-3 text-center font-mono text-xs text-slate-400">${wrGame}</td>
                <td class="px-4 py-3 text-center font-mono text-sm font-black text-slate-100 bg-slate-800/30">${pointsFormatted}</td>
                <td class="px-3 py-3 text-center font-mono text-xs text-slate-500">${sisa}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

export function renderProbabilitiesTable(simTeams) {
    const tbody = document.getElementById('prob-table-body');
    if (!tbody) return;

    if (!simTeams || simTeams.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-xs text-slate-500">Jalankan simulasi untuk melihat perkiraan probabilitas.</td></tr>`;
        return;
    }

    let html = '';
    simTeams.forEach((t, index) => {
        const rank = index + 1;
        const rowBorderClass = (rank === 2 || rank === 6) ? 'border-b-2 border-slate-700/80' : 'border-b border-slate-800/60';

        html += `
            <tr class="hover:bg-slate-800/40 transition-colors ${rowBorderClass}">
                <td class="px-3 py-3 text-center font-mono text-xs text-slate-400 font-bold">${rank}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        ${getTeamSquircle(t.tag, 'w-7 h-7', 'text-[10px]')}
                        <span class="font-bold text-sm text-slate-100 truncate">${t.team_name}</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-center font-mono text-xs font-black text-rose-400">${t.prob_playoff}</td>
                <td class="px-4 py-3 text-center font-mono text-xs font-bold text-emerald-400">${t.prob_upper}</td>
                <td class="px-4 py-3 text-center font-mono text-xs font-bold text-cyan-400">${t.prob_playin}</td>
                <td class="px-4 py-3 text-center font-mono text-xs font-bold text-rose-400">${t.prob_elim}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}
