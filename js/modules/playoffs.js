/**
 * Playoff Bracket State Machine & Tournament Progression
 */

import * as Store from '../store.js';
import { customAlert } from '../ui/core.js';
import { renderPlayoffBracket } from '../ui/playoffs.js';
import { calculateStandings } from '../rules/standings.js';
import { validatePlayoffScore } from '../rules/validators.js';

export async function loadPlayoffs() {
    const matches = Store.getSessionMatches();
    const totalCount = matches.length;
    const completedCount = matches.filter(m => m.status === 'COMPLETED').length;
    const isForced = localStorage.getItem('mpl_force_playoff_' + Store.activeSessionId) === 'true';

    const bracketContainer = document.getElementById('playoff-bracket-container');
    const lockMessage = document.getElementById('playoff-lock-message');

    if (!bracketContainer || !lockMessage) return;

    if (!isForced && (completedCount < totalCount || totalCount === 0)) {
        bracketContainer.innerHTML = '';
        lockMessage.classList.remove('hidden');

        const pTag = lockMessage.querySelector('p');
        if (pTag) {
            pTag.innerText = `Selesaikan semua ${totalCount} pertandingan Regular Season untuk mengunci klasemen dan membuat Bracket Playoff secara otomatis. (${completedCount}/${totalCount} Selesai)`;
        }
        return;
    }

    lockMessage.classList.add('hidden');

    let playoffData = null;
    try {
        const raw = localStorage.getItem('mpl_playoffs_' + Store.activeSessionId);
        if (raw) playoffData = JSON.parse(raw);
    } catch (_) {}

    if (!playoffData) {
        playoffData = initializePlayoffBracket();
        localStorage.setItem('mpl_playoffs_' + Store.activeSessionId, JSON.stringify(playoffData));
    }

    renderPlayoffBracket(playoffData);

    // If forced, add draft banner
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
            <button onclick="resetPlayoffDraft()" 
                class="px-4 py-2 bg-white border border-amber-200 text-amber-700 text-[10px] font-black rounded-lg hover:bg-amber-100 transition-colors uppercase">Reset Playoff</button>
        `;
        bracketContainer.prepend(banner);
    }
}

export function resetPlayoffDraft() {
    if (!Store.activeSessionId) return;
    try {
        localStorage.removeItem('mpl_force_playoff_' + Store.activeSessionId);
        localStorage.removeItem('mpl_playoffs_' + Store.activeSessionId);
    } catch (_) {}
    loadPlayoffs();
}

export function forceUnlockPlayoffs() {
    localStorage.setItem('mpl_force_playoff_' + Store.activeSessionId, 'true');
    loadPlayoffs();
}

export function initializePlayoffBracket(teams = Store.globalTeams, matches = Store.globalMatches) {
    const sortedTeams = calculateStandings(teams, matches);
    const totalTeams = sortedTeams.length;

    // Format 1: TOP 6 (Standard Official MPL)
    if (totalTeams >= 6) {
        const top6 = sortedTeams.slice(0, 6);
        return {
            format: "top6",
            rounds: [
                {
                    name: "Play-ins",
                    matches: [
                        { id: "p1", teamA: top6[2], teamB: top6[5], scoreA: "", scoreB: "", winner: null, nextMatch: "p3", slot: "B" },
                        { id: "p2", teamA: top6[3], teamB: top6[4], scoreA: "", scoreB: "", winner: null, nextMatch: "p4", slot: "B" }
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

    // Format 2: TOP 4
    const top4 = sortedTeams.slice(0, 4);
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

export function updatePlayoffScore(matchId, slot, value) {
    let playoffData = null;
    try {
        playoffData = JSON.parse(localStorage.getItem('mpl_playoffs_' + Store.activeSessionId));
    } catch (_) {}

    if (!playoffData || !playoffData.rounds) return;

    let targetMatch = null;
    playoffData.rounds.forEach(round => {
        const m = round.matches.find(x => x.id === matchId);
        if (m) targetMatch = m;
    });

    if (!targetMatch) return;

    if (slot === 'A') targetMatch.scoreA = value;
    else targetMatch.scoreB = value;

    const isFinal = matchId === "p7" || matchId === "p8" || matchId === "s3";
    const validation = validatePlayoffScore(targetMatch.scoreA, targetMatch.scoreB, isFinal);

    if (!validation.valid) {
        customAlert(validation.error);
        targetMatch.winner = null;
    } else if (validation.isComplete) {
        targetMatch.winner = validation.winner === 'A' ? targetMatch.teamA : targetMatch.teamB;
        const loserTeam = validation.winner === 'A' ? targetMatch.teamB : targetMatch.teamA;

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

        if (targetMatch.loserNextMatch) {
            let nextLM = null;
            playoffData.rounds.forEach(round => {
                const m = round.matches.find(x => x.id === targetMatch.loserNextMatch);
                if (m) nextLM = m;
            });

            if (nextLM) {
                if (targetMatch.loserSlot === "A") nextLM.teamA = loserTeam;
                else nextLM.teamB = loserTeam;
            }
        }
    } else {
        targetMatch.winner = null;
    }

    localStorage.setItem('mpl_playoffs_' + Store.activeSessionId, JSON.stringify(playoffData));
    renderPlayoffBracket(playoffData);
}
