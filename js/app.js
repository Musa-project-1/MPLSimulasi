/**
 * MPLSim - Koordinator Utama Aplikasi
 * Arsitektur: Local-first Vanilla JS (ES Modules)
 * Batas: <450 baris
 */

import * as Store from './store.js';
import * as Config from './config.js';
import { calculateStandings } from './modules/standings.js';
import { updateMatchScore, filterMatchesByWeek, getMatchesSummary, generateMatchesFromTemplate } from './modules/matches.js';
import { initializePlayoffBracket, updatePlayoffMatchScore } from './modules/playoffs.js';
import { showToast, openModal, closeModal, showLoading, showStandingsSkeleton } from './ui/components.js';
import { renderSessionList } from './ui/sessions.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderStandingsTable, renderProbabilitiesTable } from './ui/standings.js';
import { renderWeekSelector, renderMatchesGrid, setCurrentViewWeek, getCurrentViewWeek } from './ui/matches.js';
import { renderPlayoffBracket } from './ui/playoffs.js';
import { runSimulation } from './simulation.js';

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    Store.migrateLegacyData();
    Store.loadSessionsList();
    initTheme();
    renderSessionList(Store.sessionsList, Store.activeSessionId);

    // Bind handlers ke window untuk kompatibilitas markup HTML
    window.openCreateSessionModal = openCreateSessionModal;
    window.submitCreateSession = submitCreateSession;
    window.openSession = openSession;
    window.confirmDeleteSession = confirmDeleteSession;
    window.executeDeleteSession = executeDeleteSession;
    window.exitToSessionManager = exitToSessionManager;
    window.switchTab = switchTab;
    window.changeWeek = changeWeek;
    window.handleQuickScore = handleQuickScore;
    window.handlePlayoffScoreChange = handlePlayoffScoreChange;
    window.toggleTheme = toggleTheme;
    window.exportCurrentSession = exportCurrentSession;
    window.exportSpecificSession = exportSpecificSession;
    window.importSession = () => document.getElementById('import-file-input')?.click();
    window.handleImportFile = handleImportFile;
    window.closeModal = closeModal;
    window.openModal = openModal;
});

// --- THEME SYSTEM ---
function initTheme() {
    const saved = localStorage.getItem('mpl_theme') || 'dark';
    applyTheme(saved);
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('theme-light');
    } else {
        document.body.classList.remove('theme-light');
    }
    localStorage.setItem('mpl_theme', theme);
    const iconUse = document.querySelector('#theme-toggle-icon use');
    if (iconUse) {
        iconUse.setAttribute('href', theme === 'light' ? 'icons/sprite.svg#ph-moon' : 'icons/sprite.svg#ph-sun');
    }
}

function toggleTheme() {
    const isLight = document.body.classList.contains('theme-light');
    applyTheme(isLight ? 'dark' : 'light');
}

// --- SESSION MANAGEMENT ---
function openCreateSessionModal() {
    const nameInput = document.getElementById('input-session-name');
    if (nameInput) nameInput.value = '';
    openModal('modal-create-session');
}

function submitCreateSession(e) {
    e.preventDefault();
    const nameInput = document.getElementById('input-session-name');
    const scheduleSelect = document.getElementById('input-session-schedule');
    const errEl = document.getElementById('session-name-error');
    const sessionName = nameInput?.value?.trim();
    const scheduleKey = scheduleSelect?.value || 'standard';

    if (!sessionName || sessionName.length < 3) {
        errEl?.classList.remove('hidden');
        nameInput?.setAttribute('aria-invalid', 'true');
        nameInput?.focus();
        return;
    }
    errEl?.classList.add('hidden');
    nameInput?.removeAttribute('aria-invalid');

    const newId = 'session_' + Date.now();
    const newSession = {
        id: newId,
        name: sessionName,
        scheduleKey: scheduleKey,
        timestamp: Date.now()
    };

    // Buat data tim dan jadwal awal
    const teams = Config.getInitialMockTeams();
    const template = Config.SCHEDULE_TEMPLATES[scheduleKey] || Config.SCHEDULE_TEMPLATES.standard;
    const matches = generateMatchesFromTemplate(template, teams);

    // Simpan ke store & localStorage
    Store.sessionsList.push(newSession);
    Store.saveSessionsList();
    Store.saveSessionData(teams, matches, newId);

    closeModal('modal-create-session');
    showToast(`Sesi "${sessionName}" berhasil dibuat!`, 'success');
    openSession(newId);
}

let pendingDeleteId = null;
function confirmDeleteSession(id, name) {
    pendingDeleteId = id;
    const msgEl = document.getElementById('delete-session-prompt');
    if (msgEl) msgEl.innerText = `Apakah Anda yakin ingin menghapus sesi "${name}"? Data simulasi ini tidak dapat dikembalikan.`;
    openModal('modal-delete-confirm');
}

function executeDeleteSession() {
    if (!pendingDeleteId) return;
    const filtered = Store.sessionsList.filter(s => s.id !== pendingDeleteId);
    Store.setSessionsList(filtered);
    Store.saveSessionsList();

    localStorage.removeItem('mpl_teams_' + pendingDeleteId);
    localStorage.removeItem('mpl_matches_' + pendingDeleteId);
    localStorage.removeItem('mpl_playoffs_' + pendingDeleteId);

    if (Store.activeSessionId === pendingDeleteId) {
        exitToSessionManager();
    }

    pendingDeleteId = null;
    closeModal('modal-delete-confirm');
    renderSessionList(Store.sessionsList, Store.activeSessionId);
    showToast('Sesi berhasil dihapus.', 'info');
}

function openSession(id) {
    const session = Store.sessionsList.find(s => s.id === id);
    if (!session) return;

    Store.setActiveSessionId(id);
    Store.setActiveSessionName(session.name);

    // Ambil data
    let teams = Store.getSessionTeams(id);
    let matches = Store.getSessionMatches(id);

    // Hitung ulang klasemen
    teams = calculateStandings(teams, matches);
    Store.setGlobalTeams(teams);
    Store.setGlobalMatches(matches);
    Store.saveSessionData(teams, matches, id);

    // Update UI Header
    const nameEl = document.getElementById('header-session-name');
    if (nameEl) nameEl.innerText = session.name;

    // Tampilkan View App
    document.getElementById('view-landing')?.classList.add('hidden');
    document.getElementById('app-header')?.classList.remove('hidden');
    document.getElementById('app-main')?.classList.remove('hidden');

    // Default ke Tab Dashboard
    switchTab('dashboard', document.getElementById('nav-dashboard'));
    showToast(`Memuat sesi: ${session.name}`, 'info');
}

function exitToSessionManager() {
    Store.setActiveSessionId(null);
    Store.setActiveSessionName('');
    document.getElementById('view-landing')?.classList.remove('hidden');
    document.getElementById('app-header')?.classList.add('hidden');
    document.getElementById('app-main')?.classList.add('hidden');
    renderSessionList(Store.sessionsList, null);
}

// --- TABS NAVIGATION ---
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-view').forEach(v => v.classList.add('hidden'));
    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#bottom-nav .bnav-btn').forEach(b => b.classList.toggle('active', b.dataset.bnav === tabId));

    const targetView = document.getElementById(`view-${tabId}`);
    if (targetView) targetView.classList.remove('hidden');
    if (btnElement) btnElement.classList.add('active');

    if (tabId === 'dashboard') loadDashboardView();
    if (tabId === 'standings') loadStandingsView();
    if (tabId === 'matches') loadMatchesView();
    if (tabId === 'playoffs') loadPlayoffsView();
}

// --- VIEW LOADERS ---
function loadDashboardView() {
    const summary = getMatchesSummary(Store.globalMatches);
    renderDashboard(summary, Store.globalTeams);

    // Jalankan kalkulasi probabilitas di background
    runSimulation(Store.globalTeams).then(simResults => {
        if (!simResults) return;
        const leaderCard = document.getElementById('dash-leader-card');
        if (leaderCard && simResults) {
            // Updated state
        }
    }).catch(() => {});
}

function loadStandingsView() {
    renderStandingsTable(Store.globalTeams, Store.globalMatches.length);
    showStandingsSkeleton();
    showLoading(true);
    runSimulation(Store.globalTeams).then(simResults => {
        if (!simResults) {
            showLoading(false);
            return;
        }
        renderProbabilitiesTable(simResults);
        showLoading(false);
    }).catch(() => {
        showLoading(false);
    });
}

function loadMatchesView() {
    const currentWeek = getCurrentViewWeek();
    renderWeekSelector(Store.globalMatches, currentWeek);
    const weekMatches = filterMatchesByWeek(Store.globalMatches, currentWeek);
    renderMatchesGrid(weekMatches, Store.globalTeams);
}

function changeWeek(week) {
    setCurrentViewWeek(week);
    loadMatchesView();
}

function loadPlayoffsView() {
    let playoffData = null;
    const raw = localStorage.getItem('mpl_playoffs_' + Store.activeSessionId);
    if (raw) {
        try { playoffData = JSON.parse(raw); } catch (e) {}
    }
    if (!playoffData) {
        playoffData = initializePlayoffBracket(Store.globalTeams);
        localStorage.setItem('mpl_playoffs_' + Store.activeSessionId, JSON.stringify(playoffData));
    }
    renderPlayoffBracket(playoffData);
}

// --- MATCH ACTIONS ---
function handleQuickScore(matchId, scoreA, scoreB) {
    const updatedMatches = updateMatchScore(Store.globalMatches, matchId, scoreA, scoreB);
    const updatedTeams = calculateStandings(Store.globalTeams, updatedMatches);

    Store.setGlobalMatches(updatedMatches);
    Store.setGlobalTeams(updatedTeams);
    Store.saveSessionData(updatedTeams, updatedMatches, Store.activeSessionId);

    // Refresh match grid dan week selector
    loadMatchesView();
    showToast(scoreA === "" ? "Skor pertandingan direset." : `Skor tersimpan: ${scoreA} - ${scoreB}`, 'success');
}

function handlePlayoffScoreChange(matchId, slot, value) {
    let playoffData = null;
    const raw = localStorage.getItem('mpl_playoffs_' + Store.activeSessionId);
    if (raw) {
        try { playoffData = JSON.parse(raw); } catch (e) {}
    }
    if (!playoffData) return;

    playoffData = updatePlayoffMatchScore(playoffData, matchId, slot, value);
    localStorage.setItem('mpl_playoffs_' + Store.activeSessionId, JSON.stringify(playoffData));
    renderPlayoffBracket(playoffData);
}

// --- EXPORT & IMPORT ---
function exportCurrentSession() {
    if (!Store.activeSessionId) return;
    Store.exportSession(Store.activeSessionId);
    showToast('Berkas JSON sesi berhasil diunduh.', 'success');
}

function exportSpecificSession(id) {
    Store.exportSession(id);
    showToast('Berkas JSON sesi berhasil diunduh.', 'success');
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.session || !data.teams || !data.matches) {
                throw new Error("Format berkas sesi tidak valid.");
            }
            const newId = 'imported_' + Date.now();
            const newSession = {
                ...data.session,
                id: newId,
                name: (data.session.name || 'Imported Session') + ' (Impor)',
                timestamp: Date.now()
            };

            Store.sessionsList.push(newSession);
            Store.saveSessionsList();
            Store.saveSessionData(data.teams, data.matches, newId);

            renderSessionList(Store.sessionsList, Store.activeSessionId);
            showToast(`Sesi "${newSession.name}" berhasil diimpor!`, 'success');
        } catch (err) {
            showToast("Gagal mengimpor file: " + err.message, 'error');
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}
