/**
 * Supabase Cloud REST Client (PostgREST)
 * Zero-server cloud persistence using native fetch.
 */

import * as Store from '../store.js';
import { showToast } from '../ui/core.js';

export const DEFAULT_SUPABASE_CONFIG = {
    url: 'https://qoykklpeitycbrbzmkcg.supabase.co',
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveWtrbHBlaXR5Y2JyYnpta2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTA3NTUsImV4cCI6MjEwNDM2Njc1NX0._hBFXlNwdBqnbD_-z1gt4YAgm4lh2OGmkZjf5snKJbY"
};

export function getSupabaseConfig() {
    const customUrl = Store.safeStorage.getItem('mpl_supabase_url');
    const customKey = Store.safeStorage.getItem('mpl_supabase_key');

    const url = (customUrl !== null ? customUrl : DEFAULT_SUPABASE_CONFIG.url || '').trim();
    const key = (customKey !== null ? customKey : DEFAULT_SUPABASE_CONFIG.key || '').trim();
    return { url, key };
}

export function saveSupabaseConfig(url, key) {
    Store.safeStorage.setItem('mpl_supabase_url', (url || '').trim());
    Store.safeStorage.setItem('mpl_supabase_key', (key || '').trim());
}

export function isSupabaseConfigured() {
    const { url, key } = getSupabaseConfig();
    return Boolean(url && key && url.startsWith('http'));
}

export async function supabaseRequest(endpoint, method = 'GET', body = null, prefer = '') {
    const { url, key } = getSupabaseConfig();
    if (!url || !key) {
        throw new Error("Kredensial Supabase belum dikonfigurasi.");
    }

    const cleanBase = url.replace(/\/+$/, '');
    const targetUrl = `${cleanBase}/rest/v1/${endpoint}`;

    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
    };

    if (prefer) {
        headers['Prefer'] = prefer;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const options = {
            method,
            headers,
            signal: controller.signal
        };
        if (body && method !== 'GET' && method !== 'HEAD') {
            options.body = JSON.stringify(body);
        }

        const res = await fetch(targetUrl, options);
        clearTimeout(timeout);

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`Supabase Error ${res.status}: ${errText || res.statusText}`);
        }

        if (res.status === 204) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

export async function testSupabaseConnection() {
    try {
        if (!isSupabaseConfigured()) {
            return { success: false, message: "URL dan Anon Key Supabase belum diisi." };
        }
        const data = await supabaseRequest('sessions?select=id&limit=1', 'GET');
        return { success: true, message: "Koneksi ke Supabase Cloud berhasil!", data };
    } catch (err) {
        return { success: false, message: err.message || "Gagal menghubungi Supabase." };
    }
}

export async function fetchSessionsFromSupabase() {
    if (!isSupabaseConfigured()) return null;
    try {
        const rows = await supabaseRequest('sessions?select=id,name,updated_at&order=updated_at.desc', 'GET');
        if (!Array.isArray(rows)) return null;

        return rows.map(r => ({
            id: r.id,
            name: r.name,
            timestamp: new Date(r.updated_at).getTime() || Date.now()
        }));
    } catch (err) {
        console.warn('Gagal memuat sesi dari Supabase:', err.message);
        return null;
    }
}

export async function syncSessionToSupabase(sessionId) {
    if (!isSupabaseConfigured() || !sessionId) return false;

    try {
        const session = Store.sessionsList.find(s => s.id === sessionId) || {
            id: sessionId,
            name: Store.activeSessionName || 'MPL Season',
            timestamp: Date.now()
        };

        const teams = Store.getSessionTeams(sessionId);
        const matches = Store.getSessionMatches(sessionId);

        let settings = { volatility: 50, h2hBias: false, momentum: true, fatigue: true, rivalry: true };
        try {
            const rawSet = localStorage.getItem('mpl_settings_' + sessionId);
            if (rawSet) settings = JSON.parse(rawSet);
        } catch (_) {}

        let playoffs = null;
        let isForced = false;
        try {
            const rawPlay = localStorage.getItem('mpl_playoffs_' + sessionId);
            if (rawPlay) playoffs = JSON.parse(rawPlay);
            isForced = localStorage.getItem('mpl_force_playoff_' + sessionId) === 'true';
        } catch (_) {}

        // 1. Upsert Session
        await supabaseRequest('sessions', 'POST', [{
            id: session.id,
            name: session.name,
            updated_at: new Date().toISOString()
        }], 'resolution=merge-duplicates');

        // 2. Upsert Teams
        if (teams.length > 0) {
            const teamRows = teams.map(t => ({
                id: t.id,
                session_id: sessionId,
                team_name: t.team_name,
                tag: t.tag,
                match_played: parseInt(t.match_played) || 0,
                match_win: parseInt(t.match_win) || 0,
                match_lose: parseInt(t.match_lose) || 0,
                game_win: parseInt(t.game_win) || 0,
                game_lose: parseInt(t.game_lose) || 0,
                points: parseInt(t.points) || 0,
                roster: t.roster || []
            }));
            await supabaseRequest('teams', 'POST', teamRows, 'resolution=merge-duplicates');
        }

        // 3. Upsert Matches
        if (matches.length > 0) {
            const matchRows = matches.map(m => ({
                id: m.id,
                session_id: sessionId,
                week: parseInt(m.week) || 1,
                day: parseInt(m.day) || 1,
                day_name: m.day_name || '',
                date: m.date || '',
                team_a_id: m.team_a_id || '',
                team_b_id: m.team_b_id || '',
                score_a: m.score_a === undefined ? '' : String(m.score_a),
                score_b: m.score_b === undefined ? '' : String(m.score_b),
                status: m.status || 'SCHEDULED',
                games: m.games || []
            }));
            await supabaseRequest('matches', 'POST', matchRows, 'resolution=merge-duplicates');
        }

        // 4. Upsert Settings
        await supabaseRequest('settings', 'POST', [{
            session_id: sessionId,
            volatility: settings.volatility || 50,
            h2h_bias: !!settings.h2hBias,
            momentum: settings.momentum !== false,
            fatigue: settings.fatigue !== false,
            rivalry: settings.rivalry !== false,
            updated_at: new Date().toISOString()
        }], 'resolution=merge-duplicates');

        // 5. Upsert Playoffs
        if (playoffs) {
            await supabaseRequest('playoffs', 'POST', [{
                session_id: sessionId,
                bracket_data: playoffs,
                is_forced: isForced,
                updated_at: new Date().toISOString()
            }], 'resolution=merge-duplicates');
        }

        return true;
    } catch (err) {
        console.error('Supabase Sync Error:', err);
        return false;
    }
}

export async function fetchSessionDataFromSupabase(sessionId) {
    if (!isSupabaseConfigured() || !sessionId) return null;

    try {
        const [teams, matches, settingsRows, playoffRows] = await Promise.all([
            supabaseRequest(`teams?session_id=eq.${sessionId}&order=points.desc`, 'GET'),
            supabaseRequest(`matches?session_id=eq.${sessionId}&order=week.asc,day.asc`, 'GET'),
            supabaseRequest(`settings?session_id=eq.${sessionId}&limit=1`, 'GET'),
            supabaseRequest(`playoffs?session_id=eq.${sessionId}&limit=1`, 'GET')
        ]);

        return {
            teams: Array.isArray(teams) ? teams : [],
            matches: Array.isArray(matches) ? matches : [],
            settings: settingsRows?.[0] || null,
            playoffs: playoffRows?.[0] || null
        };
    } catch (err) {
        console.warn('Gagal mengunduh sesi dari Supabase:', err.message);
        return null;
    }
}

export async function deleteSessionFromSupabase(sessionId) {
    if (!isSupabaseConfigured() || !sessionId) return false;
    try {
        await supabaseRequest(`sessions?id=eq.${sessionId}`, 'DELETE');
        return true;
    } catch (err) {
        console.warn('Gagal menghapus sesi di Supabase:', err.message);
        return false;
    }
}
