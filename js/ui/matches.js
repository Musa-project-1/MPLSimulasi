/**
 * Modul Tampilan Jadwal & Hasil Pertandingan
 * Batas: <450 baris
 */

import { getTeamSquircle } from './components.js';

let currentViewWeek = 1;

export function setCurrentViewWeek(week) { currentViewWeek = parseInt(week); }
export function getCurrentViewWeek() { return currentViewWeek; }

export function renderWeekSelector(matches, activeWeek, onWeekSelect) {
    const container = document.getElementById('week-selector-container');
    if (!container) return;

    // Hitung berapa week yang ada
    const allWeeks = [...new Set((matches || []).map(m => parseInt(m.week)))].sort((a, b) => a - b);
    if (allWeeks.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    allWeeks.forEach(w => {
        const weekMatches = matches.filter(m => parseInt(m.week) === w);
        const comp = weekMatches.filter(m => m.status === 'COMPLETED').length;
        const tot = weekMatches.length;
        const isCompleted = tot > 0 && comp === tot;
        const isActive = w === parseInt(activeWeek);

        let activeClasses = 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200';
        if (isActive) {
            activeClasses = 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20 font-bold';
        }

        html += `
            <button onclick="changeWeek(${w})" aria-pressed="${isActive}" class="week-pill px-3.5 py-2 rounded-xl border text-xs flex items-center gap-2 transition-all flex-shrink-0 ${activeClasses}">
                <span>Minggu ${w}</span>
                <span class="text-[10px] font-mono opacity-80 ${isCompleted ? 'text-emerald-300' : ''}">(${comp}/${tot})</span>
            </button>
        `;
    });

    container.innerHTML = html;
}

export function renderMatchesGrid(weekMatches, teams) {
    const gridContainer = document.getElementById('matches-grid');
    if (!gridContainer) return;

    if (!weekMatches || weekMatches.length === 0) {
        gridContainer.innerHTML = `
            <div class="p-12 text-center text-xs text-slate-500 col-span-full border border-dashed border-slate-800 rounded-2xl">
                Tidak ada pertandingan yang dijadwalkan pada minggu ini.
            </div>
        `;
        return;
    }

    const teamMap = {};
    (teams || []).forEach(t => { teamMap[t.id] = t; });

    // Kelompokkan match berdasarkan hari
    const daysObj = {};
    weekMatches.forEach(m => {
        if (!daysObj[m.day]) {
            daysObj[m.day] = {
                name: m.day_name || `Hari ${m.day}`,
                date: m.date,
                matches: []
            };
        }
        daysObj[m.day].matches.push(m);
    });

    const sortedDays = Object.keys(daysObj).sort((a, b) => a - b);
    let html = '';

    sortedDays.forEach(dayKey => {
        const dayData = daysObj[dayKey];

        html += `
            <div class="day-section mb-6 last:mb-0">
                <div class="flex items-center gap-3 mb-3 px-1">
                    <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                    <h3 class="text-xs font-black uppercase tracking-wider text-slate-300">${dayData.name}</h3>
                    <span class="text-slate-600">·</span>
                    <span class="text-[11px] font-mono text-slate-500">${dayData.date || ''}</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        `;

        dayData.matches.forEach(m => {
            const tA = teamMap[m.team_a_id] || { tag: 'TBD', team_name: 'TBD', id: '' };
            const tB = teamMap[m.team_b_id] || { tag: 'TBD', team_name: 'TBD', id: '' };
            const isCompleted = m.status === 'COMPLETED';

            const scoreA = isCompleted ? m.score_a : '-';
            const scoreB = isCompleted ? m.score_b : '-';
            const aWon = isCompleted && m.score_a > m.score_b;
            const bWon = isCompleted && m.score_b > m.score_a;

            html += `
                <div class="match-card group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/60 border ${isCompleted ? 'border-slate-800/80' : 'border-slate-800'} hover:border-slate-700 transition-all duration-200 shadow-sm">
                    <!-- Match Header & Status -->
                    <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60 text-[10px]">
                        <span class="font-mono text-slate-500 uppercase tracking-widest font-semibold">Match #${m.id.replace('m_', '')}</span>
                        ${isCompleted 
                            ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">Final</span>'
                            : '<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold uppercase tracking-wider">Terjadwal</span>'
                        }
                    </div>

                    <!-- Teams & Big Score Display -->
                    <div class="flex items-center justify-between gap-3 py-1">
                        <!-- Tim A -->
                        <div class="flex items-center gap-2.5 flex-1 min-w-0">
                            ${getTeamSquircle(tA.tag, 'w-9 h-9', 'text-xs')}
                            <div class="min-w-0">
                                <span class="font-bold text-sm block leading-tight ${aWon ? 'text-emerald-400' : 'text-slate-100'} truncate">${tA.tag}</span>
                                <span class="text-[9px] text-slate-500 truncate block">${tA.team_name}</span>
                            </div>
                        </div>

                        <!-- Score Pill -->
                        <div class="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 font-oswald text-lg font-bold flex-shrink-0">
                            <span class="${aWon ? 'text-emerald-400' : 'text-slate-200'}">${scoreA}</span>
                            <span class="text-slate-600 text-xs">:</span>
                            <span class="${bWon ? 'text-emerald-400' : 'text-slate-200'}">${scoreB}</span>
                        </div>

                        <!-- Tim B -->
                        <div class="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
                            <div class="min-w-0">
                                <span class="font-bold text-sm block leading-tight ${bWon ? 'text-emerald-400' : 'text-slate-100'} truncate">${tB.tag}</span>
                                <span class="text-[9px] text-slate-500 truncate block">${tB.team_name}</span>
                            </div>
                            ${getTeamSquircle(tB.tag, 'w-9 h-9', 'text-xs')}
                        </div>
                    </div>

                    <!-- Quick Score Buttons (BO3) -->
                    <div class="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between gap-1.5">
                        <div class="grid grid-cols-4 gap-1 flex-1">
                            <button onclick="handleQuickScore('${m.id}', 2, 0)" title="Kemenangan 2-0 untuk ${tA.tag}" class="px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold transition ${isCompleted && m.score_a === 2 && m.score_b === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'}">
                                2-0
                            </button>
                            <button onclick="handleQuickScore('${m.id}', 2, 1)" title="Kemenangan 2-1 untuk ${tA.tag}" class="px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold transition ${isCompleted && m.score_a === 2 && m.score_b === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'}">
                                2-1
                            </button>
                            <button onclick="handleQuickScore('${m.id}', 1, 2)" title="Kemenangan 2-1 untuk ${tB.tag}" class="px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold transition ${isCompleted && m.score_a === 1 && m.score_b === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'}">
                                1-2
                            </button>
                            <button onclick="handleQuickScore('${m.id}', 0, 2)" title="Kemenangan 2-0 untuk ${tB.tag}" class="px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold transition ${isCompleted && m.score_a === 0 && m.score_b === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'}">
                                0-2
                            </button>
                        </div>

                        ${isCompleted ? `
                            <button onclick="handleQuickScore('${m.id}', '', '')" title="Reset skor ke Terjadwal" class="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition text-xs">
                                <svg class="ph-icon text-lg" aria-hidden="true"><use href="icons/sprite.svg#ph-arrow-counter-clockwise"/></svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
    });

    gridContainer.innerHTML = html;
}
