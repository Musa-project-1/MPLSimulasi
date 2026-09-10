/**
 * Modul Tampilan Dashboard
 * Batas: <450 baris
 */

import { getTeamSquircle } from './components.js';

export function renderDashboard(summaryData, teams, simResults) {
    const { total, completed, progressPct, upcoming } = summaryData;

    // 1. Progress Bar Update
    const bar = document.getElementById('dash-progress-bar');
    const text = document.getElementById('dash-progress-text');
    if (bar) bar.style.width = `${progressPct}%`;
    if (text) text.innerText = `${completed} / ${total} Selesai (${progressPct}%)`;

    // 2. Pemimpin Klasemen Saat Ini (Top Team)
    const topTeam = (teams && teams.length > 0) ? teams[0] : null;
    const leaderCard = document.getElementById('dash-leader-card');
    if (leaderCard) {
        if (topTeam) {
            leaderCard.innerHTML = `
                <div class="flex items-center gap-5">
                    <div class="relative flex-shrink-0">
                        ${getTeamSquircle(topTeam.tag, 'w-16 h-16', 'text-xl')}
                        <div class="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-slate-900">
                            #1
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-0.5">Pemuncak Klasemen</div>
                        <h3 class="text-xl font-oswald font-bold text-slate-100 truncate">${topTeam.team_name}</h3>
                        <div class="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span class="font-bold text-emerald-400 font-mono">${topTeam.match_win}W - ${topTeam.match_lose}L</span>
                            <span class="text-slate-600">·</span>
                            <span class="text-slate-300 font-mono">Net: ${topTeam.points > 0 ? '+' + topTeam.points : topTeam.points} Game</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            leaderCard.innerHTML = `
                <div class="text-center py-6 text-slate-500 text-xs">Belum ada data pertandingan.</div>
            `;
        }
    }

    // 3. Pertandingan Mendatang (Upcoming Fixtures)
    const upcomingContainer = document.getElementById('dash-upcoming-list');
    if (upcomingContainer) {
        if (!upcoming || upcoming.length === 0) {
            upcomingContainer.innerHTML = `
                <div class="p-6 text-center text-xs text-slate-400 italic">
                    Semua pertandingan musim reguler telah selesai disimulasikan.
                </div>
            `;
        } else {
            const teamMap = {};
            (teams || []).forEach(t => { teamMap[t.id] = t; });

            let html = '';
            upcoming.forEach(m => {
                const tA = teamMap[m.team_a_id] || { tag: 'TBD', team_name: 'TBD' };
                const tB = teamMap[m.team_b_id] || { tag: 'TBD', team_name: 'TBD' };

                html += `
                    <div class="flex items-center justify-between p-3.5 border-b border-slate-800/80 last:border-0 hover:bg-slate-800/30 transition-colors rounded-xl">
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                            <div class="flex items-center justify-end gap-2.5 flex-1 min-w-0">
                                <span class="font-bold text-xs text-slate-200 truncate">${tA.tag}</span>
                                ${getTeamSquircle(tA.tag, 'w-7 h-7', 'text-[10px]')}
                            </div>

                            <div class="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider flex-shrink-0">
                                VS
                            </div>

                            <div class="flex items-center justify-start gap-2.5 flex-1 min-w-0">
                                ${getTeamSquircle(tB.tag, 'w-7 h-7', 'text-[10px]')}
                                <span class="font-bold text-xs text-slate-200 truncate">${tB.tag}</span>
                            </div>
                        </div>

                        <div class="pl-4 flex-shrink-0 text-right">
                            <span class="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                W${m.week} · D${m.day}
                            </span>
                        </div>
                    </div>
                `;
            });
            upcomingContainer.innerHTML = html;
        }
    }

    // 4. Quick Standings Snapshot (Top 5)
    const topStandingsContainer = document.getElementById('dash-top-standings');
    if (topStandingsContainer && teams) {
        const top5 = teams.slice(0, 5);
        let html = '';
        top5.forEach((t, idx) => {
            const isUpper = idx < 2;
            html += `
                <div class="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0 text-xs">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="w-4 font-mono font-bold ${isUpper ? 'text-emerald-400' : 'text-slate-400'}">${idx + 1}</span>
                        ${getTeamSquircle(t.tag, 'w-6 h-6', 'text-[9px]')}
                        <span class="font-semibold text-slate-200 truncate">${t.team_name}</span>
                    </div>
                    <div class="flex items-center gap-4 font-mono text-xs flex-shrink-0">
                        <span class="text-slate-400">${t.match_win}W-${t.match_lose}L</span>
                        <span class="font-bold text-slate-200 w-8 text-right">${t.points > 0 ? '+' + t.points : t.points}</span>
                    </div>
                </div>
            `;
        });
        topStandingsContainer.innerHTML = html;
    }
}
