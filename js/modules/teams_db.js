/**
 * Master Teams & Roster Database Engine (Dynamic & Cloud-Synced)
 * Eliminates all hardcoding: allows Admins to Add, Edit, and Delete teams and players.
 */

import { safeStorage } from '../store.js';
import { isSupabaseConfigured, supabaseRequest } from './supabase.js';

export const MASTER_TEAMS_STORAGE_KEY = 'mpl_master_teams_catalog';

/**
 * Seed initial teams dynamically if database is empty
 */
function getInitialSeedTeams() {
    const seed = [
        { id: 't1', tag: 'ONIC', team_name: 'FNATIC ONIC' },
        { id: 't2', tag: 'BTR', team_name: 'Bigetron by Vitality' },
        { id: 't3', tag: 'EVOS', team_name: 'EVOS Glory' },
        { id: 't4', tag: 'TLID', team_name: 'Team Liquid ID' },
        { id: 't5', tag: 'AE', team_name: 'Alter Ego' },
        { id: 't6', tag: 'DEWA', team_name: 'Dewa United Esports' },
        { id: 't7', tag: 'GEEK', team_name: 'Geek Fam ID' },
        { id: 't8', tag: 'NAVI', team_name: 'Natus Vincere' },
        { id: 't9', tag: 'RRQ', team_name: 'RRQ Hoshi' }
    ];

    const defaultRosters = {
        ONIC: [
            { nick: "Lutpiii", role: "EXP Laner" }, { nick: "Kairi", role: "Jungler" },
            { nick: "Sanz", role: "Mid Laner" }, { nick: "CW", role: "Gold Laner" }, { nick: "Kiboy", role: "Roamer" }
        ],
        BTR: [
            { nick: "Luke", role: "EXP Laner" }, { nick: "Super Kenn", role: "Jungler" },
            { nick: "Moreno", role: "Mid Laner" }, { nick: "EMANN", role: "Gold Laner" }, { nick: "KYY", role: "Roamer" }
        ],
        EVOS: [
            { nick: "Fluffy", role: "EXP Laner" }, { nick: "Anavel", role: "Jungler" },
            { nick: "Clawkun", role: "Mid Laner" }, { nick: "Branz", role: "Gold Laner" }, { nick: "Dreams", role: "Roamer" }
        ],
        TLID: [
            { nick: "Aran", role: "EXP Laner" }, { nick: "Faviannn", role: "Jungler" },
            { nick: "Yehezkiel", role: "Mid Laner" }, { nick: "AeronnShikii", role: "Gold Laner" }, { nick: "Widy", role: "Roamer" }
        ],
        AE: [
            { nick: "Nino", role: "EXP Laner" }, { nick: "Gebe", role: "Jungler" },
            { nick: "Cr1te", role: "Mid Laner" }, { nick: "Haizz", role: "Gold Laner" }, { nick: "Rasy", role: "Roamer" }
        ],
        DEWA: [
            { nick: "Xorizo", role: "EXP Laner" }, { nick: "Reyy", role: "Jungler" },
            { nick: "Hijumee", role: "Mid Laner" }, { nick: "Watt", role: "Gold Laner" }, { nick: "Muezza", role: "Roamer" }
        ],
        GEEK: [
            { nick: "Gobs", role: "EXP Laner" }, { nick: "Vincentt", role: "Jungler" },
            { nick: "Aboy", role: "Mid Laner" }, { nick: "Caderaa", role: "Gold Laner" }, { nick: "Baloyskie", role: "Roamer" }
        ],
        NAVI: [
            { nick: "Vann", role: "EXP Laner" }, { nick: "Kenshiro", role: "Jungler" },
            { nick: "Sunset Lover", role: "Mid Laner" }, { nick: "Sawo", role: "Gold Laner" }, { nick: "Defender", role: "Roamer" }
        ],
        RRQ: [
            { nick: "Dyrennn", role: "EXP Laner" }, { nick: "Sutsujin", role: "Jungler" },
            { nick: "Rinz", role: "Mid Laner" }, { nick: "Skylar", role: "Gold Laner" }, { nick: "Idok", role: "Roamer" }
        ]
    };

    return seed.map(t => {
        const roster = (defaultRosters[t.tag] || []).map((p, i) => ({
            id: `p_${t.id}_${i + 1}`,
            nick: p.nick,
            role: p.role,
            fatigue: 0,
            stats: { kills: 0, deaths: 0, assists: 0, mvp: 0 }
        }));

        return {
            id: t.id,
            tag: t.tag,
            team_name: t.team_name,
            match_played: 0,
            match_win: 0,
            match_lose: 0,
            game_win: 0,
            game_lose: 0,
            points: 0,
            roster
        };
    });
}

export function getMasterTeams() {
    try {
        const raw = safeStorage.getItem(MASTER_TEAMS_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (_) {}

    const seed = getInitialSeedTeams();
    saveMasterTeams(seed);
    return seed;
}

export function saveMasterTeams(teams) {
    if (!Array.isArray(teams)) return;
    safeStorage.setItem(MASTER_TEAMS_STORAGE_KEY, JSON.stringify(teams));
}

export function addMasterTeam({ tag, name, logo = '' }) {
    const teams = getMasterTeams();
    const cleanTag = (tag || '').trim().toUpperCase();
    const cleanName = (name || '').trim();

    if (!cleanTag || !cleanName) {
        return { success: false, error: "Tag dan Nama Tim tidak boleh kosong." };
    }

    if (teams.some(t => t.tag === cleanTag)) {
        return { success: false, error: `Tim dengan tag ${cleanTag} sudah ada.` };
    }

    const newId = 't_' + Date.now();
    const defaultRoles = ["EXP Laner", "Jungler", "Mid Laner", "Gold Laner", "Roamer"];
    const roster = defaultRoles.map((role, i) => ({
        id: `p_${newId}_${i + 1}`,
        nick: `${cleanTag}_Player${i + 1}`,
        role,
        fatigue: 0,
        stats: { kills: 0, deaths: 0, assists: 0, mvp: 0 }
    }));

    const newTeam = {
        id: newId,
        tag: cleanTag,
        team_name: cleanName,
        logo: logo || '',
        match_played: 0,
        match_win: 0,
        match_lose: 0,
        game_win: 0,
        game_lose: 0,
        points: 0,
        roster
    };

    teams.push(newTeam);
    saveMasterTeams(teams);
    return { success: true, team: newTeam };
}

export function updateMasterTeam(teamId, { tag, name, logo }) {
    const teams = getMasterTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) return { success: false, error: "Tim tidak ditemukan." };

    if (tag) team.tag = tag.trim().toUpperCase();
    if (name) team.team_name = name.trim();
    if (typeof logo !== 'undefined') team.logo = logo;

    saveMasterTeams(teams);
    return { success: true, team };
}

export function deleteMasterTeam(teamId) {
    const teams = getMasterTeams();
    const filtered = teams.filter(t => t.id !== teamId);
    if (filtered.length === teams.length) return { success: false, error: "Tim tidak ditemukan." };

    saveMasterTeams(filtered);
    return { success: true };
}

export function addPlayerToTeam(teamId, { nick, role }) {
    const teams = getMasterTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) return { success: false, error: "Tim tidak ditemukan." };

    const cleanNick = (nick || '').trim();
    const cleanRole = (role || 'Mid Laner').trim();

    if (!cleanNick) return { success: false, error: "Nickname pemain wajib diisi." };

    if (!team.roster) team.roster = [];
    const newPlayer = {
        id: `p_${teamId}_${Date.now()}`,
        nick: cleanNick,
        role: cleanRole,
        fatigue: 0,
        stats: { kills: 0, deaths: 0, assists: 0, mvp: 0 }
    };

    team.roster.push(newPlayer);
    saveMasterTeams(teams);
    return { success: true, player: newPlayer };
}

export function updatePlayerInTeam(teamId, playerId, { nick, role }) {
    const teams = getMasterTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team || !team.roster) return { success: false, error: "Tim atau roster tidak ditemukan." };

    const player = team.roster.find(p => p.id === playerId);
    if (!player) return { success: false, error: "Pemain tidak ditemukan." };

    if (nick) player.nick = nick.trim();
    if (role) player.role = role.trim();

    saveMasterTeams(teams);
    return { success: true, player };
}

export function removePlayerFromTeam(teamId, playerId) {
    const teams = getMasterTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team || !team.roster) return { success: false, error: "Tim tidak ditemukan." };

    team.roster = team.roster.filter(p => p.id !== playerId);
    saveMasterTeams(teams);
    return { success: true };
}

export async function pushMasterTeamsToCloud() {
    if (!isSupabaseConfigured()) {
        return { success: false, error: "Supabase Cloud belum dikonfigurasi." };
    }

    const teams = getMasterTeams();
    try {
        await supabaseRequest('schedule_templates', 'POST', [{
            id: 'master_teams_catalog',
            templates_data: {
                teams,
                updated_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
        }], 'resolution=merge-duplicates');

        return { success: true, count: teams.length };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function syncMasterTeamsFromCloud() {
    if (!isSupabaseConfigured()) return { success: false };
    const { isCacheFresh, touchCache } = await import('./supabase.js');
    if (isCacheFresh('master_teams_catalog', 15)) return { success: true };

    try {
        const rows = await supabaseRequest('schedule_templates?id=eq.master_teams_catalog&limit=1', 'GET');
        if (rows && rows[0] && rows[0].templates_data && Array.isArray(rows[0].templates_data.teams)) {
            const cloudTeams = rows[0].templates_data.teams;
            saveMasterTeams(cloudTeams);
            touchCache('master_teams_catalog');
            return { success: true, teams: cloudTeams };
        }
    } catch (err) {
        console.warn("Sync master teams from cloud error:", err);
    }
    return { success: false };
}
