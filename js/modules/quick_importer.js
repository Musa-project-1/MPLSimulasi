/**
 * Fast Match & Score Importer (Quick Batch Text Parser)
 * Allows admins to quickly copy-paste match results from media/Liquipedia
 * and update the entire season schedule & live scores in one click.
 */

import * as Store from '../store.js';
import { showToast, showLoading, customAlert } from '../ui/core.js';
import { isSupabaseConfigured, syncSessionToSupabase } from './supabase.js';
import { validateBo3Score } from '../rules/validators.js';
import { getMasterTeams } from './teams_db.js';

// Official Schedule & Results Data for MPL ID Season 18 (Week 1 to Week 4)
export const OFFICIAL_S18_WEEK_1_TO_4_TEXT = `
Week 1
EVOS 2-0 RRQ
NAVI 0-2 AE
TLID 2-1 GEEK
DEWA 1-2 RRQ
EVOS 1-2 NAVI
TLID 2-0 DEWA
BTR 2-1 GEEK
AE 0-2 ONIC

Week 2
TLID 2-0 NAVI
ONIC 2-1 EVOS
BTR 2-0 AE
DEWA 1-2 AE
ONIC 2-0 BTR
GEEK 2-1 EVOS

Week 3
BTR 2-0 NAVI
DEWA 2-1 GEEK
TLID 1-2 ONIC
NAVI 0-2 ONIC
GEEK 1-2 RRQ
TLID 2-0 AE

Week 4
NAVI 1-2 DEWA
TLID 2-0 RRQ
DEWA 0-2 ONIC
`;

const TAG_ALIASES = {
    "ONIC": "ONIC",
    "FNATIC ONIC": "ONIC",
    "RRQ": "RRQ",
    "RRQ HOSHI": "RRQ",
    "BTR": "BTR",
    "BIGETRON": "BTR",
    "BIGETRON BY VITALITY": "BTR",
    "TEAM VITALITY": "BTR",
    "VIT": "BTR",
    "TLID": "TLID",
    "TEAM LIQUID ID": "TLID",
    "LIQUID": "TLID",
    "EVOS": "EVOS",
    "EVOS GLORY": "EVOS",
    "AE": "AE",
    "ALTER EGO": "AE",
    "DEWA": "DEWA",
    "DEWA UNITED": "DEWA",
    "GEEK": "GEEK",
    "GEEK FAM": "GEEK",
    "GEEK FAM ID": "GEEK",
    "NAVI": "NAVI",
    "NATUS VINCERE": "NAVI"
};

export function normalizeTeamTag(input) {
    if (!input) return null;
    const clean = input.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim();

    // 1. Dynamic Check against Database Master Teams
    try {
        const master = getMasterTeams();
        if (Array.isArray(master)) {
            for (const t of master) {
                const tag = (t.tag || '').toUpperCase();
                const name = (t.team_name || '').toUpperCase();
                if (clean === tag || clean === name) return tag;
            }
            for (const t of master) {
                const tag = (t.tag || '').toUpperCase();
                const name = (t.team_name || '').toUpperCase();
                if (clean.includes(tag) || (name && clean.includes(name))) return tag;
            }
        }
    } catch (_) {}

    // 2. Known Static Aliases
    if (TAG_ALIASES[clean]) return TAG_ALIASES[clean];

    for (const key in TAG_ALIASES) {
        if (clean.includes(key)) return TAG_ALIASES[key];
    }
    return clean.slice(0, 6);
}

/**
 * Parses freeform text pasted by admin into structured match entries.
 */
export function parseMatchText(rawText) {
    if (!rawText || typeof rawText !== 'string') return [];

    const lines = rawText.split('\n');
    const results = [];
    let currentWeek = 1;
    let currentDay = 1;

    // Regex for lines like: EVOS 2-0 RRQ or W1D1 BTR 2 - 1 AE or ONIC vs EVOS
    const scoreLineRegex = /([A-Za-z0-9 ]+?)\s*(?:vs\.?|VS)?\s*(?:(\d+)\s*[-:]\s*(\d+))?\s+([A-Za-z0-9 ]+)/;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Check week marker e.g. "Week 1", "W1", "Minggu 2" (only if standalone word or at start)
        const weekMatch = trimmed.match(/^(?:week|minggu|w)\s*(\d+)\b/i);
        if (weekMatch) {
            currentWeek = parseInt(weekMatch[1], 10);
            currentDay = 1;
            return;
        }

        // Check day marker e.g. "Day 1", "Hari 2", "D1" (only if standalone word or at start)
        const dayMatch = trimmed.match(/^(?:day|hari|d)\s*(\d+)\b/i);
        if (dayMatch) {
            currentDay = parseInt(dayMatch[1], 10);
            return;
        }

        // Check Indonesian day names
        if (/^jumat\b/i.test(trimmed)) { currentDay = 1; return; }
        if (/^sabtu\b/i.test(trimmed)) { currentDay = 2; return; }
        if (/^minggu\b/i.test(trimmed) && !/^minggu\s*\d/i.test(trimmed)) { currentDay = 3; return; }

        // Try matching score line: Team A [scoreA - scoreB] Team B
        // e.g. "EVOS 2-0 RRQ" or "BTR (2) - (1) GEEK" or "ONIC [2] : [0] RRQ"
        const matchScores = trimmed.match(/([A-Za-z\s]+?)\s+[\(\[]?(\d)[\)\]]?\s*[-:]\s*[\(\[]?(\d)[\)\]]?\s+([A-Za-z\s]+)/);
        if (matchScores) {
            const teamATag = normalizeTeamTag(matchScores[1]);
            const scoreA = parseInt(matchScores[2], 10);
            const scoreB = parseInt(matchScores[3], 10);
            const teamBTag = normalizeTeamTag(matchScores[4]);

            if (teamATag && teamBTag && teamATag !== teamBTag) {
                const val = validateBo3Score(scoreA, scoreB);
                results.push({
                    week: currentWeek,
                    day: currentDay,
                    teamA: teamATag,
                    teamB: teamBTag,
                    scoreA: val.valid ? val.scoreA : scoreA,
                    scoreB: val.valid ? val.scoreB : scoreB,
                    status: val.valid ? 'COMPLETED' : 'SCHEDULED'
                });
                return;
            }
        }

        // Fallback for scheduled matchup e.g. "ONIC vs RRQ"
        const matchVs = trimmed.match(/([A-Za-z\s]+?)\s+(?:vs\.?|VS)\s+([A-Za-z\s]+)/);
        if (matchVs) {
            const teamATag = normalizeTeamTag(matchVs[1]);
            const teamBTag = normalizeTeamTag(matchVs[2]);
            if (teamATag && teamBTag && teamATag !== teamBTag) {
                results.push({
                    week: currentWeek,
                    day: currentDay,
                    teamA: teamATag,
                    teamB: teamBTag,
                    scoreA: "",
                    scoreB: "",
                    status: 'SCHEDULED'
                });
            }
        }
    });

    return results;
}

/**
 * Applies parsed batch matches to the active session and master template.
 */
export async function applyBatchMatches(parsedMatches, sessionId = Store.activeSessionId) {
    if (!parsedMatches || parsedMatches.length === 0) {
        showToast("Tidak ada data pertandingan yang dapat diterapkan.", "warning");
        return false;
    }

    showLoading(true);
    try {
        const teams = Store.getSessionTeams(sessionId);
        const matches = Store.getSessionMatches(sessionId);

        const tagToTeam = {};
        teams.forEach(t => { tagToTeam[t.tag] = t; });

        let updatedCount = 0;

        parsedMatches.forEach(pm => {
            const tA = tagToTeam[pm.teamA];
            const tB = tagToTeam[pm.teamB];
            if (!tA || !tB) return;

            // Find matching scheduled/existing matchup in that week
            let targetMatch = matches.find(m => 
                parseInt(m.week, 10) === pm.week &&
                ((m.team_a_id === tA.id && m.team_b_id === tB.id) ||
                 (m.team_a_id === tB.id && m.team_b_id === tA.id))
            );

            // If not found, find an empty or pending slot in that week
            if (!targetMatch) {
                targetMatch = matches.find(m => 
                    parseInt(m.week, 10) === pm.week && 
                    (!m.team_a_id || !m.team_b_id || m.status === 'SCHEDULED')
                );
            }

            if (targetMatch) {
                const isSwapped = targetMatch.team_a_id === tB.id;
                targetMatch.team_a_id = isSwapped ? tB.id : tA.id;
                targetMatch.team_b_id = isSwapped ? tA.id : tB.id;
                targetMatch.score_a = isSwapped ? (pm.scoreB !== undefined ? String(pm.scoreB) : "") : (pm.scoreA !== undefined ? String(pm.scoreA) : "");
                targetMatch.score_b = isSwapped ? (pm.scoreA !== undefined ? String(pm.scoreA) : "") : (pm.scoreB !== undefined ? String(pm.scoreB) : "");
                targetMatch.status = pm.status;
                updatedCount++;
            }
        });

        // Recalculate team statistics from the new match states
        const { recalculateTeamStatsFromMatches } = await import('../rules/standings.js');
        const recomputedTeams = recalculateTeamStatsFromMatches(teams, matches);

        Store.saveSessionData(recomputedTeams, matches, sessionId);
        Store.setGlobalTeams(recomputedTeams);
        Store.setGlobalMatches(matches);

        // Broadcast to Supabase Cloud if configured
        if (isSupabaseConfigured() && sessionId) {
            await syncSessionToSupabase(sessionId).catch(e => console.warn("Cloud sync failed:", e));

            // Also broadcast official live matches snapshot for other users
            const { supabaseRequest } = await import('./supabase.js');
            await supabaseRequest('schedule_templates', 'POST', [{
                id: 'official_live_matches',
                templates_data: {
                    sessionId,
                    matches,
                    teams: recomputedTeams,
                    updated_at: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
            }], 'resolution=merge-duplicates').catch(e => console.warn("Live broadcast failed:", e));
        }

        showToast(`Berhasil memperbarui ${updatedCount} pertandingan & disinkronkan ke Cloud!`, "success");

        if (window.loadMatches) window.loadMatches();
        if (window.loadStandings) window.loadStandings();
        if (window.loadDashboard) window.loadDashboard();

        return true;
    } catch (err) {
        console.error("Apply batch matches error:", err);
        showToast("Gagal menerapkan pertandingan: " + err.message, "error");
        return false;
    } finally {
        showLoading(false);
    }
}

/**
 * Syncs the latest official live match scores published by the admin from Supabase Cloud.
 */
export async function syncLiveScoresFromCloud(sessionId = Store.activeSessionId) {
    if (!isSupabaseConfigured()) {
        showToast("Supabase Cloud belum terhubung.", "warning");
        return false;
    }

    showLoading(true);
    try {
        const { supabaseRequest } = await import('./supabase.js');
        const rows = await supabaseRequest('schedule_templates?id=eq.official_live_matches&limit=1', 'GET');
        if (!rows || !rows[0] || !rows[0].templates_data) {
            showToast("Belum ada skor resmi terbaru yang dibroadcast di Cloud.", "info");
            return false;
        }

        const cloudData = rows[0].templates_data;
        const localMatches = Store.getSessionMatches(sessionId);
        const localTeams = Store.getSessionTeams(sessionId);

        if (!localMatches || localMatches.length === 0) {
            showToast("Sesi aktif belum memiliki pertandingan.", "warning");
            return false;
        }

        let updatedCount = 0;
        (cloudData.matches || []).forEach(cm => {
            if (cm.status === 'COMPLETED') {
                const lm = localMatches.find(m => 
                    parseInt(m.week, 10) === parseInt(cm.week, 10) &&
                    ((m.team_a_id === cm.team_a_id && m.team_b_id === cm.team_b_id) ||
                     (m.team_a_id === cm.team_b_id && m.team_b_id === cm.team_a_id))
                );
                if (lm && lm.status !== 'COMPLETED') {
                    lm.score_a = cm.score_a;
                    lm.score_b = cm.score_b;
                    lm.status = 'COMPLETED';
                    lm.games = cm.games || [];
                    updatedCount++;
                }
            }
        });

        const { recalculateTeamStatsFromMatches } = await import('../rules/standings.js');
        const recomputedTeams = recalculateTeamStatsFromMatches(localTeams, localMatches);

        Store.saveSessionData(recomputedTeams, localMatches, sessionId);
        Store.setGlobalTeams(recomputedTeams);
        Store.setGlobalMatches(localMatches);

        showToast(`Berhasil menyinkronkan ${updatedCount} skor resmi terbaru dari Cloud!`, "success");

        if (window.loadMatches) window.loadMatches();
        if (window.loadStandings) window.loadStandings();
        if (window.loadDashboard) window.loadDashboard();

        return true;
    } catch (err) {
        console.error("Sync live scores error:", err);
        showToast("Gagal sync skor dari Cloud: " + err.message, "error");
        return false;
    } finally {
        showLoading(false);
    }
}
