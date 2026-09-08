/**
 * Team & Player Roster Editor, Team Picker Modal
 */

import * as Store from '../store.js';
import { openModal, closeModal, customAlert, getTeamLogo, escapeHTML } from '../ui/core.js';
import { fetchAPI } from './schedule.js';
import { validateTeamData, validatePlayerData } from '../rules/validators.js';

let activePickerMatchId = null;
let activePickerRole = null;
let activeEditPlayerId = null;

export function openTeamPicker(matchId, role) {
    activePickerMatchId = matchId;
    activePickerRole = role;

    const grid = document.getElementById('team-picker-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Store.globalTeams.forEach(t => {
        grid.innerHTML += `
            <div onclick="selectTeamFromPicker('${t.id}')" class="flex flex-col items-center p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all shadow-sm group">
                ${getTeamLogo(t.tag, 'w-12 h-12 mb-2 group-hover:scale-110 transition-transform')}
                <span class="font-bold text-xs text-slate-800 text-center">${escapeHTML(t.tag)}</span>
                <span class="text-[9px] text-slate-400 truncate w-full text-center">${escapeHTML(t.team_name)}</span>
            </div>
        `;
    });

    const sub = document.getElementById('picker-subtitle');
    if (sub) sub.innerText = role === 'home' ? 'Pilih Tim Home (Tuan Rumah)' : 'Pilih Tim Away (Tamu)';
    openModal('modal-team-picker');
}

export async function selectTeamFromPicker(teamId) {
    await updateMatchTeamInline(activePickerMatchId, activePickerRole, teamId);
    closeModal('modal-team-picker');
}

export async function updateMatchTeamInline(matchId, role, newTeamId) {
    const match = Store.globalMatches.find(m => m.id === matchId);
    if (!match) return;

    if (match.status === 'COMPLETED') {
        customAlert("Pertandingan ini sudah selesai! Harap kosongkan skor jika ingin mengganti tim.");
        if (window.loadMatches) window.loadMatches();
        return;
    }
    if (role === 'home' && newTeamId === match.team_b_id && newTeamId !== "") {
        customAlert("Tim Home dan Tim Away tidak boleh sama!");
        if (window.loadMatches) window.loadMatches();
        return;
    }
    if (role === 'away' && newTeamId === match.team_a_id && newTeamId !== "") {
        customAlert("Tim Home dan Tim Away tidak boleh sama!");
        if (window.loadMatches) window.loadMatches();
        return;
    }

    await fetchAPI('update_match_team_inline', { matchId, role, newTeamId });
    if (window.loadMatches) window.loadMatches();
}

export function openEditPlayerModal(id, nick, role) {
    activeEditPlayerId = id;
    const nickInp = document.getElementById('edit-player-nick');
    const roleInp = document.getElementById('edit-player-role');
    if (nickInp) nickInp.value = nick;
    if (roleInp) roleInp.value = role;
    openModal('modal-edit-player');
}

export function submitEditPlayer(e) {
    if (e && e.preventDefault) e.preventDefault();
    const rawNick = document.getElementById('edit-player-nick')?.value || '';
    const rawRole = document.getElementById('edit-player-role')?.value || '';

    const validation = validatePlayerData(rawNick, rawRole);
    if (!validation.valid) {
        customAlert(validation.error);
        return;
    }

    const nick = validation.nick;
    const role = validation.role;

    const teams = Store.getSessionTeams();
    teams.forEach(t => {
        if (t.roster) {
            const p = t.roster.find(player => player.id === activeEditPlayerId);
            if (p) {
                p.nick = nick;
                p.role = role;
            }
        }
    });

    Store.saveSessionData(teams, Store.getSessionMatches());
    Store.setGlobalTeams(teams);
    closeModal('modal-edit-player');
    if (window.showRoster && window.activeRosterTeamId) {
        window.showRoster(window.activeRosterTeamId);
    }
}

export function openEditTeamModalFromRoster() {
    if (!window.activeRosterTeamId) return;
    const team = Store.globalTeams.find(t => t.id === window.activeRosterTeamId);
    if (!team) return;

    const idInp = document.getElementById('edit-team-id');
    const nameInp = document.getElementById('edit-team-name');
    const tagInp = document.getElementById('edit-team-tag');

    if (idInp) idInp.value = team.id;
    if (nameInp) nameInp.value = team.team_name;
    if (tagInp) tagInp.value = team.tag;

    openModal('modal-edit-team');
}

export async function submitEditTeam(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('edit-team-id')?.value;
    const rawName = document.getElementById('edit-team-name')?.value || '';
    const rawTag = document.getElementById('edit-team-tag')?.value || '';

    const validation = validateTeamData(rawName, rawTag);
    if (!validation.valid) {
        customAlert(validation.error);
        return;
    }

    await fetchAPI('edit_team', { id, team_name: validation.name, tag: validation.tag });
    closeModal('modal-edit-team');
    if (window.loadTeams) window.loadTeams();
    if (window.showRoster) window.showRoster(id);
}
