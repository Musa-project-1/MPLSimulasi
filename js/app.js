import * as Store from './store.js';
import * as Config from './config.js';
import * as UI from './ui.js';
import { runSimulation as runSim } from './simulation.js';

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => { 
    Store.migrateLegacyData();
    Store.loadSessionsList();
    UI.renderSessionManager();
    applySavedTheme();
    
    // Attach functions to window for inline HTML handlers
    window.importSession = importSession;
    window.openCreateSessionModal = UI.openCreateSessionModal || openCreateSessionModal;
    window.handleImportFile = handleImportFile;
    window.switchTab = UI.switchTab;
    window.openSettingsModal = openSettingsModal;
    window.exportCurrentSession = exportCurrentSession;
    window.exitToSessionManager = exitToSessionManager;
    window.toggleMobileMenu = UI.toggleMobileMenu;
    window.switchSubTab = UI.switchSubTab;
    window.exportStandingsImage = exportStandingsImage;
    window.switchMatchSubTab = UI.switchMatchSubTab;
    window.loadTeams = loadTeams;
    window.openEditTeamModalFromRoster = openEditTeamModalFromRoster;
    window.closeModal = UI.closeModal;
    window.submitEditPlayer = submitEditPlayer;
    window.submitCreateSession = submitCreateSession;
    window.executeDeleteSession = executeDeleteSession;
    window.submitEditTeam = submitEditTeam;
    window.updateSettingLabel = UI.updateSettingLabel;
    window.setTheme = setTheme;
    window.saveSettings = saveSettings;
    window.saveMatchDetails = saveMatchDetails;
    window.selectTeamFromPicker = selectTeamFromPicker;
    window.openSession = openSession;
    window.deleteSession = deleteSession;
    window.changeWeek = changeWeek;
    window.updatePlayoffScore = updatePlayoffScore;
    window.openTeamPicker = openTeamPicker;
    window.quickSetScore = quickSetScore;
    window.openMatchDetailsModal = openMatchDetailsModal;
    window.openEditPlayerModal = openEditPlayerModal;
    window.shareMatchResult = shareMatchResult;
    window.exportSeasonReport = exportSeasonReport;
    window.showRoster = UI.showRoster;
    window.loadDashboard = loadDashboard;
    window.loadStandings = loadStandings;
    window.loadMatches = loadMatches;
    window.loadPlayoffs = loadPlayoffs;
    window.forceUnlockPlayoffs = forceUnlockPlayoffs;
    window.switchSettingsSection = UI.switchSettingsSection;
    
    // Database Admin
    window.openDatabaseAdmin = openDatabaseAdmin;
    window.switchAdminTemplate = switchAdminTemplate;
    window.addNewMatchupRow = addNewMatchupRow;
    window.removeMatchupRow = removeMatchupRow;
    window.saveScheduleDatabase = saveScheduleDatabase;
    window.resetTemplateToDefault = resetTemplateToDefault;
});

// --- THEME SYSTEM ---
function setTheme(theme) {
    document.body.className = ''; 
    if (theme === 'dark') document.body.classList.add('theme-dark');
    if (theme === 'mpl') document.body.classList.add('theme-mpl');
    
    localStorage.setItem('mpl_sim_theme', theme);
    updateThemeButtons(theme);
}

function applySavedTheme() {
    const saved = localStorage.getItem('mpl_sim_theme') || 'light';
    setTheme(saved);
}

function updateThemeButtons(activeTheme) {
    const themes = ['light', 'dark', 'mpl'];
    themes.forEach(t => {
        const btn = document.querySelector(`.theme-btn-${t}`);
        if (btn) {
            if (t === activeTheme) btn.classList.add('border-indigo-500', 'bg-indigo-50');
            else btn.classList.remove('border-indigo-500', 'bg-indigo-50');
        }
    });
}

// --- SESSION ACTIONS ---
function openCreateSessionModal() {
    document.getElementById('input-session-name').value = '';
    UI.openModal('modal-create-session');
}

function submitCreateSession(e) {
    e.preventDefault();
    const sessionName = document.getElementById('input-session-name').value;
    const scheduleKey = document.getElementById('input-session-schedule').value;
    if (!sessionName || sessionName.trim() === "") return;
    
    UI.closeModal('modal-create-session');

    const id = 'sess_' + Date.now();
    const sessions = Store.loadSessionsList();
    sessions.push({ id: id, name: sessionName, timestamp: Date.now() });
    Store.saveSessionsList();
    
    Store.setActiveSessionId(id);
    Store.setActiveSessionName(sessionName);
    
    initializeMockDataForSession(id, scheduleKey);
    enterApp();
}

function openSession(id) {
    const sessions = Store.loadSessionsList();
    const sess = sessions.find(s => s.id === id);
    if (!sess) return;
    
    sess.timestamp = Date.now();
    Store.saveSessionsList();
    
    Store.setActiveSessionId(sess.id);
    Store.setActiveSessionName(sess.name);
    enterApp();
}

function deleteSession(id) {
    document.getElementById('delete-session-id').value = id;
    UI.openModal('modal-confirm-delete');
}

function executeDeleteSession() {
    const id = document.getElementById('delete-session-id').value;
    let sessions = Store.loadSessionsList();
    sessions = sessions.filter(s => s.id !== id);
    Store.setSessionsList(sessions);
    Store.saveSessionsList();
    
    localStorage.removeItem('mpl_teams_' + id);
    localStorage.removeItem('mpl_matches_' + id);
    
    UI.closeModal('modal-confirm-delete');
    UI.renderSessionManager();
}

function exitToSessionManager() {
    Store.setActiveSessionId(null);
    document.getElementById('view-landing').classList.remove('hidden');
    document.getElementById('app-header').classList.add('hidden');
    document.getElementById('app-main').classList.add('hidden');

    Store.loadSessionsList();
    UI.renderSessionManager();
}

function enterApp() {
    document.getElementById('header-session-name').innerText = Store.activeSessionName;

    document.getElementById('view-landing').classList.add('hidden');
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('app-main').classList.remove('hidden');

    UI.setCurrentViewWeek(1);
    initApp();
}

function exportCurrentSession() {
    if (!Store.activeSessionId) return;
    Store.exportSession(Store.activeSessionId);
}

function importSession() {
    document.getElementById('import-file-input').click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.type !== "MPL_SIM_SESSION") {
                throw new Error("Format file tidak valid.");
            }

            const newId = 'sess_' + Date.now();
            const newSession = {
                ...data.session,
                id: newId,
                timestamp: Date.now()
            };

            const sessions = Store.loadSessionsList();
            sessions.push(newSession);
            Store.saveSessionsList();

            localStorage.setItem('mpl_teams_' + newId, JSON.stringify(data.teams));
            localStorage.setItem('mpl_matches_' + newId, JSON.stringify(data.matches));

            UI.customAlert(`Berhasil mengimpor sesi: ${newSession.name}`);
            UI.renderSessionManager();
        } catch (err) {
            UI.customAlert("Gagal mengimpor file: " + err.message);
        }
        event.target.value = ''; 
    };
    reader.readAsText(file);
}

// --- APP LOGIC ---
async function initApp() {
    await loadTeamsData(true); 
    await loadDashboard();
    UI.switchTab('dashboard', document.getElementById('nav-dashboard')); 
}

async function loadTeamsData(silent = false) {
    if(!silent) UI.showLoading(true);
    const data = await fetchAPI('get_teams');
    if(data) {
        Store.setGlobalTeams(data);
    }
    if(!silent) UI.showLoading(false);
}

async function loadDashboard() {
    const data = await fetchAPI('get_dashboard');
    if(data) {
        UI.loadDashboard(data);
    }
}

async function loadStandings() {
    let teams = await fetchAPI('get_standings');
    if(!teams) return;
    Store.setGlobalTeams(teams);
    
    const simTeams = await runSim(teams);
    UI.loadStandings(teams, simTeams);
}

async function loadMatches() {
    await loadTeamsData(true);
    const data = await fetchAPI('get_matches');
    if(!data) return;
    Store.setGlobalMatches(data);
    UI.loadMatches(data);
}

async function loadTeams() {
    await loadTeamsData();
    UI.loadTeams(Store.globalTeams);
}

function changeWeek(week) {
    UI.setCurrentViewWeek(week);
    loadMatches();
}

async function exportStandingsImage() {
    const target = document.getElementById('tab-standing');
    UI.showLoading(true);
    try {
        const canvas = await html2canvas(target, {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-main'),
            scale: 2
        });
        const url = canvas.toDataURL("image/png");
        const a = document.createElement('a');
        a.href = url;
        a.download = `MPL_Standings_${Store.activeSessionName}_${new Date().toISOString().split('T')[0]}.png`;
        a.click();
    } catch (e) {
        console.error(e);
        UI.customAlert("Gagal mengekspor gambar.");
    } finally {
        UI.showLoading(false);
    }
}

// --- DATA MODIFICATION ---
async function quickSetScore(matchId, scoreA, scoreB) {
    const match = Store.globalMatches.find(m => m.id === matchId);
    if (!match) return;

    if (scoreA !== "" && (!match.team_a_id || !match.team_b_id)) {
        UI.customAlert("Harap tentukan kedua tim terlebih dahulu sebelum mengisi skor.");
        return;
    }

    const status = scoreA === "" ? 'SCHEDULED' : 'COMPLETED';
    
    if (status === 'SCHEDULED') {
        const teams = Store.getSessionTeams();
        const updatedMatches = Store.getSessionMatches();
        const matchInStorage = updatedMatches.find(x => x.id === matchId);
        
        if (matchInStorage.games) {
            matchInStorage.games.forEach(g => {
                if (g.mvp_id) {
                    teams.forEach(t => {
                        const p = t.roster && t.roster.find(player => player.id === g.mvp_id);
                        if (p && p.stats.mvp > 0) p.stats.mvp--;
                    });
                }
            });
            matchInStorage.games = [];
        }
        Store.saveSessionData(teams, updatedMatches);
    }

    await fetchAPI('update_score', { 
        match_id: matchId, 
        score_a: scoreA, 
        score_b: scoreB, 
        status: status 
    });

    loadMatches();
    loadStandings();
    loadDashboard();
}

let activeDetailMatchId = null;
function openMatchDetailsModal(matchId) {
    const match = Store.globalMatches.find(m => m.id === matchId);
    if (!match || !match.team_a_id || !match.team_b_id) {
        UI.customAlert("Harap tentukan tim yang bertanding terlebih dahulu.");
        return;
    }

    activeDetailMatchId = matchId;
    const tA = Store.globalTeams.find(t => t.id === match.team_a_id);
    const tB = Store.globalTeams.find(t => t.id === match.team_b_id);

    const body = document.getElementById('match-details-body');
    body.innerHTML = '';

    // Face-off Visual
    const faceoff = document.createElement('div');
    faceoff.className = "flex items-center justify-center gap-8 mb-8 p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden shadow-xl";
    faceoff.innerHTML = `
        <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div class="flex flex-col items-center z-10 animate-fade-in">
            ${UI.getTeamLogo(tA.tag, 'w-20 h-20 mb-2 drop-shadow-2xl')}
            <span class="font-oswald font-bold text-xl tracking-tighter">${tA.tag}</span>
        </div>
        <div class="text-4xl font-black italic text-rose-600 z-10 font-oswald animate-pulse">VS</div>
        <div class="flex flex-col items-center z-10 animate-fade-in">
            ${UI.getTeamLogo(tB.tag, 'w-20 h-20 mb-2 drop-shadow-2xl')}
            <span class="font-oswald font-bold text-xl tracking-tighter">${tB.tag}</span>
        </div>
    `;
    body.appendChild(faceoff);

    const gamesContainer = document.createElement('div');
    gamesContainer.className = "space-y-4";
    body.appendChild(gamesContainer);

    for (let i = 1; i <= 3; i++) {
        const gameData = (match.games && match.games[i-1]) || { winner_id: "", mvp_id: "" };
        
        let playerOpts = `<option value="">- PILIH MVP -</option>`;
        const allMatchPlayers = [...(tA.roster || []), ...(tB.roster || [])];
        allMatchPlayers.forEach(p => {
            playerOpts += `<option value="${p.id}" ${gameData.mvp_id === p.id ? 'selected' : ''}>${p.nick} (${p.team_id === tA.id ? tA.tag : tB.tag})</option>`;
        });

        gamesContainer.innerHTML += `
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 slide-up" style="animation-delay: ${i*0.1}s">
                <h4 class="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center">G${i}</span> 
                    Game ${i} Result
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Winner</label>
                        <select id="game-${i}-winner" class="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[var(--mpl-red)] transition">
                            <option value="">- BELUM SELESAI -</option>
                            <option value="${tA.id}" ${gameData.winner_id === tA.id ? 'selected' : ''}>${tA.team_name} (${tA.tag})</option>
                            <option value="${tB.id}" ${gameData.winner_id === tB.id ? 'selected' : ''}>${tB.team_name} (${tB.tag})</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">MVP</label>
                        <select id="game-${i}-mvp" class="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[var(--mpl-red)] transition">
                            ${playerOpts}
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    UI.openModal('modal-match-details');
}

async function shareMatchResult(matchId) {
    const match = Store.globalMatches.find(m => m.id === matchId);
    if (!match) return;

    const tA = Store.globalTeams.find(t => t.id === match.team_a_id);
    const tB = Store.globalTeams.find(t => t.id === match.team_b_id);

    // Create a temporary hidden container for the graphic
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.height = '600px';
    container.style.padding = '60px';
    container.style.background = '#0d0202';
    container.style.color = 'white';
    container.style.fontFamily = 'Inter, sans-serif';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.zIndex = '-1000';
    
    container.innerHTML = `
        <div style="position: absolute; inset: 0; opacity: 0.15; background-image: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');"></div>
        <div style="text-transform: uppercase; letter-spacing: 0.3em; font-weight: 900; color: #9B111E; margin-bottom: 20px; font-size: 18px; position: relative;">Match Result</div>
        <div style="font-size: 12px; color: #fca5a5; margin-bottom: 60px; text-transform: uppercase; letter-spacing: 0.1em; position: relative;">Regular Season - Week ${match.week}</div>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 60px; position: relative; width: 100%;">
            <div style="display: flex; flex-direction: column; items-center; width: 200px;">
                <div style="width: 150px; height: 150px; margin: 0 auto 20px;">
                    ${UI.getTeamLogo(tA.tag, 'w-full h-full')}
                </div>
                <div style="font-family: Oswald, sans-serif; font-weight: 800; font-size: 32px; text-align: center;">${tA.tag}</div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 30px;">
                <div style="font-family: Oswald, sans-serif; font-size: 120px; font-weight: 900;">${match.score_a}</div>
                <div style="font-size: 40px; color: #9B111E; font-weight: 300;">-</div>
                <div style="font-family: Oswald, sans-serif; font-size: 120px; font-weight: 900;">${match.score_b}</div>
            </div>
            
            <div style="display: flex; flex-direction: column; items-center; width: 200px;">
                <div style="width: 150px; height: 150px; margin: 0 auto 20px;">
                    ${UI.getTeamLogo(tB.tag, 'w-full h-full')}
                </div>
                <div style="font-family: Oswald, sans-serif; font-weight: 800; font-size: 32px; text-align: center;">${tB.tag}</div>
            </div>
        </div>
        
        <div style="margin-top: 80px; text-align: center; position: relative;">
            <div style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.2em;">Simulated with</div>
            <div style="font-family: Oswald, sans-serif; font-weight: 800; font-size: 24px; color: white;">SILUMALSI <span style="color: #9B111E;">MPL</span></div>
        </div>
    `;

    document.body.appendChild(container);

    UI.showLoading(true);
    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: '#0d0202'
        });
        const url = canvas.toDataURL("image/png");
        const a = document.createElement('a');
        a.href = url;
        a.download = `Match_${tA.tag}_vs_${tB.tag}_Result.png`;
        a.click();
    } catch (e) {
        console.error(e);
        UI.customAlert("Gagal mengekspor grafik.");
    } finally {
        document.body.removeChild(container);
        UI.showLoading(false);
    }
}

async function exportSeasonReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    UI.showLoading(true);
    
    try {
        const teams = await fetchAPI('get_standings');
        const sessionName = Store.activeSessionName;
        
        // Header
        doc.setFillColor(155, 17, 30);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("SEASON REPORT", 105, 20, { align: "center" });
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Simulator Session: ${sessionName}`, 105, 30, { align: "center" });
        
        // Standings Table
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Final Standings", 20, 55);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Pos", 20, 65);
        doc.text("Team", 35, 65);
        doc.text("W", 100, 65);
        doc.text("L", 115, 65);
        doc.text("Points", 130, 65);
        doc.text("Win Rate", 160, 65);
        
        doc.setLineWidth(0.5);
        doc.line(20, 67, 190, 67);
        
        doc.setFont("helvetica", "normal");
        teams.forEach((t, i) => {
            const y = 75 + (i * 10);
            doc.text((i + 1).toString(), 20, y);
            doc.text(`${t.team_name} (${t.tag})`, 35, y);
            doc.text(t.match_win.toString(), 100, y);
            doc.text(t.match_lose.toString(), 115, y);
            doc.text(t.points.toString(), 130, y);
            const wr = t.match_played > 0 ? Math.round((t.match_win / t.match_played) * 100) + '%' : '0%';
            doc.text(wr, 160, y);
            
            if (i < teams.length - 1) {
                doc.setDrawColor(230, 230, 230);
                doc.line(20, y + 3, 190, y + 3);
            }
        });
        
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated by Silumalsi - ${new Date().toLocaleString()}`, 105, 285, { align: "center" });
        
        doc.save(`${sessionName}_Season_Report.pdf`);
        UI.customAlert("Laporan PDF berhasil diunduh.");
    } catch (e) {
        console.error(e);
        UI.customAlert("Gagal membuat laporan PDF.");
    } finally {
        UI.showLoading(false);
    }
}

async function saveMatchDetails() {
    const match = Store.globalMatches.find(m => m.id === activeDetailMatchId);
    if (!match) return;

    const teams = Store.getSessionTeams();
    const updatedMatches = Store.getSessionMatches();
    const matchInStorage = updatedMatches.find(x => x.id === activeDetailMatchId);

    if (matchInStorage.games) {
        matchInStorage.games.forEach(g => {
            if (g.mvp_id) {
                teams.forEach(t => {
                    const p = t.roster && t.roster.find(player => player.id === g.mvp_id);
                    if (p && p.stats.mvp > 0) p.stats.mvp--;
                });
            }
        });
    }

    const games = [];
    let winA = 0;
    let winB = 0;

    for (let i = 1; i <= 3; i++) {
        const winnerId = document.getElementById(`game-${i}-winner`).value;
        const mvpId = document.getElementById(`game-${i}-mvp`).value;
        
        if (winnerId) {
            games.push({ winner_id: winnerId, mvp_id: mvpId });
            if (winnerId === match.team_a_id) winA++;
            else winB++;
        }
    }

    if (winA === 0 && winB === 0) {
        matchInStorage.games = [];
        Store.saveSessionData(teams, updatedMatches);
        await fetchAPI('update_score', { match_id: activeDetailMatchId, score_a: "", score_b: "", status: 'SCHEDULED' });
    } else if (winA < 2 && winB < 2) {
        UI.customAlert("Tolak: Salah satu tim harus mencapai 2 kemenangan (BO3) untuk menyelesaikan pertandingan.");
        return;
    } else {
        await fetchAPI('update_score', { 
            match_id: activeDetailMatchId, 
            score_a: winA, 
            score_b: winB, 
            status: 'COMPLETED' 
        });

        matchInStorage.games = games;

        games.forEach(g => {
            if (g.mvp_id) {
                teams.forEach(t => {
                    const p = t.roster && t.roster.find(player => player.id === g.mvp_id);
                    if (p) p.stats.mvp++;
                });
            }
        });
        Store.saveSessionData(teams, updatedMatches);
    }

    UI.closeModal('modal-match-details');
    loadMatches();
    loadStandings();
    loadDashboard();
}

function openEditPlayerModal(id, nick, role) {
    document.getElementById('edit-player-id').value = id;
    document.getElementById('edit-player-nick').value = nick;
    document.getElementById('edit-player-role').value = role;
    UI.openModal('modal-edit-player');
}

async function submitEditPlayer(e) {
    e.preventDefault();
    const id = document.getElementById('edit-player-id').value;
    const nick = document.getElementById('edit-player-nick').value;
    const role = document.getElementById('edit-player-role').value;

    const team = Store.globalTeams.find(t => t.id === UI.activeRosterTeamId);
    if (team && team.roster) {
        const player = team.roster.find(p => p.id === id);
        if (player) {
            player.nick = nick;
            player.role = role;
            Store.saveSessionData(Store.globalTeams, Store.globalMatches);
            UI.closeModal('modal-edit-player');
            UI.renderRoster(UI.activeRosterTeamId);
        }
    }
}

function openEditTeamModalFromRoster() {
    const team = Store.globalTeams.find(t => t.id === UI.activeRosterTeamId);
    if (team) openEditTeamModal(team.id, team.team_name, team.tag);
}

function openEditTeamModal(id, name, tag) {
    document.getElementById('edit-team-id').value = id;
    document.getElementById('edit-team-name').value = name;
    document.getElementById('edit-team-tag').value = tag;
    UI.openModal('modal-edit-team');
}

async function submitEditTeam(e) { 
    e.preventDefault(); 
    await fetchAPI('edit_team', { 
        id: document.getElementById('edit-team-id').value,
        team_name: document.getElementById('edit-team-name').value, 
        tag: document.getElementById('edit-team-tag').value.toUpperCase() 
    }); 
    UI.closeModal('modal-edit-team'); 
    loadTeams(); 
    loadStandings();
    loadMatches();
    loadDashboard();
}

let activePickerMatchId = null;
let activePickerRole = null; 

function openTeamPicker(matchId, role) {
    const match = Store.globalMatches.find(m => m.id === matchId);
    if (match.status === 'COMPLETED') {
        UI.customAlert("Pertandingan ini sudah selesai! Harap kosongkan hasil pertandingannya terlebih dahulu jika ingin mengganti tim.");
        return;
    }

    activePickerMatchId = matchId;
    activePickerRole = role;

    const grid = document.getElementById('team-picker-grid');
    grid.innerHTML = '';

    const opponentId = role === 'home' ? match.team_b_id : match.team_a_id;

    Store.globalTeams.forEach(team => {
        const isDisabled = team.id === opponentId;
        grid.innerHTML += `
            <button onclick="${isDisabled ? '' : `selectTeamFromPicker('${team.id}')`}" 
                class="flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${isDisabled ? 'opacity-20 cursor-not-allowed border-transparent' : 'border-slate-100 hover:border-[var(--mpl-red)] hover:bg-red-50 hover:scale-105'}">
                ${UI.getTeamLogo(team.tag, 'w-16 h-16 mb-2')}
                <span class="text-[10px] font-bold text-slate-700 uppercase">${team.tag}</span>
            </button>
        `;
    });

    document.getElementById('picker-subtitle').innerText = role === 'home' ? 'Pilih Tim Home (Tuan Rumah)' : 'Pilih Tim Away (Tamu)';
    UI.openModal('modal-team-picker');
}

async function selectTeamFromPicker(teamId) {
    await updateMatchTeamInline(activePickerMatchId, activePickerRole, teamId);
    UI.closeModal('modal-team-picker');
}

async function updateMatchTeamInline(matchId, role, newTeamId) {
    const match = Store.globalMatches.find(m => m.id === matchId);
    if (match.status === 'COMPLETED') {
        UI.customAlert("Pertandingan ini sudah selesai! Harap kosongkan angka skornya (kembali ke simbol '-') jika Anda ingin mereset dan mengganti nama tim.");
        loadMatches(); 
        return;
    }
    if (role === 'home' && newTeamId === match.team_b_id && newTeamId !== "") {
        UI.customAlert("Tim Home dan Tim Away tidak boleh sama!");
        loadMatches();
        return;
    }
    if (role === 'away' && newTeamId === match.team_a_id && newTeamId !== "") {
        UI.customAlert("Tim Home dan Tim Away tidak boleh sama!");
        loadMatches();
        return;
    }

    await fetchAPI('update_match_team_inline', { matchId, role, newTeamId });
    loadMatches(); 
}

function openSettingsModal() {
    const settings = JSON.parse(localStorage.getItem('mpl_settings_' + Store.activeSessionId) || JSON.stringify(Config.DEFAULT_SETTINGS));
    
    document.getElementById('setting-volatility').value = settings.volatility;
    document.getElementById('val-setting-volatility').innerText = settings.volatility + '%';
    document.getElementById('setting-h2h').checked = settings.h2hBias;
    document.getElementById('setting-momentum').checked = settings.momentum;
    document.getElementById('setting-fatigue').checked = settings.fatigue;
    document.getElementById('setting-rivalry').checked = settings.rivalry;

    UI.openModal('modal-settings');
}

function saveSettings() {
    const settings = {
        volatility: parseInt(document.getElementById('setting-volatility').value),
        h2hBias: document.getElementById('setting-h2h').checked,
        momentum: document.getElementById('setting-momentum').checked,
        fatigue: document.getElementById('setting-fatigue').checked,
        rivalry: document.getElementById('setting-rivalry').checked
    };
    localStorage.setItem('mpl_settings_' + Store.activeSessionId, JSON.stringify(settings));
    UI.closeModal('modal-settings');
    UI.customAlert("Konfigurasi simulasi berhasil disimpan!");
    loadStandings(); 
}

// --- PLAYOFFS ---
async function loadPlayoffs() {
    const matches = Store.getSessionMatches();
    const totalCount = matches.length;
    const completedCount = matches.filter(m => m.status === 'COMPLETED').length;
    const isForced = localStorage.getItem('mpl_force_playoff_' + Store.activeSessionId) === 'true';
    
    const bracketContainer = document.getElementById('playoff-bracket-container');
    const lockMessage = document.getElementById('playoff-lock-message');

    if (!isForced && (completedCount < totalCount || totalCount === 0)) {
        bracketContainer.innerHTML = '';
        lockMessage.classList.remove('hidden');
        
        // Update the lock message text to show progress
        const pTag = lockMessage.querySelector('p');
        if (pTag) pTag.innerText = `Selesaikan semua ${totalCount} pertandingan Regular Season untuk mengunci klasemen dan membuat Bracket Playoff secara otomatis. (${completedCount}/${totalCount} Selesai)`;
        
        return;
    }

    lockMessage.classList.add('hidden');
    
    let playoffData = JSON.parse(localStorage.getItem('mpl_playoffs_' + Store.activeSessionId));
    if (!playoffData) {
        playoffData = initializePlayoffBracket();
        localStorage.setItem('mpl_playoffs_' + Store.activeSessionId, JSON.stringify(playoffData));
    }

    UI.renderPlayoffBracket(playoffData);

    // If forced, add a "Draft" banner
    if (isForced && completedCount < totalCount) {
        const banner = document.createElement('div');
        banner.className = "max-w-xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm";
        banner.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><i class="ph-fill ph-warning-circle text-xl"></i></div>
                <div>
                    <p class="text-xs font-bold text-amber-800 uppercase tracking-tight">Draft Bracket Mode</p>
                    <p class="text-[10px] text-amber-600 font-medium">Tim dipilih berdasarkan klasemen sementara. Reset jika ingin update otomatis.</p>
                </div>
            </div>
            <button onclick="localStorage.removeItem('mpl_force_playoff_' + Store.activeSessionId); localStorage.removeItem('mpl_playoffs_' + Store.activeSessionId); loadPlayoffs();" 
                class="px-4 py-2 bg-white border border-amber-200 text-amber-700 text-[10px] font-black rounded-lg hover:bg-amber-100 transition-colors uppercase">Reset Playoff</button>
        `;
        bracketContainer.prepend(banner);
    }
}

function forceUnlockPlayoffs() {
    localStorage.setItem('mpl_force_playoff_' + Store.activeSessionId, 'true');
    loadPlayoffs();
}

function initializePlayoffBracket() {
    const teams = [...Store.globalTeams].sort((a, b) => {
        if (b.match_win !== a.match_win) return b.match_win - a.match_win;
        return b.points - a.points;
    });

    const totalTeams = teams.length;
    
    // FORMAT 1: TOP 6 (Standard MPL)
    if (totalTeams >= 6) {
        const top6 = teams.slice(0, 6);
        return {
            format: "top6",
            rounds: [
                {
                    name: "Play-ins",
                    matches: [
                        { id: "p1", teamA: top6[2], teamB: top6[5], scoreA: "", scoreB: "", winner: null, nextMatch: "p3", slot: "A" },
                        { id: "p2", teamA: top6[3], teamB: top6[4], scoreA: "", scoreB: "", winner: null, nextMatch: "p4", slot: "A" }
                    ]
                },
                {
                    name: "Upper Semifinals",
                    matches: [
                        { id: "p3", teamA: top6[0], teamB: null, scoreA: "", scoreB: "", winner: null, nextMatch: "p5", slot: "A" },
                        { id: "p4", teamA: top6[1], teamB: null, scoreA: "", scoreB: "", winner: null, nextMatch: "p5", slot: "B" }
                    ]
                },
                {
                    name: "Upper Finals",
                    matches: [
                        { id: "p5", teamA: null, teamB: null, scoreA: "", scoreB: "", winner: null, nextMatch: "p7", slot: "A" }
                    ]
                },
                {
                    name: "Grand Finals",
                    matches: [
                        { id: "p7", teamA: null, teamB: null, scoreA: "", scoreB: "", winner: null, nextMatch: null }
                    ]
                }
            ]
        };
    } 
    
    // FORMAT 2: TOP 4 (For sessions with fewer teams or short formats)
    else {
        const top4 = teams.slice(0, 4);
        return {
            format: "top4",
            rounds: [
                {
                    name: "Semifinals",
                    matches: [
                        { id: "s1", teamA: top4[0], teamB: top4[3], scoreA: "", scoreB: "", winner: null, nextMatch: "s3", slot: "A" },
                        { id: "s2", teamA: top4[1], teamB: top4[2], scoreA: "", scoreB: "", winner: null, nextMatch: "s3", slot: "B" }
                    ]
                },
                {
                    name: "Grand Finals",
                    matches: [
                        { id: "s3", teamA: null, teamB: null, scoreA: "", scoreB: "", winner: null, nextMatch: null }
                    ]
                }
            ]
        };
    }
}

function updatePlayoffScore(matchId, slot, value) {
    let playoffData = JSON.parse(localStorage.getItem('mpl_playoffs_' + Store.activeSessionId));
    
    let targetMatch = null;
    playoffData.rounds.forEach(round => {
        const m = round.matches.find(x => x.id === matchId);
        if (m) targetMatch = m;
    });

    if (!targetMatch) return;

    if (slot === 'A') targetMatch.scoreA = value;
    else targetMatch.scoreB = value;

    const sA = parseInt(targetMatch.scoreA);
    const sB = parseInt(targetMatch.scoreB);
    const isFinal = matchId === "p7";
    const winThreshold = isFinal ? 4 : 3;

    if (sA >= winThreshold || sB >= winThreshold) {
        if (sA === sB) {
            UI.customAlert("Skor tidak boleh seri!");
            targetMatch.winner = null;
        } else {
            targetMatch.winner = sA > sB ? targetMatch.teamA : targetMatch.teamB;
            
            if (targetMatch.nextMatch) {
                let nextM = null;
                playoffData.rounds.forEach(round => {
                    const m = round.matches.find(x => x.id === targetMatch.nextMatch);
                    if (m) nextM = m;
                });

                if (nextM) {
                    if (targetMatch.slot === "A") nextM.teamA = targetMatch.winner;
                    else nextM.teamB = targetMatch.winner;
                }
            }
        }
    } else {
        targetMatch.winner = null;
    }

    localStorage.setItem('mpl_playoffs_' + Store.activeSessionId, JSON.stringify(playoffData));
    UI.renderPlayoffBracket(playoffData);
}

// --- MOCK API ---
async function fetchAPI(action, payload = null) {
    UI.showLoading(true);
    try {
        await new Promise(r => setTimeout(r, 60)); 
        return handleMockData(action, payload);
    } catch (error) {
        console.error(error); return null;
    } finally { UI.showLoading(false); }
}

function handleMockData(action, payload) {
    let mock_teams = Store.getSessionTeams();
    let mock_matches = Store.getSessionMatches();

    if(action === 'get_teams') return [...mock_teams];
    if(action === 'get_matches') return [...mock_matches];
    
    if(action === 'get_standings') {
        return [...mock_teams].sort((a, b) => {
            if (b.match_win !== a.match_win) return b.match_win - a.match_win;
            return b.points - a.points;
        });
    }

    if(action === 'get_dashboard') {
        const completed = mock_matches.filter(m => m.status === 'COMPLETED').length;
        const upcoming = mock_matches.filter(m => m.status === 'SCHEDULED')
                                     .sort((a, b) => parseInt(a.week) - parseInt(b.week) || parseInt(a.day) - parseInt(b.day))
                                     .slice(0, 4);

        let sorted = [...mock_teams].sort((a, b) => {
            if (b.match_win !== a.match_win) return b.match_win - a.match_win;
            return b.points - a.points;
        });
        
        return { 
            total_teams: mock_teams.length, 
            total_matches: mock_matches.length, 
            completed_matches: completed, 
            upcoming_matches: upcoming,
            top_teams: sorted.slice(0, 5) 
        };
    }

    if(action === 'edit_team') {
        const team = mock_teams.find(t => t.id === payload.id);
        if(team) {
            team.team_name = payload.team_name;
            team.tag = payload.tag;
            Store.saveSessionData(mock_teams, mock_matches);
        }
        return { success: true };
    }

    if(action === 'update_match_team_inline') {
        const match = mock_matches.find(m => m.id === payload.matchId);
        if(match && match.status !== 'COMPLETED') {
            if (payload.role === 'home') match.team_a_id = payload.newTeamId;
            if (payload.role === 'away') match.team_b_id = payload.newTeamId;
            Store.saveSessionData(mock_teams, mock_matches);
        }
        return { success: true };
    }

    if(action === 'update_score') {
        const match = mock_matches.find(m => m.id === payload.match_id);
        if(match) {
            if(match.status === 'COMPLETED') {
                const tA_old = mock_teams.find(t => t.id === match.team_a_id);
                const tB_old = mock_teams.find(t => t.id === match.team_b_id);
                if (tA_old && tB_old) {
                    const aWins_old = match.score_a > match.score_b;
                    tA_old.match_played--; tB_old.match_played--;
                    tA_old.game_win -= match.score_a; tA_old.game_lose -= match.score_b;
                    tB_old.game_win -= match.score_b; tB_old.game_lose -= match.score_a;
                    if(aWins_old){ tA_old.match_win--; tB_old.match_lose--; } else { tB_old.match_win--; tA_old.match_lose--; }
                    tA_old.points = tA_old.game_win - tA_old.game_lose;
                    tB_old.points = tB_old.game_win - tB_old.game_lose;
                }
            }

            match.score_a = payload.score_a; 
            match.score_b = payload.score_b; 
            match.status = payload.status;
            
            if (match.status === 'COMPLETED') {
                const tA = mock_teams.find(t => t.id === match.team_a_id);
                const tB = mock_teams.find(t => t.id === match.team_b_id);
                if (tA && tB) {
                    const aWins = payload.score_a > payload.score_b;
                    tA.match_played++; tB.match_played++;
                    tA.game_win += payload.score_a; tA.game_lose += payload.score_b;
                    tB.game_win += payload.score_b; tB.game_lose += payload.score_a;
                    if(aWins){ tA.match_win++; tB.match_lose++; } 
                    else { tB.match_win++; tA.match_lose++; }
                    tA.points = tA.game_win - tA.game_lose;
                    tB.points = tB.game_win - tB.game_lose;
                }
            }
            Store.saveSessionData(mock_teams, mock_matches);
        }
        return { success: true };
    }
}

function initializeMockDataForSession(sessionId, scheduleKey = 'standard') {
    const mock_teams = Config.getInitialMockTeams();
    const db = getScheduleDatabase();
    const template = db[scheduleKey] || db['standard'];
    
    let mock_matches = [];
    let matchCounter = 1;
    const startDate = new Date(); 

    // Create a mapping of team tags to their generated IDs
    const tagToId = {};
    mock_teams.forEach(t => { tagToId[t.tag] = t.id; });

    for (let w = 1; w <= template.weeks; w++) {
        template.daysPerWeek.forEach((d, dIndex) => {
            let currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + ((w-1) * 7) + dIndex);
            let dateStr = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

            for (let m = 0; m < d.count; m++) {
                let teamA_id = "";
                let teamB_id = "";

                // If template has specific matchups, use them
                if (template.matchups) {
                    const dayMatchups = template.matchups.filter(x => x.week === w && x.day === d.day);
                    if (dayMatchups[m]) {
                        teamA_id = tagToId[dayMatchups[m].teamA] || "";
                        teamB_id = tagToId[dayMatchups[m].teamB] || "";
                    }
                }

                mock_matches.push({
                    id: 'm_auto_' + sessionId + '_' + matchCounter,
                    week: w,
                    day: d.day,
                    day_name: d.name,
                    date: dateStr,
                    team_a_id: teamA_id, 
                    team_b_id: teamB_id, 
                    score_a: "",
                    score_b: "",
                    status: 'SCHEDULED'
                });
                matchCounter++;
            }
        });
    }
    
    Store.saveSessionData(mock_teams, mock_matches, sessionId);

    localStorage.setItem('mpl_settings_' + sessionId, JSON.stringify(Config.DEFAULT_SETTINGS));
}

// --- DATABASE ADMIN LOGIC ---

function getScheduleDatabase() {
    const custom = localStorage.getItem('mpl_custom_schedule_db');
    if (custom) {
        return JSON.parse(custom);
    }
    return Config.SCHEDULE_TEMPLATES;
}

function openDatabaseAdmin() {
    UI.closeModal('modal-settings');
    const db = getScheduleDatabase();
    const allTeams = Config.getInitialMockTeams();
    UI.renderDatabaseAdmin(UI.activeAdminTemplate, db[UI.activeAdminTemplate], allTeams);
    UI.openModal('modal-database-admin');
}

function switchAdminTemplate(key) {
    const db = getScheduleDatabase();
    const allTeams = Config.getInitialMockTeams();
    UI.renderDatabaseAdmin(key, db[key], allTeams);
}

function addNewMatchupRow() {
    const allTeams = Config.getInitialMockTeams();
    UI.addEmptyMatchupRow(allTeams);
}

function removeMatchupRow(index) {
    const rows = document.querySelectorAll('.admin-matchup-item');
    if (rows[index]) {
        rows[index].remove();
    }
}

function saveScheduleDatabase() {
    const templateKey = UI.activeAdminTemplate;
    const db = getScheduleDatabase();
    
    const matchupRows = document.querySelectorAll('.admin-matchup-item');
    const newMatchups = [];

    matchupRows.forEach(row => {
        const week = parseInt(row.querySelector('.admin-input-week').value);
        const day = parseInt(row.querySelector('.admin-input-day').value);
        const teamA = row.querySelector('.admin-input-teamA').value;
        const teamB = row.querySelector('.admin-input-teamB').value;

        if (teamA || teamB) {
            newMatchups.push({ week, day, teamA, teamB });
        }
    });

    // Sort by week then day
    newMatchups.sort((a, b) => (a.week - b.week) || (a.day - b.day));

    db[templateKey].matchups = newMatchups;
    localStorage.setItem('mpl_custom_schedule_db', JSON.stringify(db));
    
    UI.customAlert("Database Jadwal berhasil diperbarui!");
    UI.closeModal('modal-database-admin');
}

function resetTemplateToDefault() {
    const templateKey = UI.activeAdminTemplate;
    const db = getScheduleDatabase();
    
    db[templateKey] = JSON.parse(JSON.stringify(Config.SCHEDULE_TEMPLATES[templateKey]));
    localStorage.setItem('mpl_custom_schedule_db', JSON.stringify(db));
    
    const allTeams = Config.getInitialMockTeams();
    UI.renderDatabaseAdmin(templateKey, db[templateKey], allTeams);
    UI.customAlert(`Template ${templateKey} telah direset ke setelan pabrik.`);
}

