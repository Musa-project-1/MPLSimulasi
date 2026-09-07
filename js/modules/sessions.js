/**
 * Session Lifecycle Manager
 * Handles creating, switching, deleting, importing, and exporting tournament sessions.
 */

import * as Store from '../store.js';
import { openModal, closeModal, customAlert, renderSessionManager } from '../ui/core.js';
import { initializeMockDataForSession } from './schedule.js';
import { 
    isSupabaseConfigured, 
    syncSessionToSupabase, 
    deleteSessionFromSupabase,
    fetchSessionsFromSupabase,
    fetchSessionDataFromSupabase
} from './supabase.js';
import { sanitizeSessionName, validateSessionImport } from '../rules/validators.js';

export function openCreateSessionModal() {
    const nameInput = document.getElementById('input-session-name');
    if (nameInput) nameInput.value = '';

    const select = document.getElementById('input-session-schedule');
    if (select) {
        try {
            const rawDb = localStorage.getItem('mpl_custom_schedule_db');
            if (rawDb) {
                const db = JSON.parse(rawDb);
                select.innerHTML = '';
                Object.keys(db).forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = k;
                    opt.innerText = db[k].name || k;
                    select.appendChild(opt);
                });
            }
        } catch (_) {}
    }

    openModal('modal-create-session');
}

export function submitCreateSession(e) {
    if (e && e.preventDefault) e.preventDefault();
    const rawSessionName = document.getElementById('input-session-name')?.value || '';
    const scheduleKey = document.getElementById('input-session-schedule')?.value || 'standard';
    
    const nameValidation = sanitizeSessionName(rawSessionName);
    if (!nameValidation.valid) {
        customAlert(nameValidation.error);
        return;
    }
    const sessionName = nameValidation.name;

    closeModal('modal-create-session');

    const id = 'sess_' + Date.now();
    const sessions = Store.loadSessionsList();
    sessions.push({ id, name: sessionName, timestamp: Date.now() });
    Store.saveSessionsList();

    Store.setActiveSessionId(id);
    Store.setActiveSessionName(sessionName);

    initializeMockDataForSession(id, scheduleKey);

    if (isSupabaseConfigured()) {
        syncSessionToSupabase(id).catch(err => console.warn('Supabase initial sync failed:', err));
    }

    enterApp();
}

export async function openSession(id) {
    const sessions = Store.loadSessionsList();
    const sess = sessions.find(s => s.id === id);
    if (!sess) return;

    sess.timestamp = Date.now();
    Store.saveSessionsList();

    Store.setActiveSessionId(sess.id);
    Store.setActiveSessionName(sess.name);

    // If session data is not yet in local storage, fetch from Supabase
    let localTeams = Store.getSessionTeams(sess.id);
    if ((!localTeams || localTeams.length === 0) && isSupabaseConfigured()) {
        const cloudData = await fetchSessionDataFromSupabase(sess.id);
        if (cloudData && cloudData.teams && cloudData.teams.length > 0) {
            Store.saveSessionData(cloudData.teams, cloudData.matches || [], sess.id);
            if (cloudData.settings) {
                try { localStorage.setItem('mpl_settings_' + sess.id, JSON.stringify(cloudData.settings)); } catch (_) {}
            }
            if (cloudData.playoffs && cloudData.playoffs.bracket_data) {
                try { localStorage.setItem('mpl_playoffs_' + sess.id, JSON.stringify(cloudData.playoffs.bracket_data)); } catch (_) {}
            }
        }
    }

    enterApp();
}

export async function syncSessionsFromCloud() {
    if (!isSupabaseConfigured()) return;
    try {
        const cloudSessions = await fetchSessionsFromSupabase();
        if (!cloudSessions || !Array.isArray(cloudSessions)) return;

        const localSessions = Store.loadSessionsList();
        let changed = false;

        cloudSessions.forEach(cs => {
            const exists = localSessions.find(ls => ls.id === cs.id);
            if (!exists) {
                localSessions.push(cs);
                changed = true;
            }
        });

        if (changed) {
            Store.saveSessionsList();
            renderSessionManager();
        }
    } catch (err) {
        console.warn('Cloud sessions auto-sync:', err);
    }
}

export function deleteSession(id) {
    const delInput = document.getElementById('delete-session-id');
    if (delInput) delInput.value = id;
    openModal('modal-confirm-delete');
}

export function executeDeleteSession() {
    const id = document.getElementById('delete-session-id')?.value;
    if (!id) return;

    let sessions = Store.loadSessionsList();
    sessions = sessions.filter(s => s.id !== id);
    Store.setSessionsList(sessions);
    Store.saveSessionsList();

    try {
        localStorage.removeItem('mpl_teams_' + id);
        localStorage.removeItem('mpl_matches_' + id);
        localStorage.removeItem('mpl_settings_' + id);
        localStorage.removeItem('mpl_playoffs_' + id);
        localStorage.removeItem('mpl_force_playoff_' + id);
    } catch (_) {}

    if (isSupabaseConfigured()) {
        deleteSessionFromSupabase(id).catch(err => console.warn('Supabase delete failed:', err));
    }

    closeModal('modal-confirm-delete');
    renderSessionManager();
}

export function exitToSessionManager() {
    Store.setActiveSessionId(null);
    document.getElementById('view-landing')?.classList.remove('hidden');
    document.getElementById('app-header')?.classList.add('hidden');
    document.getElementById('app-main')?.classList.add('hidden');

    Store.loadSessionsList();
    renderSessionManager();
}

export function enterApp() {
    const headerTitle = document.getElementById('header-session-name');
    if (headerTitle) headerTitle.innerText = Store.activeSessionName;

    document.getElementById('view-landing')?.classList.add('hidden');
    document.getElementById('app-header')?.classList.remove('hidden');
    document.getElementById('app-main')?.classList.remove('hidden');

    if (window.setCurrentViewWeek) window.setCurrentViewWeek(1);
    if (window.initApp) window.initApp();
}

export function exportCurrentSession() {
    if (!Store.activeSessionId) return;
    Store.exportSession(Store.activeSessionId);
}

export function importSession() {
    document.getElementById('import-file-input')?.click();
}

export function handleImportFile(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const rawData = JSON.parse(e.target.result);
            const validation = validateSessionImport(rawData);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const newId = 'sess_' + Date.now();
            const newSession = {
                ...validation.session,
                id: newId,
                timestamp: Date.now()
            };

            const sessions = Store.loadSessionsList();
            sessions.push(newSession);
            Store.saveSessionsList();

            Store.saveSessionData(validation.teams, validation.matches, newId);

            if (isSupabaseConfigured()) {
                syncSessionToSupabase(newId).catch(err => console.warn('Supabase import sync error:', err));
            }

            customAlert(`Berhasil mengimpor sesi: ${newSession.name}`);
            renderSessionManager();
        } catch (err) {
            customAlert("Gagal mengimpor file: " + err.message);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}
