/**
 * Magic Number & Tournament Clinch Engine for MPL
 * Computes mathematical qualification, Upper Bracket locks, and elimination thresholds.
 */

import { sortStandingsWithMiniLeague } from './standings.js';

export const CLINCH_STATUS = {
    UPPER_CLINCHED: 'UPPER_CLINCHED', // Locked Top 2 (Upper Semifinals Bye)
    PLAYOFF_CLINCHED: 'PLAYOFF_CLINCHED', // Locked Top 6 (Playoff Qualified)
    IN_CONTENTION: 'IN_CONTENTION', // In the fight with Magic Number
    ELIMINATED: 'ELIMINATED' // Mathematically unable to reach Top 6
};

/**
 * Computes clinch and magic number status for each team based on current standings.
 * In official MPL ID: 9 teams, 16 matches per team, Top 2 Upper, Top 6 Playoff, Bottom 3 Out.
 */
export function calculateClinchStatus(standings = [], totalSeasonMatchesPerTeam = 16, matches = []) {
    if (!standings || standings.length === 0) return [];

    const totalTeams = standings.length;
    const maxMatches = Number.isFinite(Number(totalSeasonMatchesPerTeam))
        ? Math.max(0, Number(totalSeasonMatchesPerTeam))
        : 16;

    // Enforce a deterministic standings order at this boundary. Clinch cutoffs
    // must never depend on an arbitrary caller array order.
    const orderedStandings = sortStandingsWithMiniLeague(standings, matches);

    // Calculate max potential wins for every team
    const teamsWithPotential = orderedStandings.map(t => {
        const played = parseInt(t.match_played, 10) || 0;
        const wins = parseInt(t.match_win, 10) || 0;
        const remaining = Math.max(0, maxMatches - played);
        return {
            ...t,
            currentWins: wins,
            remainingMatches: remaining,
            maxPotentialWins: wins + remaining
        };
    });

    // Baseline reference teams for thresholds
    // Playoff cutoff is 7th team (index 6). If fewer than 7 teams, all qualify.
    const cutoff7thIndex = Math.min(6, totalTeams - 1);
    const teamAt7th = teamsWithPotential[cutoff7thIndex];

    // Upper bracket cutoff is 3rd team (index 2).
    const cutoff3rdIndex = Math.min(2, totalTeams - 1);
    const teamAt3rd = teamsWithPotential[cutoff3rdIndex];

    // 6th team for elimination threshold
    const cutoff6thIndex = Math.min(5, totalTeams - 1);
    const teamAt6th = teamsWithPotential[cutoff6thIndex];

    return teamsWithPotential.map((t, idx) => {
        // 1. Check Upper Bracket Clinch (Top 2)
        if (idx < 2 && teamAt3rd && t.id !== teamAt3rd.id) {
            if (t.currentWins > teamAt3rd.maxPotentialWins) {
                return {
                    ...t,
                    clinch: {
                        status: CLINCH_STATUS.UPPER_CLINCHED,
                        magicNumber: 0,
                        badgeLabel: 'Upper Bye',
                        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }
                };
            }
        }

        // 2. Check Playoff Clinch (Top 6)
        if (teamAt7th && t.id !== teamAt7th.id && t.currentWins > teamAt7th.maxPotentialWins) {
            return {
                ...t,
                clinch: {
                    status: CLINCH_STATUS.PLAYOFF_CLINCHED,
                    magicNumber: 0,
                    badgeLabel: 'Lolos Playoff',
                    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }
            };
        }

        // 3. Check Mathematical Elimination
        if (teamAt6th && t.id !== teamAt6th.id && t.maxPotentialWins < teamAt6th.currentWins) {
            return {
                ...t,
                clinch: {
                    status: CLINCH_STATUS.ELIMINATED,
                    magicNumber: null,
                    badgeLabel: 'Tereliminasi',
                    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }
            };
        }

        // 4. Calculate Magic Number to clinch Top 6
        let magicNumber = null;
        if (teamAt7th) {
            const target = teamAt7th.maxPotentialWins + 1;
            const needed = target - t.currentWins;
            magicNumber = Math.max(1, needed);
        }

        return {
            ...t,
            clinch: {
                status: CLINCH_STATUS.IN_CONTENTION,
                magicNumber,
                badgeLabel: magicNumber != null ? `Magic: ${magicNumber}` : 'In Contention',
                badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            }
        };
    });
}
