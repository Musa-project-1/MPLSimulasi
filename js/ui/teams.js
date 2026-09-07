/**
 * Teams & Roster UI Component
 */

import { globalTeams, globalMatches, saveSessionData } from '../store.js';
import { getTeamLogo } from './core.js';

export let activeRosterTeamId = null;
if (typeof window !== 'undefined') {
    window.activeRosterTeamId = activeRosterTeamId;
}

export function loadTeams(teams = []) {
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
        card.onclick = () => showRoster(team.id);
        card.innerHTML = `
            <div class="absolute top-4 right-4 text-slate-400 group-hover:text-[var(--mpl-red)] transition-colors">
                <i class="ph ph-users-three text-2xl"></i>
            </div>
            ${getTeamLogo(team.tag, 'w-20 h-20 mb-4 group-hover:scale-110 transition-transform')}
            <h3 class="font-bold text-xl text-[var(--text-primary)] font-oswald tracking-wide">${team.team_name}</h3>
            <p class="text-xs font-bold text-[var(--mpl-red)] mt-1 uppercase tracking-widest opacity-60">${team.tag}</p>
            <div class="mt-6 pt-4 border-t border-[var(--border-color)] w-full flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>${team.points || 0} Points</span>
                <span class="text-blue-500 hover:underline">View Roster &rarr;</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

export function showRoster(teamId) {
    activeRosterTeamId = teamId;
    if (typeof window !== 'undefined') {
        window.activeRosterTeamId = teamId;
    }

    document.getElementById('teams-grid')?.classList.add('hidden');
    document.getElementById('roster-view')?.classList.remove('hidden');
    document.getElementById('btn-back-to-teams')?.classList.remove('hidden');
    renderRoster(teamId);
}

export function renderRoster(teamId) {
    const team = globalTeams.find(t => t.id === teamId);
    if (!team) return;

    const logoEl = document.getElementById('roster-team-logo');
    const nameEl = document.getElementById('roster-team-name');
    const tagEl = document.getElementById('roster-team-tag');
    const pointsEl = document.getElementById('roster-team-points');

    if (logoEl) logoEl.innerHTML = getTeamLogo(team.tag, 'w-24 h-24');
    if (nameEl) nameEl.innerText = team.team_name;
    if (tagEl) tagEl.innerText = team.tag;
    if (pointsEl) pointsEl.innerText = `${team.points || 0} Points`;

    const rosterList = document.getElementById('roster-list');
    if (!rosterList) return;
    rosterList.innerHTML = '';

    if (!team.roster) {
        const roles = ["EXP Laner", "Jungler", "Mid Laner", "Gold Laner", "Roamer"];
        team.roster = roles.map((role, i) => ({
            id: `p_${team.id}_${i}`,
            nick: `${team.tag}_Player${i + 1}`,
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
                        ${p.role.substring(0, 1)}
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
    if (statsBody) {
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
                            <span class="font-bold text-amber-700">${p.stats.mvp || 0}</span>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
}
