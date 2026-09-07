/**
 * Application Entry Point & Orchestrator
 * Bootstraps state, UI view controllers, and binds events.
 */

import * as Store from './store.js';
import * as Config from './config.js';
import * as UI from './ui.js';
import * as Theme from './modules/theme.js';
import * as Sessions from './modules/sessions.js';
import * as Schedule from './modules/schedule.js';
import * as Playoffs from './modules/playoffs.js';
import * as Export from './modules/export.js';
import * as Admin from './modules/admin.js';
import { runSimulation } from './simulation/engine.js';

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    Store.migrateLegacyData();
    Store.loadSessionsList();
    UI.renderSessionManager();
    Theme.applySavedTheme();
    registerServiceWorker();

    // Attach modules to window for inline HTML template compatibility
    // Sessions
    window.importSession = Sessions.importSession;
    window.openCreateSessionModal = Sessions.openCreateSessionModal;
    window.handleImportFile = Sessions.handleImportFile;
    window.submitCreateSession = Sessions.submitCreateSession;
    window.openSession = Sessions.openSession;
    window.deleteSession = Sessions.deleteSession;
    window.executeDeleteSession = Sessions.executeDeleteSession;
    window.exitToSessionManager = Sessions.exitToSessionManager;
    window.exportCurrentSession = Sessions.exportCurrentSession;

    // Navigation & Tabs
    window.switchTab = UI.switchTab;
    window.switchSubTab = UI.switchSubTab;
    window.switchMatchSubTab = UI.switchMatchSubTab;
    window.switchSettingsSection = UI.switchSettingsSection;
    window.toggleMobileMenu = UI.toggleMobileMenu;
    window.closeModal = UI.closeModal;
    window.updateSettingLabel = UI.updateSettingLabel;
    window.setCurrentViewWeek = UI.setCurrentViewWeek;

    // Theme
    window.setTheme = Theme.setTheme;

    // Schedule, Match, & Team Editing
    window.changeWeek = Schedule.changeWeek;
    window.quickSetScore = Schedule.quickSetScore;
    window.openMatchDetailsModal = Schedule.openMatchDetailsModal;
    window.saveMatchDetails = Schedule.saveMatchDetails;
    window.openTeamPicker = Schedule.openTeamPicker;
    window.selectTeamFromPicker = Schedule.selectTeamFromPicker;
    window.openEditPlayerModal = Schedule.openEditPlayerModal;
    window.submitEditPlayer = Schedule.submitEditPlayer;
    window.openEditTeamModalFromRoster = Schedule.openEditTeamModalFromRoster;
    window.submitEditTeam = Schedule.submitEditTeam;

    // Playoffs
    window.loadPlayoffs = Playoffs.loadPlayoffs;
    window.forceUnlockPlayoffs = Playoffs.forceUnlockPlayoffs;
    window.updatePlayoffScore = Playoffs.updatePlayoffScore;

    // Export & Sharing
    window.exportStandingsImage = Export.exportStandingsImage;
    window.exportSeasonReport = Export.exportSeasonReport;
    window.shareMatchResult = Export.shareMatchResult;

    // Admin & Schedule Database
    window.openDatabaseAdmin = Admin.openDatabaseAdmin;
    window.switchAdminTemplate = Admin.switchAdminTemplate;
    window.addNewMatchupRow = Admin.addNewMatchupRow;
    window.removeMatchupRow = Admin.removeMatchupRow;
    window.saveScheduleDatabase = Admin.saveScheduleDatabase;
    window.resetTemplateToDefault = Admin.resetTemplateToDefault;

    // Settings
    window.openSettingsModal = openSettingsModal;
    window.saveSettings = saveSettings;

    // App Loaders
    window.initApp = initApp;
    window.loadDashboard = loadDashboard;
    window.loadStandings = loadStandings;
    window.loadMatches = loadMatches;
    window.loadTeams = loadTeams;
    window.showRoster = UI.showRoster;
});

// --- CORE APP DATA CONTROLLER ---
export async function initApp() {
    await loadTeamsData(true);
    await loadDashboard();
    UI.switchTab('dashboard', document.getElementById('nav-dashboard'));
}

export async function loadTeamsData(silent = false) {
    if (!silent) UI.showLoading(true);
    const data = await Schedule.fetchAPI('get_teams');
    if (data) Store.setGlobalTeams(data);
    if (!silent) UI.showLoading(false);
}

export async function loadDashboard() {
    const data = await Schedule.fetchAPI('get_dashboard');
    if (data) UI.loadDashboard(data);
}

export async function loadStandings() {
    const teams = await Schedule.fetchAPI('get_standings');
    if (!teams) return;
    Store.setGlobalTeams(teams);

    const simTeams = await runSimulation(teams);
    UI.loadStandings(teams, simTeams);
}

export async function loadMatches() {
    await loadTeamsData(true);
    const data = await Schedule.fetchAPI('get_matches');
    if (!data) return;
    Store.setGlobalMatches(data);
    UI.loadMatches(data);
}

export async function loadTeams() {
    await loadTeamsData();
    UI.loadTeams(Store.globalTeams);
}

// --- SETTINGS CONTROLLER ---
export function openSettingsModal() {
    let settings = Config.DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem('mpl_settings_' + Store.activeSessionId);
        if (raw) settings = JSON.parse(raw);
    } catch (_) {}

    const vol = document.getElementById('setting-volatility');
    const valVol = document.getElementById('val-setting-volatility');
    const h2h = document.getElementById('setting-h2h');
    const mom = document.getElementById('setting-momentum');
    const fat = document.getElementById('setting-fatigue');
    const riv = document.getElementById('setting-rivalry');

    if (vol) vol.value = settings.volatility;
    if (valVol) valVol.innerText = settings.volatility + '%';
    if (h2h) h2h.checked = !!settings.h2hBias;
    if (mom) mom.checked = settings.momentum !== false;
    if (fat) fat.checked = settings.fatigue !== false;
    if (riv) riv.checked = settings.rivalry !== false;

    UI.openModal('modal-settings');
}

export function saveSettings() {
    const settings = {
        volatility: parseInt(document.getElementById('setting-volatility')?.value) || 50,
        h2hBias: document.getElementById('setting-h2h')?.checked || false,
        momentum: document.getElementById('setting-momentum')?.checked || false,
        fatigue: document.getElementById('setting-fatigue')?.checked || false,
        rivalry: document.getElementById('setting-rivalry')?.checked || false
    };

    try {
        localStorage.setItem('mpl_settings_' + Store.activeSessionId, JSON.stringify(settings));
    } catch (_) {}

    UI.closeModal('modal-settings');
    UI.customAlert("Konfigurasi simulasi berhasil disimpan!");
    loadStandings();
}

// --- PWA & SERVICE WORKER ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('MPLSim ServiceWorker registered with scope:', reg.scope);
                })
                .catch(err => {
                    console.log('MPLSim ServiceWorker registration failed:', err);
                });
        });
    }
}
