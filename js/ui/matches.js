/**
 * Match Schedule and Results UI Renderer
 */

import { globalTeams } from '../store.js';
import { currentViewWeek, getTeamLogo } from './core.js';

let activeTeamFilter = '';

export function setActiveTeamFilter(teamId) {
    activeTeamFilter = teamId;
    if (window.loadMatches) window.loadMatches();
}

export function loadMatches(data = []) {
    const timelineContainer = document.getElementById('timeline-container');
    if (timelineContainer) {
        let timelineHtml = `<div class="absolute left-6 right-6 h-[1px] border-b border-dashed border-slate-300 top-1/2 -z-10"></div>`;
        const maxWeek = data.length > 0 ? Math.max(...data.map(m => parseInt(m.week) || 1)) : 1;

        for (let i = 1; i <= maxWeek; i++) {
            const isActive = i === currentViewWeek;
            const dotColor = isActive ? 'bg-rose-600' : 'bg-slate-800';
            const textColor = isActive ? 'text-rose-500 font-bold' : 'text-slate-500';

            timelineHtml += `
                <div class="flex flex-col items-center cursor-pointer z-10 bg-[var(--bg-main)] px-1 md:px-4 transition-transform hover:-translate-y-1" onclick="changeWeek(${i})">
                    <span class="text-xs mb-2 ${textColor} transition-colors whitespace-nowrap">Week ${i}</span>
                    <div class="w-2.5 h-2.5 rounded-full ${dotColor} transition-colors ring-4 ring-[var(--bg-main)]"></div>
                </div>
            `;
        }
        timelineContainer.innerHTML = timelineHtml;
    }

    // Render Team Filter Pills
    const filterContainer = document.getElementById('team-filter-container');
    if (filterContainer && globalTeams.length > 0) {
        let filterHtml = `
            <button onclick="setActiveTeamFilter('')" class="px-3 py-1 rounded-full text-[11px] font-bold transition-all ${!activeTeamFilter ? 'bg-rose-600 text-white shadow-sm' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}">
                Semua Tim
            </button>
        `;
        globalTeams.forEach(t => {
            const isSelected = activeTeamFilter === t.id;
            filterHtml += `
                <button onclick="setActiveTeamFilter('${t.id}')" class="px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${isSelected ? 'bg-rose-600 text-white shadow-sm' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}">
                    ${getTeamLogo(t.tag, 'w-3.5 h-3.5')}
                    <span>${t.tag}</span>
                </button>
            `;
        });
        filterContainer.innerHTML = filterHtml;
    }

    let weekMatches = data.filter(m => parseInt(m.week) === currentViewWeek);
    if (activeTeamFilter) {
        weekMatches = weekMatches.filter(m => m.team_a_id === activeTeamFilter || m.team_b_id === activeTeamFilter);
    }

    const daysObj = {};
    weekMatches.forEach(m => {
        if (!daysObj[m.day]) daysObj[m.day] = { name: m.day_name, date: m.date, matches: [] };
        daysObj[m.day].matches.push(m);
    });

    const sortedDays = Object.keys(daysObj).sort((a, b) => a - b);
    const gridContainer = document.getElementById('matches-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    const getTeam = id => {
        if (!id) return { team_name: '- TBD -', tag: 'TBD', id: '' };
        const t = globalTeams.find(x => x.id === id);
        return t ? t : { team_name: '- TBD -', tag: 'TBD', id: '' };
    };

    sortedDays.forEach((dayKey) => {
        const dayData = daysObj[dayKey];
        const matches = dayData.matches;

        let formattedDate = dayData.date;
        try {
            if (dayData.date && typeof dayData.date === 'string') {
                const parts = dayData.date.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    const d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) {
                        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                        formattedDate = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
                    }
                }
            }
        } catch (_) {}

        let dayColumnHtml = `
            <div class="glass-panel border-dashed rounded-lg flex flex-col shadow-sm pb-2 h-max">
                <div class="text-center py-4 border-b border-[var(--border-color)] border-dashed bg-[var(--bg-secondary)]">
                    <span class="text-sm font-semibold text-[var(--text-primary)] block">${dayData.name}</span>
                    <span class="text-[10px] text-slate-500 font-medium">${formattedDate}</span>
                </div>
                <div class="flex-1 flex flex-col pt-2">
        `;

        matches.forEach((match) => {
            const teamA = getTeam(match.team_a_id);
            const teamB = getTeam(match.team_b_id);

            const isCompleted = match.status === 'COMPLETED';
            const winA = isCompleted && parseInt(match.score_a) > parseInt(match.score_b);
            const winB = isCompleted && parseInt(match.score_b) > parseInt(match.score_a);

            dayColumnHtml += `
                <div class="border-b border-dashed border-[var(--border-color)] py-6 last:border-0 relative hover:bg-[var(--bg-secondary)] rounded-2xl transition-colors group">
                    <div class="flex justify-between items-center px-4 w-full">
                        
                        <div onclick="openTeamPicker('${match.id}', 'home')" class="flex flex-col items-center w-[30%] relative cursor-pointer group-hover:scale-105 transition-transform" title="Pilih Tim Home">
                            ${getTeamLogo(teamA.tag, 'h-10 w-10 object-contain drop-shadow-sm')}
                            <span class="text-xs font-bold mt-2 text-[var(--text-primary)] truncate w-full text-center">${teamA.tag}</span>
                        </div>

                        <div class="flex flex-col items-center w-[40%] z-10 gap-1">
                            <div class="flex justify-center items-center gap-2">
                                <span class="text-[2.2rem] font-medium font-oswald ${winA ? 'text-emerald-500 font-bold' : 'text-[var(--text-primary)]'}">${match.score_a !== "" ? match.score_a : '-'}</span>
                                <span class="text-xl font-light text-slate-400">:</span>
                                <span class="text-[2.2rem] font-medium font-oswald ${winB ? 'text-emerald-500 font-bold' : 'text-[var(--text-primary)]'}">${match.score_b !== "" ? match.score_b : '-'}</span>
                            </div>
                            
                            ${match.status === 'COMPLETED' ? `
                                <div class="flex gap-1">
                                    <button onclick="quickSetScore('${match.id}', '', '')" class="text-[9px] font-black uppercase tracking-tighter text-slate-500 bg-[var(--bg-secondary)] px-2 py-0.5 rounded hover:bg-rose-500 hover:text-white transition-all" title="Reset Skor">RESET</button>
                                    <button onclick="openMatchDetailsModal('${match.id}')" class="text-[9px] font-black uppercase tracking-tighter text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded hover:bg-blue-600 hover:text-white transition-all">EDIT MVP</button>
                                    <button onclick="shareMatchResult('${match.id}')" class="text-[9px] font-black uppercase tracking-tighter text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition-all" title="Share Graphic"><i class="ph ph-share-network"></i></button>
                                </div>
                            ` : `
                                <div class="flex flex-wrap justify-center gap-1 mt-1">
                                    <button onclick="quickSetScore('${match.id}', 2, 0)" class="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded hover:bg-rose-600 hover:text-white transition-all">2-0</button>
                                    <button onclick="quickSetScore('${match.id}', 2, 1)" class="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded hover:bg-rose-600 hover:text-white transition-all">2-1</button>
                                    <button onclick="quickSetScore('${match.id}', 1, 2)" class="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded hover:bg-rose-600 hover:text-white transition-all">1-2</button>
                                    <button onclick="quickSetScore('${match.id}', 0, 2)" class="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded hover:bg-rose-600 hover:text-white transition-all">0-2</button>
                                </div>
                                <button onclick="openMatchDetailsModal('${match.id}')" class="text-[9px] font-black uppercase tracking-tighter text-blue-600 mt-1 hover:underline transition-all">Detail & MVP</button>
                            `}
                        </div>
                        
                        <div onclick="openTeamPicker('${match.id}', 'away')" class="flex flex-col items-center w-[30%] relative cursor-pointer group-hover:scale-105 transition-transform" title="Pilih Tim Away">
                            ${getTeamLogo(teamB.tag, 'h-10 w-10 object-contain drop-shadow-sm')}
                            <span class="text-xs font-bold mt-2 text-[var(--text-primary)] truncate w-full text-center">${teamB.tag}</span>
                        </div>
                        
                    </div>
                </div>
            `;
        });

        dayColumnHtml += `
                </div>
            </div>
        `;
        gridContainer.innerHTML += dayColumnHtml;
    });

    if (sortedDays.length === 0) {
        gridContainer.innerHTML = `
            <div class="col-span-full py-16 text-center glass-panel border-dashed rounded-xl shadow-sm">
                <i class="ph ph-calendar-blank text-5xl text-slate-300 mb-4 block"></i>
                <p class="text-slate-500 font-medium">Jadwal pada minggu ini kosong.</p>
            </div>
        `;
    }
}
