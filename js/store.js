/**
 * State Store & Persistent Storage Layer
 * Universal storage handling with memory fallback for non-browser/test environments.
 */

export let activeSessionId = null;
export let activeSessionName = "";
export let sessionsList = [];
export let globalTeams = [];
export let globalMatches = [];

export const STORAGE_SCHEMA_VERSION = 2;
const STORAGE_SCHEMA_KEY = 'mpl_storage_schema_version';

const memStorage = new Map();
export const safeStorage = {
    getItem: (k) => {
        try {
            if (typeof localStorage !== 'undefined' && localStorage.getItem) {
                return localStorage.getItem(k);
            }
        } catch (_) {}
        return memStorage.has(k) ? memStorage.get(k) : null;
    },
    setItem: (k, v) => {
        try {
            if (typeof localStorage !== 'undefined' && localStorage.setItem) {
                localStorage.setItem(k, v);
                return;
            }
        } catch (err) {
            if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
                console.warn('LocalStorage Quota Exceeded. Fallback to memory.');
                if (typeof window !== 'undefined' && window.showToast) {
                    window.showToast("Penyimpanan lokal browser penuh. Harap hapus sesi lama.", "warning");
                }
            }
        }
        memStorage.set(k, String(v));
    },
    removeItem: (k) => {
        try {
            if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
                localStorage.removeItem(k);
                return;
            }
        } catch (_) {}
        memStorage.delete(k);
    }
};

export function setActiveSessionId(id) { activeSessionId = id; }
export function setActiveSessionName(name) { activeSessionName = name; }
export function setSessionsList(list) { sessionsList = list; }
export function setGlobalTeams(teams) { globalTeams = teams; }
export function setGlobalMatches(matches) { globalMatches = matches; }

function parseStoredArray(key) {
    const raw = safeStorage.getItem(key);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        safeStorage.removeItem(key);
        return [];
    }
}

export function migrateStorageSchema() {
    const current = Number(safeStorage.getItem(STORAGE_SCHEMA_KEY) || 1);
    if (current < 2) {
        const sessions = parseStoredArray('mpl_sim_sessions');
        sessions.forEach(session => {
            if (!session.shareKey) session.shareKey = null;
        });
        safeStorage.setItem('mpl_sim_sessions', JSON.stringify(sessions));
        safeStorage.setItem(STORAGE_SCHEMA_KEY, String(STORAGE_SCHEMA_VERSION));
    }
}

export function loadSessionsList() {
    migrateStorageSchema();
    sessionsList = parseStoredArray('mpl_sim_sessions');
    return sessionsList;
}

export function saveSessionsList() {
    safeStorage.setItem('mpl_sim_sessions', JSON.stringify(sessionsList));
}

export function getSessionTeams(sessionId = activeSessionId) {
    return parseStoredArray('mpl_teams_' + sessionId);
}

export function getSessionMatches(sessionId = activeSessionId) {
    return parseStoredArray('mpl_matches_' + sessionId);
}

export function saveSessionData(teams, matches, sessionId = activeSessionId) {
    safeStorage.setItem('mpl_teams_' + sessionId, JSON.stringify(teams));
    safeStorage.setItem('mpl_matches_' + sessionId, JSON.stringify(matches));
}

export function exportSession(sessionId) {
    const session = sessionsList.find(s => s.id === sessionId);
    if (!session) return;

    const teams = getSessionTeams(sessionId);
    const matches = getSessionMatches(sessionId);

    const data = {
        version: "1.0",
        type: "MPL_SIM_SESSION",
        session,
        teams,
        matches
    };

    const filename = `MPLSim_${session.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    triggerDownload(data, filename);
}

function triggerDownload(data, filename) {
    if (typeof document === 'undefined') return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function migrateLegacyData() {
    const legacyTeams = safeStorage.getItem('mpl_sim_teams');
    if (legacyTeams) {
        loadSessionsList();
        if (!sessionsList.find(s => s.id === 'legacy')) {
            const newSession = { id: 'legacy', name: 'Legacy Season', timestamp: Date.now() };
            sessionsList.push(newSession);
            saveSessionsList();

            safeStorage.setItem('mpl_teams_legacy', legacyTeams);
            safeStorage.setItem('mpl_matches_legacy', safeStorage.getItem('mpl_sim_matches') || '[]');

            safeStorage.removeItem('mpl_sim_teams');
            safeStorage.removeItem('mpl_sim_matches');
        }
    }
}
