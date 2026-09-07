/**
 * Schedule, Match Operations, and Data Mutation Layer
 */

import * as Store from '../store.js';
import * as Config from '../config.js';
import { openModal, closeModal, customAlert, showLoading, getTeamLogo } from '../ui/core.js';
import { calculateStandings } from '../rules/standings.js';
import { getScheduleDatabase } from './admin.js';
import { isSupabaseConfigured, syncSessionToSupabase } from './supabase.js';
import { validateBo3Score } from '../rules/validators.js';
import { playScoreSound } from './sound.js';

let activeDetailMatchId = null;

export { getScheduleDatabase };
export * from './roster.js';

export function initializeMockDataForSession(sessionId, scheduleKey = 'standard') {
    const mock_teams = Config.getInitialMockTeams();
    const db = getScheduleDatabase();
    const template = db[scheduleKey] || db['standard'];

    const mock_matches = [];
    let matchCounter = 1;
    const startDate = new Date();

    const tagToId = {};
    mock_teams.forEach(t => { tagToId[t.tag] = t.id; });

    for (let w = 1; w <= template.weeks; w++) {
        (template.daysPerWeek || []).forEach((d, dIndex) => {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + ((w - 1) * 7) + dIndex);
            const dateStr = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000))
                .toISOString().split('T')[0];

            for (let m = 0; m < d.count; m++) {
                let teamA_id = "";
                let teamB_id = "";

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
    try {
        localStorage.setItem('mpl_settings_' + sessionId, JSON.stringify(Config.DEFAULT_SETTINGS));
    } catch (_) {}
}

export async function quickSetScore(matchId, scoreA, scoreB) {
    const match = Store.globalMatches.find(m => m.id === matchId);
    if (!match) return;

    const validation = validateBo3Score(scoreA, scoreB);
    if (!validation.valid) {
        customAlert(validation.error);
        return;
    }

    if (!validation.isReset && (!match.team_a_id || !match.team_b_id)) {
        customAlert("Harap tentukan kedua tim terlebih dahulu sebelum mengisi skor.");
        return;
    }

    const status = validation.isReset ? 'SCHEDULED' : 'COMPLETED';
    const sA = validation.isReset ? "" : validation.scoreA;
    const sB = validation.isReset ? "" : validation.scoreB;

    if (status === 'SCHEDULED') {
        const teams = Store.getSessionTeams();
        const updatedMatches = Store.getSessionMatches();
        const matchInStorage = updatedMatches.find(x => x.id === matchId);

        if (matchInStorage && matchInStorage.games) {
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
        score_a: sA,
        score_b: sB,
        status
    });

    if (window.loadMatches) window.loadMatches();
    if (window.loadStandings) window.loadStandings();
    if (window.loadDashboard) window.loadDashboard();
}

export function openMatchDetailsModal(matchId) {
    const match = Store.globalMatches.find(m => m.id === matchId);
    if (!match || !match.team_a_id || !match.team_b_id) {
        customAlert("Harap tentukan tim yang bertanding terlebih dahulu.");
        return;
    }

    activeDetailMatchId = matchId;
    const tA = Store.globalTeams.find(t => t.id === match.team_a_id);
    const tB = Store.globalTeams.find(t => t.id === match.team_b_id);

    const body = document.getElementById('match-details-body');
    if (!body) return;
    body.innerHTML = '';

    const faceoff = document.createElement('div');
    faceoff.className = "flex items-center justify-center gap-8 mb-8 p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden shadow-xl";
    faceoff.innerHTML = `
        <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div class="flex flex-col items-center z-10 animate-fade-in">
            ${getTeamLogo(tA.tag, 'w-20 h-20 mb-2 drop-shadow-2xl')}
            <span class="font-oswald font-bold text-xl tracking-tighter">${tA.tag}</span>
        </div>
        <div class="text-4xl font-black italic text-rose-600 z-10 font-oswald animate-pulse">VS</div>
        <div class="flex flex-col items-center z-10 animate-fade-in">
            ${getTeamLogo(tB.tag, 'w-20 h-20 mb-2 drop-shadow-2xl')}
            <span class="font-oswald font-bold text-xl tracking-tighter">${tB.tag}</span>
        </div>
    `;
    body.appendChild(faceoff);

    const gamesContainer = document.createElement('div');
    gamesContainer.className = "space-y-4";
    body.appendChild(gamesContainer);

    for (let i = 1; i <= 3; i++) {
        const gameData = (match.games && match.games[i - 1]) || { winner_id: "", mvp_id: "" };

        let playerOpts = `<option value="">-- PILIH MVP --</option>`;
        const allMatchPlayers = [...(tA.roster || []), ...(tB.roster || [])];
        allMatchPlayers.forEach(p => {
            playerOpts += `<option value="${p.id}" ${gameData.mvp_id === p.id ? 'selected' : ''}>${p.nick} (${p.team_id === tA.id ? tA.tag : tB.tag})</option>`;
        });

        gamesContainer.innerHTML += `
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 slide-up" style="animation-delay: ${i * 0.1}s">
                <h4 class="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center">G${i}</span> 
                    Game ${i} Result
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Winner</label>
                        <select id="game-${i}-winner" class="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[var(--mpl-red)] transition">
                            <option value="">-- BELUM SELESAI --</option>
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

    openModal('modal-match-details');
}

export async function saveMatchDetails() {
    const match = Store.globalMatches.find(m => m.id === activeDetailMatchId);
    if (!match) return;

    const teams = Store.getSessionTeams();
    const updatedMatches = Store.getSessionMatches();
    const matchInStorage = updatedMatches.find(x => x.id === activeDetailMatchId);

    if (matchInStorage && matchInStorage.games) {
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
        const winnerEl = document.getElementById(`game-${i}-winner`);
        const mvpEl = document.getElementById(`game-${i}-mvp`);
        const winnerId = winnerEl?.value;
        const mvpId = mvpEl?.value;

        if (winnerId) {
            games.push({ winner_id: winnerId, mvp_id: mvpId });
            if (winnerId === match.team_a_id) winA++;
            else winB++;
        }
    }

    const scoreValidation = validateBo3Score(
        winA === 0 && winB === 0 ? "" : winA,
        winA === 0 && winB === 0 ? "" : winB
    );

    if (!scoreValidation.valid) {
        customAlert(scoreValidation.error);
        return;
    }

    if (scoreValidation.isReset) {
        matchInStorage.games = [];
        Store.saveSessionData(teams, updatedMatches);
        await fetchAPI('update_score', { match_id: activeDetailMatchId, score_a: "", score_b: "", status: 'SCHEDULED' });
    } else {
        await fetchAPI('update_score', {
            match_id: activeDetailMatchId,
            score_a: scoreValidation.scoreA,
            score_b: scoreValidation.scoreB,
            status: 'COMPLETED'
        });

        games.forEach(g => {
            if (g.mvp_id) {
                teams.forEach(t => {
                    const p = t.roster && t.roster.find(player => player.id === g.mvp_id);
                    if (p) p.stats.mvp = (p.stats.mvp || 0) + 1;
                });
            }
        });

        matchInStorage.games = games;
        Store.saveSessionData(teams, updatedMatches);
    }

    closeModal('modal-match-details');
    if (window.loadMatches) window.loadMatches();
    if (window.loadStandings) window.loadStandings();
    if (window.loadDashboard) window.loadDashboard();
}

export function changeWeek(week) {
    if (window.setCurrentViewWeek) window.setCurrentViewWeek(week);
    if (window.loadMatches) window.loadMatches();
}

/**
 * Mock API with Official MPL Tie-breaker standings integration
 */
export async function fetchAPI(action, payload = null) {
    showLoading(true);
    try {
        await new Promise(r => setTimeout(r, 40));
        const result = handleMockData(action, payload);

        if (['update_score', 'update_match_team_inline', 'edit_team'].includes(action)) {
            if (isSupabaseConfigured() && Store.activeSessionId) {
                syncSessionToSupabase(Store.activeSessionId).catch(err => console.warn('Supabase auto-sync failed:', err));
            }
        }

        return result;
    } catch (error) {
        console.error(error);
        return null;
    } finally {
        showLoading(false);
    }
}

export function handleMockData(action, payload) {
    const mock_teams = Store.getSessionTeams();
    const mock_matches = Store.getSessionMatches();

    if (action === 'get_teams') return [...mock_teams];
    if (action === 'get_matches') return [...mock_matches];

    if (action === 'get_standings') {
        return calculateStandings(mock_teams, mock_matches);
    }

    if (action === 'get_dashboard') {
        const completed = mock_matches.filter(m => m.status === 'COMPLETED').length;
        const upcoming = mock_matches.filter(m => m.status === 'SCHEDULED')
            .sort((a, b) => parseInt(a.week) - parseInt(b.week) || parseInt(a.day) - parseInt(b.day))
            .slice(0, 4);

        const sorted = calculateStandings(mock_teams, mock_matches);

        return {
            total_teams: mock_teams.length,
            total_matches: mock_matches.length,
            completed_matches: completed,
            upcoming_matches: upcoming,
            top_teams: sorted.slice(0, 5)
        };
    }

    if (action === 'edit_team') {
        const team = mock_teams.find(t => t.id === payload.id);
        if (team) {
            team.team_name = payload.team_name;
            team.tag = payload.tag;
            Store.saveSessionData(mock_teams, mock_matches);
        }
        return { success: true };
    }

    if (action === 'update_match_team_inline') {
        const match = mock_matches.find(m => m.id === payload.matchId);
        if (match && match.status !== 'COMPLETED') {
            if (payload.role === 'home') match.team_a_id = payload.newTeamId;
            if (payload.role === 'away') match.team_b_id = payload.newTeamId;
            Store.saveSessionData(mock_teams, mock_matches);
        }
        return { success: true };
    }

    if (action === 'update_score') {
        const match = mock_matches.find(m => m.id === payload.match_id);
        if (match) {
            if (match.status === 'COMPLETED') {
                const tA_old = mock_teams.find(t => t.id === match.team_a_id);
                const tB_old = mock_teams.find(t => t.id === match.team_b_id);
                if (tA_old && tB_old) {
                    const aWins_old = match.score_a > match.score_b;
                    tA_old.match_played--; tB_old.match_played--;
                    tA_old.game_win -= match.score_a; tA_old.game_lose -= match.score_b;
                    tB_old.game_win -= match.score_b; tB_old.game_lose -= match.score_a;
                    if (aWins_old) { tA_old.match_win--; tB_old.match_lose--; }
                    else { tB_old.match_win--; tA_old.match_lose--; }
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
                    if (aWins) { tA.match_win++; tB.match_lose++; }
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
