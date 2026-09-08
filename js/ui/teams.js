/**
 * Teams & Roster UI Component
 */

import { globalTeams, globalMatches, saveSessionData } from '../store.js';
import { getTeamLogo, openModal, closeModal, showToast, showLoading, escapeHTML } from './core.js';
import { isAdminLoggedIn } from '../modules/admin_auth.js';
import * as TeamsDB from '../modules/teams_db.js';

export let activeRosterTeamId = null;
if (typeof window !== 'undefined') {
    window.activeRosterTeamId = activeRosterTeamId;
}

export function loadTeams(teams = []) {
    const grid = document.getElementById('teams-grid');
    const rosterView = document.getElementById('roster-view');
    const backBtn = document.getElementById('btn-back-to-teams');
    const adminActions = document.getElementById('admin-teams-actions');

    if (!grid || !rosterView || !backBtn) return;

    grid.classList.remove('hidden');
    rosterView.classList.add('hidden');
    backBtn.classList.add('hidden');

    const isAdmin = isAdminLoggedIn();
    if (adminActions) {
        adminActions.classList.toggle('hidden', !isAdmin);
    }

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
        card.className = 'glass-panel p-6 rounded-2xl flex flex-col items-center text-center shadow-sm relative group hover:border-rose-500/50 transition-all';
        card.innerHTML = `
            <div class="absolute top-4 right-4 flex items-center gap-1 z-10">
                ${isAdmin ? `
                    <button onclick="event.stopPropagation(); openEditTeamModalById('${team.id}')" class="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-500/10 transition" title="Edit Tim">
                        <i class="ph ph-pencil-simple text-base"></i>
                    </button>
                    <button onclick="event.stopPropagation(); handleDeleteTeam('${team.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-500/10 transition" title="Hapus Tim">
                        <i class="ph ph-trash text-base"></i>
                    </button>
                ` : `
                    <div class="text-slate-400 group-hover:text-rose-500 transition-colors">
                        <i class="ph ph-users-three text-xl"></i>
                    </div>
                `}
            </div>
            <div onclick="showRoster('${team.id}')" class="cursor-pointer flex flex-col items-center w-full">
                ${getTeamLogo(team.tag, 'w-20 h-20 mb-4 group-hover:scale-110 transition-transform drop-shadow-sm')}
                <h3 class="font-bold text-xl text-[var(--text-primary)] font-oswald tracking-wide">${escapeHTML(team.team_name)}</h3>
                <p class="text-xs font-bold text-rose-500 mt-1 uppercase tracking-widest opacity-80">${escapeHTML(team.tag)}</p>
                <div class="mt-6 pt-4 border-t border-[var(--border-color)] w-full flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>${team.points || 0} Points</span>
                    <span class="text-blue-500 hover:underline">View Roster &rarr;</span>
                </div>
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

    const isAdmin = isAdminLoggedIn();
    const addPlayerBtn = document.getElementById('btn-add-player-roster');
    if (addPlayerBtn) {
        addPlayerBtn.classList.toggle('hidden', !isAdmin);
    }

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

    if (!team.roster || team.roster.length === 0) {
        const defaultRoles = ["EXP Laner", "Jungler", "Mid Laner", "Gold Laner", "Roamer"];
        team.roster = defaultRoles.map((role, i) => ({
            id: `p_${team.id}_${i + 1}`,
            nick: `${team.tag}_Player${i + 1}`,
            role,
            fatigue: 0,
            stats: { kills: 0, deaths: 0, assists: 0, mvp: 0 }
        }));
        saveSessionData(globalTeams, globalMatches);
    }

    team.roster.forEach(p => {
        const fatigue = p.fatigue || 0;
        let fatigueClass = 'fatigue-low';
        if (fatigue > 60) fatigueClass = 'fatigue-high';
        else if (fatigue > 30) fatigueClass = 'fatigue-mid';

        const roleNormalized = (p.role || '').toLowerCase();
        let roleBadgeClass = 'badge-role-mid';
        if (roleNormalized.includes('exp')) roleBadgeClass = 'badge-role-exp';
        else if (roleNormalized.includes('jung')) roleBadgeClass = 'badge-role-jungle';
        else if (roleNormalized.includes('gold')) roleBadgeClass = 'badge-role-gold';
        else if (roleNormalized.includes('roam')) roleBadgeClass = 'badge-role-roam';

        const mvpCount = p.stats?.mvp || 0;

        rosterList.innerHTML += `
            <div class="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl hover:border-rose-500/40 transition group shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs uppercase ${roleBadgeClass} shadow-sm">
                        ${p.role.substring(0, 3)}
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <p class="font-bold text-[var(--text-primary)] text-lg leading-none">${escapeHTML(p.nick)}</p>
                            ${mvpCount > 0 ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-tighter flex items-center gap-1"><i class="ph-fill ph-crown text-[10px]"></i> ${mvpCount} MVP</span>` : ''}
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${roleBadgeClass}">${escapeHTML(p.role)}</span>
                            <div class="fatigue-bar" title="Fatigue: ${fatigue}%">
                                <div class="fatigue-fill ${fatigueClass}" style="width: ${fatigue}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <button onclick="openEditPlayerModal('${p.id}', '${p.nick}', '${p.role}')" class="p-2 text-slate-400 hover:text-blue-500 transition" title="Edit Pemain">
                        <i class="ph ph-pencil-simple text-base"></i>
                    </button>
                    ${isAdmin ? `
                        <button onclick="handleDeletePlayer('${p.id}')" class="p-2 text-slate-400 hover:text-rose-500 transition" title="Hapus Pemain">
                            <i class="ph ph-trash text-base"></i>
                        </button>
                    ` : ''}
                </div>
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
                        <p class="font-bold text-[var(--text-primary)]">${escapeHTML(p.nick)}</p>
                    </td>
                    <td class="px-2 py-4 text-center">
                        <span class="text-[9px] font-black bg-[var(--bg-secondary)] px-2 py-0.5 rounded text-[var(--text-secondary)] uppercase">${escapeHTML(p.role)}</span>
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

export function openAddTeamModal() {
    if (!isAdminLoggedIn()) {
        showToast("Akses dibatasi. Silakan login sebagai Admin terlebih dahulu.", "warning");
        return;
    }
    const tagInp = document.getElementById('input-new-team-tag');
    const nameInp = document.getElementById('input-new-team-name');
    if (tagInp) tagInp.value = '';
    if (nameInp) nameInp.value = '';
    openModal('modal-add-team');
}

export function handleSubmitAddTeam(e) {
    if (e && e.preventDefault) e.preventDefault();
    const tag = document.getElementById('input-new-team-tag')?.value || '';
    const name = document.getElementById('input-new-team-name')?.value || '';

    const res = TeamsDB.addMasterTeam({ tag, name });
    if (!res.success) {
        showToast(res.error, "error");
        return;
    }

    if (Array.isArray(globalTeams)) {
        globalTeams.push(res.team);
        saveSessionData(globalTeams, globalMatches);
    }

    closeModal('modal-add-team');
    showToast(`Tim ${res.team.tag} berhasil ditambahkan!`, "success");
    loadTeams(globalTeams);
}

export function openEditTeamModalById(teamId) {
    const team = globalTeams.find(t => t.id === teamId);
    if (!team) return;
    const tagInput = document.getElementById('edit-team-tag');
    const nameInput = document.getElementById('edit-team-name');
    if (tagInput) tagInput.value = team.tag;
    if (nameInput) nameInput.value = team.team_name;
    activeRosterTeamId = teamId;
    openModal('modal-edit-team');
}

export function handleDeleteTeam(teamId) {
    if (!isAdminLoggedIn()) {
        showToast("Akses dibatasi. Silakan login sebagai Admin terlebih dahulu.", "warning");
        return;
    }
    const team = globalTeams.find(t => t.id === teamId);
    const teamTag = team ? team.tag : 'Tim';
    if (!confirm(`Apakah Anda yakin ingin menghapus tim ${teamTag} dari database?`)) return;

    TeamsDB.deleteMasterTeam(teamId);
    const idx = globalTeams.findIndex(t => t.id === teamId);
    if (idx !== -1) {
        globalTeams.splice(idx, 1);
        saveSessionData(globalTeams, globalMatches);
    }

    showToast(`Tim ${teamTag} berhasil dihapus.`, "info");
    loadTeams(globalTeams);
}

export function openAddPlayerModal() {
    if (!isAdminLoggedIn()) {
        showToast("Akses dibatasi. Silakan login sebagai Admin terlebih dahulu.", "warning");
        return;
    }
    const nickInp = document.getElementById('input-new-player-nick');
    if (nickInp) nickInp.value = '';
    openModal('modal-add-player');
}

export function handleSubmitAddPlayer(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeRosterTeamId) return;

    const nick = document.getElementById('input-new-player-nick')?.value || '';
    const role = document.getElementById('input-new-player-role')?.value || 'Mid Laner';

    const res = TeamsDB.addPlayerToTeam(activeRosterTeamId, { nick, role });
    if (!res.success) {
        showToast(res.error, "error");
        return;
    }

    const team = globalTeams.find(t => t.id === activeRosterTeamId);
    if (team) {
        team.roster = team.roster || [];
        team.roster.push(res.player);
        saveSessionData(globalTeams, globalMatches);
    }

    closeModal('modal-add-player');
    showToast(`Pemain ${res.player.nick} berhasil ditambahkan!`, "success");
    renderRoster(activeRosterTeamId);
}

export function handleDeletePlayer(playerId) {
    if (!isAdminLoggedIn()) {
        showToast("Akses dibatasi. Silakan login sebagai Admin terlebih dahulu.", "warning");
        return;
    }
    if (!activeRosterTeamId) return;
    if (!confirm("Apakah Anda yakin ingin menghapus pemain ini dari roster?")) return;

    TeamsDB.removePlayerFromTeam(activeRosterTeamId, playerId);
    const team = globalTeams.find(t => t.id === activeRosterTeamId);
    if (team && team.roster) {
        team.roster = team.roster.filter(p => p.id !== playerId);
        saveSessionData(globalTeams, globalMatches);
    }

    showToast("Pemain berhasil dihapus dari roster.", "info");
    renderRoster(activeRosterTeamId);
}

export async function handleBroadcastTeamsToCloud() {
    if (!isAdminLoggedIn()) {
        showToast("Akses dibatasi. Silakan login sebagai Admin terlebih dahulu.", "warning");
        return;
    }
    showLoading(true);
    const res = await TeamsDB.pushMasterTeamsToCloud();
    showLoading(false);
    if (res.success) {
        showToast(`Katalog ${res.count} Tim & Roster berhasil dibroadcast ke Cloud!`, "success");
    } else {
        showToast("Gagal broadcast tim: " + res.error, "error");
    }
}
