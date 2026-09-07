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
import * as QuickSim from './modules/quick_sim.js';
import * as QuickImporter from './modules/quick_importer.js';
import * as AdminAuth from './modules/admin_auth.js';
import * as Sound from './modules/sound.js';
import * as TeamsDB from './modules/teams_db.js';
import * as ShareUrl from './modules/share_url.js';
import * as Supabase from './modules/supabase.js';
import { runSimulation } from './simulation/engine.js';

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    Store.migrateLegacyData();
    Store.loadSessionsList();
    UI.renderSessionManager();
    Theme.applySavedTheme();
    cleanupServiceWorkers();
    AdminAuth.updateAdminUIState();
    ShareUrl.checkAndLoadSharedPrediction();
    Sessions.syncSessionsFromCloud().catch(err => console.warn('Cloud sync error:', err));
    Admin.syncScheduleTemplatesFromCloud().catch(err => console.warn('Cloud schedule sync error:', err));
    TeamsDB.syncMasterTeamsFromCloud().catch(err => console.warn('Cloud teams sync error:', err));

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
    window.setActiveTeamFilter = UI.setActiveTeamFilter;

    // Theme
    window.setTheme = Theme.setTheme;
    window.toggleTheme = Theme.toggleTheme;

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
    window.simulateCurrentWeekMatches = QuickSim.simulateCurrentWeekMatches;
    window.resetCurrentWeekMatches = QuickSim.resetCurrentWeekMatches;
    window.simulateAllRemainingMatches = QuickSim.simulateAllRemainingMatches;
    window.openQuickImportModal = openQuickImportModal;
    window.loadOfficialS18Preset = loadOfficialS18Preset;
    window.handlePreviewParsedMatches = handlePreviewParsedMatches;
    window.handleExecuteBatchImport = handleExecuteBatchImport;
    window.syncLiveScoresFromCloud = QuickImporter.syncLiveScoresFromCloud;

    // Playoffs
    window.loadPlayoffs = Playoffs.loadPlayoffs;
    window.forceUnlockPlayoffs = Playoffs.forceUnlockPlayoffs;
    window.resetPlayoffDraft = Playoffs.resetPlayoffDraft;
    window.updatePlayoffScore = Playoffs.updatePlayoffScore;

    // Export & Sharing
    window.exportStandingsImage = Export.exportStandingsImage;
    window.exportStandingsCSV = Export.exportStandingsCSV;
    window.exportSeasonReport = Export.exportSeasonReport;
    window.shareMatchResult = Export.shareMatchResult;
    window.handleSharePredictionLink = ShareUrl.handleSharePredictionLink;

    // Admin & Schedule Database
    window.openDatabaseAdmin = Admin.openDatabaseAdmin;
    window.switchAdminTemplate = Admin.switchAdminTemplate;
    window.addNewMatchupRow = Admin.addNewMatchupRow;
    window.removeMatchupRow = Admin.removeMatchupRow;
    window.saveScheduleDatabase = Admin.saveScheduleDatabase;
    window.resetTemplateToDefault = Admin.resetTemplateToDefault;
    window.pushScheduleTemplatesToCloud = Admin.pushScheduleTemplatesToCloud;
    window.pullScheduleTemplatesFromCloud = Admin.pullScheduleTemplatesFromCloud;
    window.promptCreateNewSeason = Admin.promptCreateNewSeason;

    // Admin Auth
    window.openAdminLoginModal = AdminAuth.openAdminLoginModal;
    window.submitAdminLogin = AdminAuth.submitAdminLogin;
    window.logoutAdmin = AdminAuth.logoutAdmin;
    window.handleChangeAdminPinForm = AdminAuth.handleChangeAdminPinForm;
    window.renderAdminSettingsCard = AdminAuth.renderAdminSettingsCard;

    // Settings & Supabase
    window.openSettingsModal = openSettingsModal;
    window.saveSettings = saveSettings;
    window.handleTestSupabase = handleTestSupabase;

    // App Loaders
    window.initApp = initApp;
    window.loadDashboard = loadDashboard;
    window.loadStandings = loadStandings;
    window.loadMatches = loadMatches;
    window.loadTeams = loadTeams;
    window.showRoster = UI.showRoster;
    window.renderRoster = UI.renderRoster;
    window.renderH2HMatrix = UI.renderH2HMatrix;

    // Dynamic Teams & Players Management
    window.openAddTeamModal = UI.openAddTeamModal;
    window.handleSubmitAddTeam = UI.handleSubmitAddTeam;
    window.openEditTeamModalById = UI.openEditTeamModalById;
    window.handleDeleteTeam = UI.handleDeleteTeam;
    window.openAddPlayerModal = UI.openAddPlayerModal;
    window.handleSubmitAddPlayer = UI.handleSubmitAddPlayer;
    window.handleDeletePlayer = UI.handleDeletePlayer;
    window.handleBroadcastTeamsToCloud = UI.handleBroadcastTeamsToCloud;
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

// --- SETTINGS & SUPABASE CONTROLLER ---
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

    // Populate Supabase inputs
    const sbConfig = Supabase.getSupabaseConfig();
    const sbUrlInp = document.getElementById('setting-supabase-url');
    const sbKeyInp = document.getElementById('setting-supabase-key');
    const sbBadge = document.getElementById('supabase-badge-status');

    if (sbUrlInp) sbUrlInp.value = sbConfig.url;
    if (sbKeyInp) sbKeyInp.value = sbConfig.key;

    if (sbBadge) {
        if (Supabase.isSupabaseConfigured()) {
            sbBadge.className = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
            sbBadge.innerText = "Cloud Active";
        } else {
            sbBadge.className = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-[var(--border-color)]";
            sbBadge.innerText = "Local Mode";
        }
    }

    const snd = document.getElementById('setting-sound');
    if (snd) snd.checked = Sound.isSoundEnabled();

    AdminAuth.renderAdminSettingsCard();

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

    const snd = document.getElementById('setting-sound');
    if (snd) Sound.setSoundEnabled(snd.checked);

    try {
        localStorage.setItem('mpl_settings_' + Store.activeSessionId, JSON.stringify(settings));
    } catch (_) {}

    // Save Supabase credentials
    const sbUrl = document.getElementById('setting-supabase-url')?.value || '';
    const sbKey = document.getElementById('setting-supabase-key')?.value || '';
    Supabase.saveSupabaseConfig(sbUrl, sbKey);

    if (Supabase.isSupabaseConfigured() && Store.activeSessionId) {
        Supabase.syncSessionToSupabase(Store.activeSessionId)
            .then(() => UI.showToast("Pengaturan dan data berhasil disinkronkan ke Supabase Cloud!", "success"))
            .catch(err => console.warn('Supabase sync on save failed:', err));
    }

    UI.closeModal('modal-settings');
    UI.showToast("Konfigurasi simulasi berhasil disimpan!", "success");
    loadStandings();
}

export async function handleTestSupabase() {
    const url = document.getElementById('setting-supabase-url')?.value || '';
    const key = document.getElementById('setting-supabase-key')?.value || '';
    Supabase.saveSupabaseConfig(url, key);

    const statusText = document.getElementById('supabase-status-text');
    if (statusText) {
        statusText.classList.remove('hidden');
        statusText.innerText = "Menghubungi Supabase Cloud...";
        statusText.className = "text-[11px] text-blue-400 mt-1";
    }

    const result = await Supabase.testSupabaseConnection();

    if (statusText) {
        statusText.innerText = result.message;
        statusText.className = result.success 
            ? "text-[11px] text-emerald-400 font-bold mt-1" 
            : "text-[11px] text-rose-400 font-bold mt-1";
    }

    const sbBadge = document.getElementById('supabase-badge-status');
    if (sbBadge && result.success) {
        sbBadge.className = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        sbBadge.innerText = "Cloud Active";
    }
}

// --- FAST MATCH & SCORE IMPORTER CONTROLLER ---
let cachedParsedMatches = [];

export function openQuickImportModal() {
    if (!AdminAuth.isAdminLoggedIn()) {
        UI.showToast("Akses dibatasi. Silakan login sebagai Admin terlebih dahulu.", "warning");
        AdminAuth.openAdminLoginModal();
        return;
    }

    cachedParsedMatches = [];
    const txt = document.getElementById('quick-import-textarea');
    if (txt) txt.value = '';
    const container = document.getElementById('quick-import-preview-container');
    if (container) container.classList.add('hidden');
    const countEl = document.getElementById('quick-import-parsed-count');
    if (countEl) countEl.innerText = '';
    UI.openModal('modal-quick-import');
}

export function loadOfficialS18Preset() {
    const txt = document.getElementById('quick-import-textarea');
    if (txt) {
        txt.value = QuickImporter.OFFICIAL_S18_WEEK_1_TO_4_TEXT.trim();
        handlePreviewParsedMatches();
        UI.showToast("Data resmi Season 18 (Week 1-4) berhasil dimuat ke teks!", "info");
    }
}

export function handlePreviewParsedMatches() {
    const txt = document.getElementById('quick-import-textarea')?.value || '';
    cachedParsedMatches = QuickImporter.parseMatchText(txt);

    const container = document.getElementById('quick-import-preview-container');
    const tbody = document.getElementById('quick-import-preview-tbody');
    const countEl = document.getElementById('quick-import-parsed-count');

    if (!tbody || !container) return;

    if (cachedParsedMatches.length === 0) {
        container.classList.add('hidden');
        if (countEl) countEl.innerText = 'Tidak ada match valid yang terdeteksi.';
        return;
    }

    container.classList.remove('hidden');
    tbody.innerHTML = '';
    if (countEl) countEl.innerText = `${cachedParsedMatches.length} pertandingan terdeteksi`;

    cachedParsedMatches.forEach(m => {
        const scoreBadge = m.status === 'COMPLETED' 
            ? `<span class="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">${m.scoreA}-${m.scoreB}</span>`
            : `<span class="text-slate-400 font-mono">VS</span>`;

        const statusBadge = m.status === 'COMPLETED'
            ? `<span class="text-[9px] font-bold text-emerald-400 uppercase">Selesai</span>`
            : `<span class="text-[9px] font-bold text-blue-400 uppercase">Terjadwal</span>`;

        tbody.innerHTML += `
            <tr class="hover:bg-[var(--bg-secondary)] transition-colors">
                <td class="py-2 px-3 text-left font-bold text-[var(--text-secondary)]">W${m.week}</td>
                <td class="py-2 px-3 text-right font-bold text-[var(--text-primary)]">${m.teamA}</td>
                <td class="py-2 px-3 text-center">${scoreBadge}</td>
                <td class="py-2 px-3 text-left font-bold text-[var(--text-primary)]">${m.teamB}</td>
                <td class="py-2 px-3 text-center">${statusBadge}</td>
            </tr>
        `;
    });
}

export async function handleExecuteBatchImport() {
    if (!cachedParsedMatches || cachedParsedMatches.length === 0) {
        handlePreviewParsedMatches();
    }
    if (cachedParsedMatches.length === 0) {
        UI.showToast("Paste atau ketik teks pertandingan terlebih dahulu.", "warning");
        return;
    }

    const success = await QuickImporter.applyBatchMatches(cachedParsedMatches, Store.activeSessionId);
    if (success) {
        UI.closeModal('modal-quick-import');
    }
}

// --- PWA CLEANUP ---
function cleanupServiceWorkers() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            for (const reg of regs) {
                reg.unregister();
            }
        }).catch(() => {});
        if (typeof caches !== 'undefined') {
            caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
        }
    }
}
