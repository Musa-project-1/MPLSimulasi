import { TEAM_LOGOS } from './config.js';
import { 
    sessionsList, 
    activeSessionId, 
    activeSessionName, 
    globalTeams, 
    globalMatches,
    saveSessionData,
    getSessionTeams,
    getSessionMatches
} from './store.js';
import { runSimulation } from './simulation.js';

let chartInstance = null;
let currentViewWeek = 1;

export function setCurrentViewWeek(week) { currentViewWeek = week; }
export function getCurrentViewWeek() { return currentViewWeek; }

export function customAlert(message) {
    document.getElementById('alert-message').innerText = message;
    openModal('modal-alert');
}

export function getTeamLogo(tag, customClasses) {
    if (!tag || tag === 'TBD') {
        return `<span class="bg-slate-100 text-slate-400 inline-flex items-center justify-center font-bold text-[10px] ${customClasses} border border-slate-200 flex-shrink-0">?</span>`;
    }
    const logoUrl = TEAM_LOGOS[tag];
    if (logoUrl) {
        return `<img src="${logoUrl}" alt="${tag}" class="object-contain ${customClasses}">`;
    } else {
        return `<span class="bg-slate-200 text-slate-500 inline-flex items-center justify-center font-bold text-[10px] ${customClasses} border border-slate-300 flex-shrink-0">${tag.substring(0,3)}</span>`;
    }
}

export function showLoading(show) { 
    document.getElementById('loading-overlay').classList.toggle('hidden', !show); 
}

export function openModal(id) { 
    const m = document.getElementById(id), c = document.getElementById(id + '-content'); 
    m.classList.remove('hidden'); 
    setTimeout(() => { m.classList.remove('opacity-0'); c.classList.remove('scale-95'); }, 10); 
}

export function closeModal(id) { 
    const m = document.getElementById(id), c = document.getElementById(id + '-content'); 
    if (!m) return;
    m.classList.add('opacity-0'); c.classList.add('scale-95'); 
    setTimeout(() => { m.classList.add('hidden'); }, 300); 
}

export function updateSettingLabel(id, val) {
    document.getElementById('val-setting-' + id).innerText = val + '%';
}

export function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

export function renderSessionManager() {
    const listEl = document.getElementById('session-list');
    listEl.innerHTML = '';
    
    if (sessionsList.length === 0) {
        listEl.innerHTML = `<div class="text-center py-10 text-slate-500 font-medium border border-dashed border-slate-700 rounded-xl bg-slate-800/30">Belum ada sesi tersimpan. Mulai buat sesi simulasi Anda!</div>`;
        return;
    }

    const sortedSessions = [...sessionsList].sort((a,b) => b.timestamp - a.timestamp);

    sortedSessions.forEach(session => {
        const dateObj = new Date(session.timestamp);
        const dateStr = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        const html = `
            <div class="flex justify-between items-center bg-slate-800/80 border border-slate-600 rounded-xl p-4 hover:bg-slate-700 transition cursor-pointer group" onclick="openSession('${session.id}')">
                <div class="flex items-center text-left">
                    <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-emerald-400 mr-4 group-hover:bg-emerald-500 group-hover:text-white transition shadow-inner">
                        <i class="ph-fill ph-game-controller text-xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-white text-lg tracking-wide">${session.name}</h3>
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5"><i class="ph ph-clock mr-1"></i>Last active: ${dateStr}</p>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); deleteSession('${session.id}')" class="text-slate-500 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition" title="Delete Session">
                    <i class="ph-fill ph-trash text-xl"></i>
                </button>
            </div>
        `;
        listEl.innerHTML += html;
    });
}

export function renderChart(topTeams) {
    const ctx = document.getElementById('winRateChart').getContext('2d');
    if(chartInstance) chartInstance.destroy();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#9B111E');
    gradient.addColorStop(1, '#f43f5e');

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topTeams.map(t => t.tag),
            datasets: [{ 
                label: 'Points', 
                data: topTeams.map(t => t.points), 
                backgroundColor: gradient,
                hoverBackgroundColor: '#7a0d18',
                borderRadius: 8,
                barThickness: 32
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleFont: { family: 'Oswald', size: 14 },
                    bodyFont: { family: 'Inter', size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            }, 
            scales: { 
                y: { 
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', weight: 'bold' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Oswald', size: 12 } }
                }
            } 
        }
    });
}

export function renderPlayoffBracket(data) {
    const container = document.getElementById('playoff-bracket-container');
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
                        <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">${match.id === 'p7' ? 'GRAND FINAL' : 'MATCH ' + match.id}</span>
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

export function switchTab(viewId, element) {
    document.querySelectorAll('header nav a').forEach(el => {
        el.classList.remove('nav-active'); 
        el.classList.add('text-slate-600');
    });
    if(element) {
        element.classList.add('nav-active'); 
        element.classList.remove('text-slate-600');
    }
    
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden');
        el.style.animation = 'none';
        el.offsetHeight; /* trigger reflow */
        el.style.animation = null;
    });
    
    const targetView = document.getElementById('view-' + viewId);
    if(viewId === 'matches') {
        targetView.classList.remove('hidden');
        targetView.classList.add('flex');
    } else {
        targetView.classList.remove('hidden');
    }

    if(viewId === 'dashboard') window.loadDashboard();
    if(viewId === 'standings') window.loadStandings();
    if(viewId === 'matches') window.loadMatches();
    if(viewId === 'teams') window.loadTeams();
}

export function switchSubTab(tabId) {
    document.getElementById('btn-tab-standing').className = tabId === 'standing' 
        ? "px-4 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm rounded-md font-bold text-sm transition" 
        : "px-4 py-2 text-slate-600 rounded-md font-medium text-sm hover:text-[var(--text-primary)] transition";
    document.getElementById('btn-tab-prob').className = tabId === 'prob' 
        ? "px-4 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm rounded-md font-bold text-sm transition" 
        : "px-4 py-2 text-slate-600 rounded-md font-medium text-sm hover:text-[var(--text-primary)] transition";

    const tabStanding = document.getElementById('tab-standing');
    const tabProb = document.getElementById('tab-prob');
    
    tabStanding.classList.toggle('hidden', tabId !== 'standing');
    tabProb.classList.toggle('hidden', tabId !== 'prob');
    
    const activeTab = tabId === 'standing' ? tabStanding : tabProb;
    activeTab.style.animation = 'none';
    activeTab.offsetHeight;
    activeTab.style.animation = null;
}

export function switchMatchSubTab(tabId) {
    const btnRegular = document.getElementById('btn-match-regular');
    const btnPlayoffs = document.getElementById('btn-match-playoffs');
    const contRegular = document.getElementById('container-match-regular');
    const contPlayoffs = document.getElementById('container-match-playoffs');

    if (tabId === 'regular') {
        btnRegular.className = "pb-2 border-b-2 border-[#9B111E] text-[#9B111E] font-semibold px-2 uppercase tracking-wide text-sm transition-all";
        btnPlayoffs.className = "pb-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-semibold px-2 uppercase tracking-wide text-sm transition-all";
        contRegular.classList.remove('hidden');
        contPlayoffs.classList.add('hidden');
    } else {
        btnPlayoffs.className = "pb-2 border-b-2 border-[#9B111E] text-[#9B111E] font-semibold px-2 uppercase tracking-wide text-sm transition-all";
        btnRegular.className = "pb-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-semibold px-2 uppercase tracking-wide text-sm transition-all";
        contRegular.classList.add('hidden');
        contPlayoffs.classList.remove('hidden');
        if (window.loadPlayoffs) window.loadPlayoffs();
    }
}

export function switchSettingsSection(sectionId) {
    // Update Sidebar Buttons
    document.querySelectorAll('.settings-nav-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-indigo-600', 'text-white', 'shadow-lg');
        btn.classList.add('text-[var(--text-secondary)]', 'hover:bg-[var(--bg-input)]');
    });
    
    const activeBtn = document.getElementById('btn-settings-' + sectionId);
    if (activeBtn) {
        activeBtn.classList.add('active', 'bg-indigo-600', 'text-white', 'shadow-lg');
        activeBtn.classList.remove('text-[var(--text-secondary)]', 'hover:bg-[var(--bg-input)]');
    }

    // Update Section Visibility
    document.querySelectorAll('.settings-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById('section-settings-' + sectionId).classList.remove('hidden');

    // Update Header Title
    const titles = {
        'engine': 'Simulation Engine',
        'appearance': 'Interface & Visuals',
        'system': 'System Administration'
    };
    document.getElementById('settings-section-title').innerText = titles[sectionId] || 'Settings';
}

export async function loadDashboard(data) {
    if(!data) return;
    
    // 1. Progress Bar Update
    const progressPct = data.total_matches > 0 ? Math.round((data.completed_matches / data.total_matches) * 100) : 0;
    const bar = document.getElementById('dash-progress-bar');
    bar.style.width = `${progressPct}%`;
    document.getElementById('dash-progress-text').innerText = `${data.completed_matches} / ${data.total_matches} Match (${progressPct}%)`;

    // 2. Upcoming Matches Update
    const upcomingContainer = document.getElementById('dash-upcoming-list');
    upcomingContainer.innerHTML = '';
    if(data.upcoming_matches && data.upcoming_matches.length > 0) {
        data.upcoming_matches.forEach(m => {
            const tA = globalTeams.find(t => t.id === m.team_a_id) || { tag: 'TBD' };
            const tB = globalTeams.find(t => t.id === m.team_b_id) || { tag: 'TBD' };
            
            upcomingContainer.innerHTML += `
                <div class="flex items-center justify-between p-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-secondary)] transition-all cursor-default group">
                    <div class="flex items-center gap-4 flex-1">
                        <div class="flex flex-col items-end w-1/3">
                            <span class="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--mpl-red)] transition-colors">${tA.tag}</span>
                        </div>
                        <div class="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] group-hover:bg-[var(--mpl-red)] group-hover:text-white transition-all">VS</div>
                        <div class="flex flex-col items-start w-1/3">
                            <span class="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--mpl-red)] transition-colors">${tB.tag}</span>
                        </div>
                    </div>
                    <div class="w-20 text-right">
                        <span class="text-[10px] font-bold text-[var(--mpl-red)] bg-[var(--mpl-red-glow)] border border-[var(--mpl-red)]/20 px-2 py-1 rounded-full uppercase tracking-tighter">Week ${m.week}</span>
                    </div>
                </div>
            `;
        });
    } else {
        upcomingContainer.innerHTML = `<p class="text-sm text-slate-500 italic p-6 text-center">Semua pertandingan reguler telah selesai disimulasikan!</p>`;
    }

    // 3. Top Team
    const topTeam = data.top_teams[0];
    if (topTeam) {
        document.getElementById('top-team-name').innerText = topTeam.team_name;
        document.getElementById('top-team-logo').innerHTML = getTeamLogo(topTeam.tag, "w-16 h-16 drop-shadow-md transform hover:scale-110 transition-transform duration-500");
        document.getElementById('top-team-points').innerText = topTeam.points;
    } else {
        document.getElementById('top-team-name').innerText = "Belum Ada";
        document.getElementById('top-team-logo').innerHTML = "?";
        document.getElementById('top-team-points').innerText = "0";
    }
    renderChart(data.top_teams);
}

export function loadStandings(teams, simTeams) {
    const totalTeams = teams.length;
    // Calculate max matches per team based on total matches in session / (total teams / 2)
    const maxMatches = globalMatches.length > 0 ? (globalMatches.length / (totalTeams / 2)) : 0;
    
    const tbodyStanding = document.getElementById('standings-table-body');
    tbodyStanding.innerHTML = '';
    
    teams.forEach((t, index) => {
        const sisa = Math.max(0, Math.round(maxMatches - parseInt(t.match_played)));
        const wrMatch = t.match_played > 0 ? Math.round((t.match_win / t.match_played) * 100) + '%' : '0%';
        const totalGame = parseInt(t.game_win) + parseInt(t.game_lose);
        const wrGame = totalGame > 0 ? Math.round((t.game_win / totalGame) * 100) + '%' : '0%';

        const tr = document.createElement('tr');
        
        let zoneClass = '';
        if (index < 2) zoneClass = 'zone-upper';
        else if (index < 6) zoneClass = 'zone-playin';
        else zoneClass = 'zone-elim';

        tr.className = `hover:brightness-95 transition-all ${zoneClass} ${index === 1 || index === 5 ? 'border-b-2 border-[var(--border-color)]' : ''}`;

        tr.innerHTML = `
            <td class="px-3 py-2 font-medium">${index + 1}</td>
            <td class="px-4 py-2 text-left font-semibold flex items-center">
                ${getTeamLogo(t.tag, 'w-6 h-6 mr-2')}
                ${t.team_name}
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

        const tabStanding = document.getElementById('tab-standing');
        if (!document.getElementById('standing-legend')) {
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
        });}

export function loadMatches(data) {
    const timelineContainer = document.getElementById('timeline-container');
    let timelineHtml = `<div class="absolute left-6 right-6 h-[1px] border-b border-dashed border-slate-300 top-1/2 -z-10"></div>`;
    
    const maxWeek = data.length > 0 ? Math.max(...data.map(m => parseInt(m.week))) : 1;

    for(let i=1; i<=maxWeek; i++) {
        const isActive = i === currentViewWeek;
        const dotColor = isActive ? 'bg-[#9B111E]' : 'bg-slate-800';
        const textColor = isActive ? 'text-[#9B111E] font-bold' : 'text-slate-500';
        
        timelineHtml += `
            <div class="flex flex-col items-center cursor-pointer z-10 bg-[var(--bg-main)] px-1 md:px-4 transition-transform hover:-translate-y-1" onclick="changeWeek(${i})">
                <span class="text-xs mb-2 ${textColor} transition-colors whitespace-nowrap">Week ${i}</span>
                <div class="w-2.5 h-2.5 rounded-full ${dotColor} transition-colors ring-4 ring-[var(--bg-main)]"></div>
            </div>
        `;
    }
    timelineContainer.innerHTML = timelineHtml;
    
    const weekMatches = data.filter(m => parseInt(m.week) === currentViewWeek);
    
    const daysObj = {};
    weekMatches.forEach(m => {
        if(!daysObj[m.day]) daysObj[m.day] = { name: m.day_name, date: m.date, matches: [] };
        daysObj[m.day].matches.push(m);
    });

    const sortedDays = Object.keys(daysObj).sort((a,b) => a - b);
    const gridContainer = document.getElementById('matches-grid');
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
            const d = new Date(dayData.date);
            if(!isNaN(d)) {
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                formattedDate = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
            }
        } catch(e) {}

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

            dayColumnHtml += `
                <div class="border-b border-dashed border-[var(--border-color)] py-6 last:border-0 relative hover:bg-[var(--bg-secondary)] rounded transition-colors group">
                    <div class="flex justify-between items-center px-4 w-full">
                        
                        <div onclick="openTeamPicker('${match.id}', 'home')" class="flex flex-col items-center w-[30%] relative cursor-pointer group-hover:scale-105 transition-transform" title="Klik untuk memilih tim">
                            ${getTeamLogo(teamA.tag, 'h-10 w-10 object-contain drop-shadow-sm')}
                            <span class="text-xs font-bold mt-2 text-[var(--text-primary)] truncate w-full text-center">${teamA.tag}</span>
                        </div>

                        <div class="flex flex-col items-center w-[40%] z-10 gap-1">
                            <div class="flex justify-center items-center gap-2">
                                <span class="text-[2.2rem] font-medium text-[var(--text-primary)] font-oswald">${match.score_a !== "" ? match.score_a : '-'}</span>
                                <span class="text-2xl font-light text-slate-300">-</span>
                                <span class="text-[2.2rem] font-medium text-[var(--text-primary)] font-oswald">${match.score_b !== "" ? match.score_b : '-'}</span>
                            </div>
                            
                            ${match.status === 'COMPLETED' ? `
                                <div class="flex gap-1">
                                    <button onclick="quickSetScore('${match.id}', '', '')" class="text-[9px] font-black uppercase tracking-tighter text-slate-500 bg-[var(--bg-secondary)] px-2 py-0.5 rounded hover:bg-rose-500 hover:text-white transition-all" title="Reset Skor">RESET</button>
                                    <button onclick="openMatchDetailsModal('${match.id}')" class="text-[9px] font-black uppercase tracking-tighter text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded hover:bg-blue-600 hover:text-white transition-all">EDIT MVP</button>
                                    <button onclick="shareMatchResult('${match.id}')" class="text-[9px] font-black uppercase tracking-tighter text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition-all" title="Share Graphic"><i class="ph ph-share-network"></i></button>
                                </div>
                            ` : `
                                <div class="flex flex-wrap justify-center gap-1 mt-1">
                                    <button onclick="quickSetScore('${match.id}', 2, 0)" class="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded hover:bg-[var(--mpl-red)] hover:text-white transition-all">2-0</button>
                                    <button onclick="quickSetScore('${match.id}', 2, 1)" class="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded hover:bg-[var(--mpl-red)] hover:text-white transition-all">2-1</button>
                                    <button onclick="quickSetScore('${match.id}', 1, 2)" class="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded hover:bg-[var(--mpl-red)] hover:text-white transition-all">1-2</button>
                                    <button onclick="quickSetScore('${match.id}', 0, 2)" class="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded hover:bg-[var(--mpl-red)] hover:text-white transition-all">0-2</button>
                                </div>
                                <button onclick="openMatchDetailsModal('${match.id}')" class="text-[9px] font-black uppercase tracking-tighter text-blue-600 mt-1 hover:underline transition-all">Detail & MVP</button>
                            `}
                        </div>
                        
                        <div onclick="openTeamPicker('${match.id}', 'away')" class="flex flex-col items-center w-[30%] relative cursor-pointer group-hover:scale-105 transition-transform" title="Klik untuk memilih tim">
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

export function loadTeams(teams) {
    const grid = document.getElementById('teams-grid');
    const rosterView = document.getElementById('roster-view');
    const backBtn = document.getElementById('btn-back-to-teams');

    if (!grid || !rosterView || !backBtn) return;

    grid.classList.remove('hidden');
    rosterView.classList.add('hidden');
    backBtn.classList.add('hidden');

    grid.innerHTML = '';
    
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 text-center glass-panel border-dashed rounded-2xl shadow-sm">
                <i class="ph ph-warning-circle text-5xl text-slate-300 mb-4 block"></i>
                <p class="text-slate-500 font-medium">Tidak ada tim yang ditemukan dalam sesi ini.</p>
            </div>
        `;
        return;
    }

    teams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'glass-panel p-6 rounded-2xl flex flex-col items-center text-center shadow-sm relative group cursor-pointer hover:border-[var(--mpl-red)]';
        card.onclick = () => window.showRoster(team.id);
        card.innerHTML = `
            <div class="absolute top-4 right-4 text-slate-400 group-hover:text-[var(--mpl-red)] transition-colors">
                <i class="ph ph-users-three text-2xl"></i>
            </div>
            ${getTeamLogo(team.tag, 'w-20 h-20 mb-4 group-hover:scale-110 transition-transform')}
            <h3 class="font-bold text-xl text-[var(--text-primary)] font-oswald tracking-wide">${team.team_name}</h3>
            <p class="text-xs font-bold text-[var(--mpl-red)] mt-1 uppercase tracking-widest opacity-60">${team.tag}</p>
            <div class="mt-6 pt-4 border-t border-[var(--border-color)] w-full flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>${team.points} Points</span>
                <span class="text-blue-500 hover:underline">View Roster &rarr;</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

export let activeRosterTeamId = null;

export function showRoster(teamId) {
    activeRosterTeamId = teamId;
    document.getElementById('teams-grid').classList.add('hidden');
    document.getElementById('roster-view').classList.remove('hidden');
    document.getElementById('btn-back-to-teams').classList.remove('hidden');
    renderRoster(teamId);
}

export function renderRoster(teamId) {
    const team = globalTeams.find(t => t.id === teamId);
    if (!team) return;

    document.getElementById('roster-team-logo').innerHTML = getTeamLogo(team.tag, 'w-24 h-24');
    document.getElementById('roster-team-name').innerText = team.team_name;
    document.getElementById('roster-team-tag').innerText = team.tag;
    document.getElementById('roster-team-points').innerText = `${team.points} Points`;

    const rosterList = document.getElementById('roster-list');
    rosterList.innerHTML = '';
    
    if (!team.roster) {
        const roles = ["EXP Laner", "Jungler", "Mid Laner", "Gold Laner", "Roamer"];
        team.roster = roles.map((role, i) => ({
            id: `p_${team.id}_${i}`,
            nick: `${team.tag}_Player${i+1}`,
            role: role,
            stats: { kills: 0, deaths: 0, assists: 0, mvp: 0 }
        }));
        saveSessionData(globalTeams, globalMatches);
    }

    team.roster.forEach(p => {
        const fatigue = p.fatigue || 0;
        let fatigueClass = 'fatigue-low';
        if (fatigue > 60) fatigueClass = 'fatigue-high';
        else if (fatigue > 30) fatigueClass = 'fatigue-mid';

        rosterList.innerHTML += `
            <div class="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl hover:border-blue-400 transition group shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                        ${p.role.substring(0,1)}
                    </div>
                    <div>
                        <p class="font-bold text-[var(--text-primary)] text-lg leading-none mb-1">${p.nick}</p>
                        <div class="flex items-center gap-2">
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${p.role}</p>
                            <div class="fatigue-bar" title="Fatigue: ${fatigue}%">
                                <div class="fatigue-fill ${fatigueClass}" style="width: ${fatigue}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <button onclick="openEditPlayerModal('${p.id}', '${p.nick}', '${p.role}')" class="p-2 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition">
                    <i class="ph ph-pencil-simple text-xl"></i>
                </button>
            </div>
        `;
    });

    const statsBody = document.getElementById('player-stats-body');
    statsBody.innerHTML = '';
    team.roster.forEach(p => {
        statsBody.innerHTML += `
            <tr class="hover:bg-[var(--bg-secondary)] transition-colors">
                <td class="px-4 py-4">
                    <p class="font-bold text-[var(--text-primary)]">${p.nick}</p>
                </td>
                <td class="px-2 py-4 text-center">
                    <span class="text-[9px] font-black bg-[var(--bg-secondary)] px-2 py-0.5 rounded text-[var(--text-secondary)] uppercase">${p.role}</span>
                </td>
                <td class="px-2 py-4 text-center font-mono font-bold text-[var(--text-primary)]">
                    ${p.stats.kills}/${p.stats.deaths}/${p.stats.assists}
                </td>
                <td class="px-2 py-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                        <i class="ph-fill ph-crown text-amber-400"></i>
                        <span class="font-bold text-amber-700">${p.stats.mvp}</span>
                    </div>
                </td>
            </tr>
        `;
    });
}

// --- DATABASE ADMIN ---
export let activeAdminTemplate = 'standard';

export function renderDatabaseAdmin(templateKey, templateData, allTeams) {
    activeAdminTemplate = templateKey;
    
    // Update active nav button
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-slate-800', 'text-white');
        btn.classList.add('hover:bg-slate-200');
    });
    const activeBtn = document.getElementById('admin-nav-' + templateKey);
    if (activeBtn) {
        activeBtn.classList.add('active', 'bg-slate-800', 'text-white');
        activeBtn.classList.remove('hover:bg-slate-200');
    }

    // Update info
    document.getElementById('admin-template-info').innerText = templateData.name || templateKey;

    const list = document.getElementById('admin-matchup-list');
    list.innerHTML = '';

    const matchups = templateData.matchups || [];
    
    matchups.forEach((m, index) => {
        list.appendChild(createMatchupRow(m, index, allTeams));
    });

    if (matchups.length === 0) {
        list.innerHTML = `
            <div class="py-12 text-center text-slate-400">
                <i class="ph ph-mask-sad text-4xl mb-2"></i>
                <p class="text-sm font-medium">Belum ada jadwal yang diatur untuk template ini.</p>
            </div>
        `;
    }
}

function createMatchupRow(m, index, allTeams) {
    const row = document.createElement('div');
    row.className = "flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all admin-matchup-item";
    row.dataset.index = index;

    let teamAOpts = `<option value="">- TBD -</option>`;
    let teamBOpts = `<option value="">- TBD -</option>`;

    allTeams.forEach(t => {
        teamAOpts += `<option value="${t.tag}" ${m.teamA === t.tag ? 'selected' : ''}>${t.tag} (${t.team_name})</option>`;
        teamBOpts += `<option value="${t.tag}" ${m.teamB === t.tag ? 'selected' : ''}>${t.tag} (${t.team_name})</option>`;
    });

    row.innerHTML = `
        <div class="flex flex-col gap-1">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Week</label>
            <input type="number" class="admin-input-week w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-emerald-500" value="${m.week || 1}" min="1">
        </div>
        <div class="flex flex-col gap-1">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Day</label>
            <input type="number" class="admin-input-day w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-emerald-500" value="${m.day || 1}" min="1">
        </div>
        
        <div class="flex-1 grid grid-cols-2 gap-4 items-center px-4">
            <div class="flex flex-col gap-1">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-left">Home Team</label>
                <select class="admin-input-teamA w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-emerald-500 transition cursor-pointer">
                    ${teamAOpts}
                </select>
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-left">Away Team</label>
                <select class="admin-input-teamB w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-emerald-500 transition cursor-pointer">
                    ${teamBOpts}
                </select>
            </div>
        </div>

        <button onclick="removeMatchupRow(${index})" class="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
            <i class="ph ph-trash text-lg"></i>
        </button>
    `;

    return row;
}

export function addEmptyMatchupRow(allTeams) {
    const list = document.getElementById('admin-matchup-list');
    const index = list.querySelectorAll('.admin-matchup-item').length;
    
    // Check if empty message exists
    if (list.querySelector('.py-12')) list.innerHTML = '';

    const newMatch = { week: 1, day: 1, teamA: "", teamB: "" };
    list.appendChild(createMatchupRow(newMatch, index, allTeams));
    
    // Scroll to bottom
    const editor = list.parentElement;
    editor.scrollTop = editor.scrollHeight;
}

