/**
 * Standings and Probability UI Renderer
 */

import { globalMatches } from '../store.js';
import { getTeamLogo } from './core.js';
import { calculateClinchStatus } from '../rules/clinch.js';
import { calculateStandingsUpToWeek } from '../rules/standings.js';

let activeStandingsWeek = 0;

export function loadStandings(teams = [], simTeams = [], targetWeek = activeStandingsWeek) {
    const totalTeams = teams.length;
    const maxMatches = globalMatches.length > 0 ? (globalMatches.length / (totalTeams / 2)) : 16;
    const historicalTeams = targetWeek > 0
        ? calculateStandingsUpToWeek(teams, globalMatches, targetWeek)
        : teams;
    const enrichedTeams = calculateClinchStatus(historicalTeams, maxMatches); 

    renderStandingsTimeline(globalMatches, targetWeek); 

    const tbodyStanding = document.getElementById('standings-table-body');
    if (tbodyStanding) {
        tbodyStanding.innerHTML = '';

        enrichedTeams.forEach((t, index) => {
            const sisa = Math.max(0, Math.round(maxMatches - parseInt(t.match_played || 0)));
            const wrMatch = t.match_played > 0 ? Math.round((t.match_win / t.match_played) * 100) + '%' : '0%';
            const totalGame = parseInt(t.game_win || 0) + parseInt(t.game_lose || 0);
            const wrGame = totalGame > 0 ? Math.round((t.game_win / totalGame) * 100) + '%' : '0%';

            const tr = document.createElement('tr');

            let zoneClass = '';
            let zoneBadge = '';
            if (index < 2) {
                zoneClass = 'zone-upper';
                zoneBadge = `<span class="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-tighter">Upper</span>`;
            } else if (index < 6) {
                zoneClass = 'zone-playin';
                zoneBadge = `<span class="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-tighter">Play-in</span>`;
            } else {
                zoneClass = 'zone-elim';
                zoneBadge = `<span class="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase tracking-tighter">Elim</span>`;
            }

            tr.className = `hover:brightness-95 transition-all ${zoneClass} ${index === 1 || index === 5 ? 'border-b-2 border-[var(--border-color)]' : ''}`;

            const tieBadge = t.tieBreakerNote 
                ? `<span class="ml-2 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-mono font-bold border border-amber-500/20 tracking-tighter" title="Kriteria Tie-Breaker: ${t.tieBreakerNote}">TB</span>`
                : '';

            const clinchBadge = t.clinch 
                ? `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-tighter ${t.clinch.badgeClass}">${t.clinch.badgeLabel}</span>` 
                : '';

            let streakBadge = '<span class="text-slate-400 font-mono text-xs">-</span>';
            if (t.streak && t.streak.count > 0) {
                if (t.streak.type === 'W') {
                    streakBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 tracking-tighter">${t.streak.label}</span>`;
                } else if (t.streak.type === 'L') {
                    streakBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20 tracking-tighter">${t.streak.label}</span>`;
                }
            }

            tr.innerHTML = `
                <td class="px-3 py-2 font-medium">${index + 1}</td>
                <td class="px-4 py-2 text-left font-semibold flex items-center">
                    ${getTeamLogo(t.tag, 'w-6 h-6 mr-2')}
                    <span>${t.team_name}</span>
                    ${zoneBadge}
                    ${clinchBadge}
                    ${tieBadge}
                </td>
                <td class="px-2 py-2 font-medium text-emerald-600">${t.match_win}</td>
                <td class="px-2 py-2 font-medium text-rose-600">${t.match_lose}</td>
                <td class="px-3 py-2">${wrMatch}</td>
                <td class="px-2 py-2">${t.game_win}</td>
                <td class="px-2 py-2">${t.game_lose}</td>
                <td class="px-3 py-2">${wrGame}</td>
                <td class="px-4 py-2 font-bold text-base bg-[var(--bg-secondary)]">${t.points}</td>
                <td class="px-3 py-2">${streakBadge}</td>
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

export function setStandingsTimelineWeek(week, teams = []) {
    activeStandingsWeek = parseInt(week, 10) || 0;
    if (typeof window !== 'undefined' && window.loadStandings) {
        window.loadStandings(teams, [], activeStandingsWeek);
    }
}

export function renderStandingsTimeline(matches = [], selectedWeek = 0) {
    const host = document.getElementById('standings-timeline');
    if (!host) return;

    const weeks = [...new Set((matches || []).map(m => parseInt(m.week, 10)).filter(Boolean))].sort((a, b) => a - b);
    host.innerHTML = `
        <button onclick="setStandingsTimelineWeek(0)" class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${selectedWeek === 0 ? 'bg-rose-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}">Semua</button>
        ${weeks.map(week => `<button onclick="setStandingsTimelineWeek(${week})" class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${selectedWeek === week ? 'bg-rose-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}">W${week}</button>`).join('')}
    `;
}

/**
 * Head-to-Head 9x9 Match Matrix Grid
 * Standard esports broadcast matrix showing bilateral encounter results.
 */
export function renderH2HMatrix() {
    const container = document.getElementById('tab-matrix');
    if (!container) return;

    const { globalTeams: teams, globalMatches: matches } = Store;

    if (!teams || teams.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-400">Belum ada tim yang tersedia untuk matriks H2H.</div>`;
        return;
    }

    let html = `
        <div class="overflow-x-auto">
            <table class="w-full text-center text-xs whitespace-nowrap border-collapse mpl-table">
                <thead>
                    <tr>
                        <th colspan="${teams.length + 1}" class="mpl-header py-4 text-2xl font-bold tracking-wider font-oswald">Head-to-Head Match Matrix</th>
                    </tr>
                    <tr class="mpl-subhead">
                        <th class="px-3 py-3 w-16 text-left">Tim</th>
                        ${teams.map(t => `<th class="px-2 py-3 font-bold text-center">${getTeamLogo(t.tag, 'w-5 h-5 mx-auto mb-1')}<span>${t.tag}</span></th>`).join('')}
                    </tr>
                </thead>
                <tbody class="divide-y divide-[var(--border-color)]">
    `;

    teams.forEach(rowTeam => {
        html += `
            <tr class="h2h-row hover:bg-slate-500/5 transition-colors" data-team="${rowTeam.tag}">
                <td class="px-4 py-2.5 font-bold text-xs sticky left-0 bg-[var(--bg-card)] border-r border-[var(--border-color)] flex items-center gap-2">
                    ${getTeamLogo(rowTeam.tag, 'w-5 h-5')}
                    <span>${rowTeam.tag}</span>
                </td>
        `;

        teams.forEach(colTeam => {
            if (rowTeam.id === colTeam.id) {
                html += `<td class="px-2 py-2 bg-slate-500/10 text-slate-500 font-mono text-center">-</td>`;
                return;
            }

            const h2hMatches = (matches || []).filter(m => 
                m.status === 'COMPLETED' &&
                ((m.team_a_id === rowTeam.id && m.team_b_id === colTeam.id) ||
                 (m.team_a_id === colTeam.id && m.team_b_id === rowTeam.id))
            );

            if (h2hMatches.length === 0) {
                html += `<td class="h2h-cell px-2 py-2 text-slate-400 text-center font-mono transition-colors cursor-default" data-row-team="${rowTeam.tag}" data-col-team="${colTeam.tag}" title="${rowTeam.tag} vs ${colTeam.tag}">-</td>`;
                return;
            }

            const badges = h2hMatches.map(m => {
                const isTeamA = m.team_a_id === rowTeam.id;
                const myScore = isTeamA ? m.score_a : m.score_b;
                const oppScore = isTeamA ? m.score_b : m.score_a;
                const isWon = parseInt(myScore, 10) > parseInt(oppScore, 10);

                const colorClass = isWon 
                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" 
                    : "bg-rose-500/15 text-rose-500 border-rose-500/20";

                return `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${colorClass}">${myScore}-${oppScore}</span>`;
            }).join(' ');

            html += `<td class="h2h-cell px-2 py-2 text-center transition-colors cursor-default" data-row-team="${rowTeam.tag}" data-col-team="${colTeam.tag}" title="${rowTeam.tag} vs ${colTeam.tag}">${badges}</td>`;
        });

        html += `</tr>`;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div class="p-3 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] text-center border-t border-[var(--border-color)]">
            *Matriks H2H mencatat hasil pertandingan timbal balik langsung (Baris vs Kolom) pada musim reguler.
        </div>
    `;

    container.innerHTML = html;
}
