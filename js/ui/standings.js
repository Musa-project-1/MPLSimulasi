/**
 * Standings and Probability UI Renderer
 */

import { globalMatches } from '../store.js';
import { getTeamLogo } from './core.js';

export function loadStandings(teams = [], simTeams = []) {
    const totalTeams = teams.length;
    const maxMatches = globalMatches.length > 0 ? (globalMatches.length / (totalTeams / 2)) : 0;

    const tbodyStanding = document.getElementById('standings-table-body');
    if (tbodyStanding) {
        tbodyStanding.innerHTML = '';

        teams.forEach((t, index) => {
            const sisa = Math.max(0, Math.round(maxMatches - parseInt(t.match_played || 0)));
            const wrMatch = t.match_played > 0 ? Math.round((t.match_win / t.match_played) * 100) + '%' : '0%';
            const totalGame = parseInt(t.game_win || 0) + parseInt(t.game_lose || 0);
            const wrGame = totalGame > 0 ? Math.round((t.game_win / totalGame) * 100) + '%' : '0%';

            const tr = document.createElement('tr');

            let zoneClass = '';
            if (index < 2) zoneClass = 'zone-upper';
            else if (index < 6) zoneClass = 'zone-playin';
            else zoneClass = 'zone-elim';

            tr.className = `hover:brightness-95 transition-all ${zoneClass} ${index === 1 || index === 5 ? 'border-b-2 border-[var(--border-color)]' : ''}`;

            const tieBadge = t.tieBreakerNote 
                ? `<span class="ml-2 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-mono font-bold border border-amber-500/20 tracking-tighter" title="Kriteria Tie-Breaker: ${t.tieBreakerNote}">TB</span>`
                : '';

            tr.innerHTML = `
                <td class="px-3 py-2 font-medium">${index + 1}</td>
                <td class="px-4 py-2 text-left font-semibold flex items-center">
                    ${getTeamLogo(t.tag, 'w-6 h-6 mr-2')}
                    <span>${t.team_name}</span>
                    ${tieBadge}
                </td>
                <td class="px-2 py-2 font-medium text-emerald-600">${t.match_win}</td>
                <td class="px-2 py-2 font-medium text-rose-600">${t.match_lose}</td>
                <td class="px-3 py-2">${wrMatch}</td>
                <td class="px-2 py-2">${t.game_win}</td>
                <td class="px-2 py-2">${t.game_lose}</td>
                <td class="px-3 py-2">${wrGame}</td>
                <td class="px-4 py-2 font-bold text-base bg-[var(--bg-secondary)]">${t.points}</td>
                <td class="px-3 py-2 text-slate-500">${sisa}</td>
            `;
            tbodyStanding.appendChild(tr);
        });
    }

    const tabStanding = document.getElementById('tab-standing');
    if (tabStanding && !document.getElementById('standing-legend')) {
        const legend = document.createElement('div');
        legend.id = 'standing-legend';
        legend.className = "flex flex-wrap items-center justify-center gap-4 md:gap-6 p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider text-slate-500";
        legend.innerHTML = `
            <div class="flex items-center"><div class="w-3 h-3 rounded-full bg-emerald-400 mr-2 shadow-sm"></div> Upper Bracket (1-2)</div>
            <div class="flex items-center"><div class="w-3 h-3 rounded-full bg-blue-400 mr-2 shadow-sm"></div> Play-in (3-6)</div>
            <div class="flex items-center"><div class="w-3 h-3 rounded-full bg-rose-400 mr-2 shadow-sm"></div> Eliminasi (7-9)</div>
        `;
        tabStanding.appendChild(legend);
    }

    const tbodyProb = document.getElementById('prob-table-body');
    if (tbodyProb && simTeams && simTeams.length > 0) {
        tbodyProb.innerHTML = '';

        simTeams.forEach((t, index) => {
            const tr = document.createElement('tr');
            tr.className = `hover:bg-[var(--bg-secondary)] ${index === 1 || index === 5 ? 'border-b-2 border-[var(--border-color)]' : ''}`;
            tr.innerHTML = `
                <td class="px-3 py-3 font-medium">${index + 1}</td>
                <td class="px-4 py-3 text-left font-semibold flex items-center">
                    ${getTeamLogo(t.tag, 'w-6 h-6 mr-2')}
                    ${t.team_name}
                </td>
                <td class="px-4 py-3 font-bold text-[var(--text-primary)]">${t.prob_playoff}</td>
                <td class="px-4 py-3 text-emerald-600 font-medium">${t.prob_upper}</td>
                <td class="px-4 py-3 text-blue-600 font-medium">${t.prob_playin}</td>
                <td class="px-4 py-3 text-rose-600 font-medium">${t.prob_elim}</td>
            `;
            tbodyProb.appendChild(tr);
        });
    }
}
