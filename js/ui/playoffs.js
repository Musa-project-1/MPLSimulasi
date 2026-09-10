/**
 * Modul Tampilan Bagan Playoff
 * Batas: <450 baris
 */

import { getTeamSquircle } from './components.js';

export function renderPlayoffBracket(bracketData) {
    const container = document.getElementById('playoff-bracket-container');
    if (!container) return;

    if (!bracketData || !bracketData.rounds) {
        container.innerHTML = `<div class="p-12 text-center text-xs text-slate-500">Bagan playoff belum diinisialisasi.</div>`;
        return;
    }

    let html = `<div class="flex items-start gap-6 overflow-x-auto pb-6 pt-2 px-2 min-w-max">`;

    bracketData.rounds.forEach((round) => {
        html += `
            <div class="playoff-round flex flex-col w-64 flex-shrink-0">
                <div class="mb-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span class="text-xs font-black uppercase tracking-wider text-slate-300 font-oswald">${round.name}</span>
                    <span class="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase">BO${round.matches[0]?.targetWin === 4 ? 7 : 5}</span>
                </div>

                <div class="flex flex-col gap-5 justify-around flex-1">
        `;

        round.matches.forEach(m => {
            const teamA = m.teamA || { tag: 'TBD', team_name: 'Menunggu Tim', id: '' };
            const teamB = m.teamB || { tag: 'TBD', team_name: 'Menunggu Tim', id: '' };

            const isWinnerA = m.winner && m.winner.id && m.winner.id === teamA.id;
            const isWinnerB = m.winner && m.winner.id && m.winner.id === teamB.id;
            const hasResult = isWinnerA || isWinnerB;

            html += `
                <div class="playoff-match-card rounded-2xl bg-slate-900/70 border ${hasResult ? 'border-slate-700/80' : 'border-slate-800'} p-3 shadow-sm hover:border-slate-700 transition">
                    <div class="flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 pb-1.5 border-b border-slate-800/60">
                        <span>${m.name || m.id.toUpperCase()}</span>
                        ${hasResult ? '<span class="text-emerald-400 font-bold uppercase">Selesai</span>' : ''}
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <!-- Tim A -->
                        <div class="flex items-center justify-between p-1.5 rounded-xl transition ${isWinnerA ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-950/40'}">
                            <div class="flex items-center gap-2 min-w-0">
                                ${getTeamSquircle(teamA.tag, 'w-6 h-6', 'text-[8px]')}
                                <span class="font-bold text-xs ${isWinnerA ? 'text-emerald-400' : 'text-slate-200'} truncate">${teamA.tag}</span>
                            </div>
                            <input type="number" min="0" max="${m.targetWin || 4}" value="${m.scoreA !== undefined ? m.scoreA : ''}"
                                onchange="handlePlayoffScoreChange('${m.id}', 'A', this.value)"
                                placeholder="-" inputmode="numeric" aria-label="Skor ${teamA.tag} pada ${m.name || m.id}"
                                class="w-8 h-7 text-center font-mono font-bold text-xs rounded-lg bg-slate-900 border border-slate-700 focus:border-rose-500 outline-none ${isWinnerA ? 'text-emerald-400' : 'text-slate-100'}">
                        </div>

                        <!-- Tim B -->
                        <div class="flex items-center justify-between p-1.5 rounded-xl transition ${isWinnerB ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-950/40'}">
                            <div class="flex items-center gap-2 min-w-0">
                                ${getTeamSquircle(teamB.tag, 'w-6 h-6', 'text-[8px]')}
                                <span class="font-bold text-xs ${isWinnerB ? 'text-emerald-400' : 'text-slate-200'} truncate">${teamB.tag}</span>
                            </div>
                            <input type="number" min="0" max="${m.targetWin || 4}" value="${m.scoreB !== undefined ? m.scoreB : ''}"
                                onchange="handlePlayoffScoreChange('${m.id}', 'B', this.value)"
                                placeholder="-" inputmode="numeric" aria-label="Skor ${teamB.tag} pada ${m.name || m.id}"
                                class="w-8 h-7 text-center font-mono font-bold text-xs rounded-lg bg-slate-900 border border-slate-700 focus:border-rose-500 outline-none ${isWinnerB ? 'text-emerald-400' : 'text-slate-100'}">
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}
