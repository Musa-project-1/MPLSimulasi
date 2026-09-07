/**
 * Playoff Tournament Bracket UI Renderer
 */

import { getTeamLogo } from './core.js';

export function renderPlayoffBracket(data) {
    const container = document.getElementById('playoff-bracket-container');
    if (!container || !data || !data.rounds) return;

    let html = `<div class="flex items-start justify-center gap-0 min-w-max px-8 py-4">`;

    data.rounds.forEach((round, rIndex) => {
        html += `<div class="bracket-round">
            <div class="round-title mb-8">${round.name}</div>
            <div class="flex flex-col h-full justify-around gap-12">`;

        round.matches.forEach(match => {
            const teamA = match.teamA || { tag: 'TBD', team_name: 'To Be Determined', id: 'tbd_a' };
            const teamB = match.teamB || { tag: 'TBD', team_name: 'To Be Determined', id: 'tbd_b' };

            const isWinnerA = match.winner && match.winner.id === teamA.id;
            const isWinnerB = match.winner && match.winner.id === teamB.id;
            const hasResult = isWinnerA || isWinnerB;

            html += `
                <div class="bracket-match group relative">
                    <!-- Match Header (ID/Type) -->
                    <div class="absolute -top-6 left-0 right-0 flex justify-between px-2">
                        <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">${match.id === 'p7' || match.id === 's3' ? 'GRAND FINAL' : 'MATCH ' + match.id.toUpperCase()}</span>
                        ${hasResult ? '<span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Final Result</span>' : ''}
                    </div>

                    <div class="flex flex-col divide-y divide-[var(--border-color)]">
                        <!-- Team A -->
                        <div class="bracket-team transition-all ${isWinnerA ? 'bg-emerald-500/10' : ''} ${isWinnerB ? 'opacity-40' : ''}">
                            <div class="flex items-center gap-3">
                                <div class="relative">
                                    ${getTeamLogo(teamA.tag, 'w-8 h-8')}
                                    ${isWinnerA ? '<div class="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm border border-white"><i class="ph-fill ph-crown text-[8px]"></i></div>' : ''}
                                </div>
                                <div>
                                    <span class="team-name text-sm font-bold block leading-none ${isWinnerA ? 'text-emerald-600' : 'text-[var(--text-primary)]'}">${teamA.tag}</span>
                                    <span class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">${teamA.team_name}</span>
                                </div>
                            </div>
                            <input type="number" value="${match.scoreA}" onchange="updatePlayoffScore('${match.id}', 'A', this.value)" 
                                class="bracket-score font-oswald text-xl w-12 h-10 rounded-xl text-center outline-none focus:bg-white transition-colors bg-transparent ${isWinnerA ? 'text-emerald-600 font-black' : 'text-[var(--text-primary)]'}"
                                placeholder="-">
                        </div>

                        <!-- Team B -->
                        <div class="bracket-team transition-all ${isWinnerB ? 'bg-emerald-500/10' : ''} ${isWinnerA ? 'opacity-40' : ''}">
                            <div class="flex items-center gap-3">
                                <div class="relative">
                                    ${getTeamLogo(teamB.tag, 'w-8 h-8')}
                                    ${isWinnerB ? '<div class="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm border border-white"><i class="ph-fill ph-crown text-[8px]"></i></div>' : ''}
                                </div>
                                <div>
                                    <span class="team-name text-sm font-bold block leading-none ${isWinnerB ? 'text-emerald-600' : 'text-[var(--text-primary)]'}">${teamB.tag}</span>
                                    <span class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">${teamB.team_name}</span>
                                </div>
                            </div>
                            <input type="number" value="${match.scoreB}" onchange="updatePlayoffScore('${match.id}', 'B', this.value)" 
                                class="bracket-score font-oswald text-xl w-12 h-10 rounded-xl text-center outline-none focus:bg-white transition-colors bg-transparent ${isWinnerB ? 'text-emerald-600 font-black' : 'text-[var(--text-primary)]'}"
                                placeholder="-">
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;

        if (rIndex < data.rounds.length - 1) {
            html += `
                <div class="bracket-connector flex items-center justify-center opacity-30">
                    <div class="w-full h-[2px] bg-slate-400 relative">
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-400 rotate-45"></div>
                    </div>
                </div>
            `;
        }
    });

    html += `</div>`;
    container.innerHTML = html;
}
