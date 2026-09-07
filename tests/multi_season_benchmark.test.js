import { describe, it, expect } from 'vitest';
import { calculateStandings } from '../js/rules/standings.js';
import { initializePlayoffBracket } from '../js/modules/playoffs.js';

describe('Multi-Season Benchmark: 5 Musim MPL Indonesia (S13 - S17)', () => {

    // ==========================================
    // MUSIM 1: MPL ID Season 13 (Awal 2024)
    // ==========================================
    describe('Musim 1: MPL ID Season 13', () => {
        const season13Teams = [
            { id: 'btr', tag: 'BTR', team_name: 'Bigetron Alpha', match_win: 13, match_lose: 3, game_win: 28, game_lose: 9 },
            { id: 'onic', tag: 'ONIC', team_name: 'Fnatic ONIC', match_win: 11, match_lose: 5, game_win: 25, game_lose: 16 },
            { id: 'geek', tag: 'GEEK', team_name: 'Geek Fam ID', match_win: 10, match_lose: 6, game_win: 22, game_lose: 20 },
            { id: 'tlid', tag: 'AURA', team_name: 'Liquid AURA', match_win: 8, match_lose: 8, game_win: 21, game_lose: 18 },
            { id: 'evos', tag: 'EVOS', team_name: 'EVOS Glory', match_win: 8, match_lose: 8, game_win: 20, game_lose: 23 },
            { id: 'rrq', tag: 'RRQ', team_name: 'RRQ Hoshi', match_win: 7, match_lose: 9, game_win: 18, game_lose: 22 },
            { id: 'rbl', tag: 'RBL', team_name: 'Rebellion Esports', match_win: 6, match_lose: 10, game_win: 17, game_lose: 24 },
            { id: 'ae', tag: 'AE', team_name: 'Alter Ego', match_win: 5, match_lose: 11, game_win: 17, game_lose: 24 },
            { id: 'dewa', tag: 'DEWA', team_name: 'Dewa United', match_win: 4, match_lose: 12, game_win: 14, game_lose: 26 }
        ];

        it('memecahkan tie match 8-8 antara Liquid AURA (+3) vs EVOS Glory (-3)', () => {
            const standings = calculateStandings(season13Teams, []);
            expect(standings[3].tag).toBe('AURA'); // Seed 4
            expect(standings[4].tag).toBe('EVOS'); // Seed 5
            expect(standings[3].points).toBe(3);
            expect(standings[4].points).toBe(-3);
        });

        it('mengalokasikan BTR dan ONIC ke Upper Semifinals S13', () => {
            const standings = calculateStandings(season13Teams, []);
            const bracket = initializePlayoffBracket(standings, []);
            const upperSemis = bracket.rounds.find(r => r.name === 'Upper Semifinals');
            expect(upperSemis.matches[0].teamA.tag).toBe('BTR');
            expect(upperSemis.matches[1].teamA.tag).toBe('ONIC');
        });
    });

    // ==========================================
    // MUSIM 2: MPL ID Season 14 (Akhir 2024)
    // ==========================================
    describe('Musim 2: MPL ID Season 14', () => {
        const season14Teams = [
            { id: 'rrq', tag: 'RRQ', team_name: 'RRQ Hoshi', match_win: 13, match_lose: 3, game_win: 28, game_lose: 11 },
            { id: 'tlid', tag: 'TLID', team_name: 'Team Liquid ID', match_win: 11, match_lose: 5, game_win: 24, game_lose: 16 },
            { id: 'btr', tag: 'BTR', team_name: 'Bigetron Alpha', match_win: 10, match_lose: 6, game_win: 23, game_lose: 17 },
            { id: 'onic', tag: 'ONIC', team_name: 'Fnatic ONIC', match_win: 10, match_lose: 6, game_win: 22, game_lose: 17 },
            { id: 'geek', tag: 'GEEK', team_name: 'Geek Fam ID', match_win: 7, match_lose: 9, game_win: 17, game_lose: 20 },
            { id: 'ae', tag: 'AE', team_name: 'Alter Ego', match_win: 6, match_lose: 10, game_win: 16, game_lose: 22 },
            { id: 'dewa', tag: 'DEWA', team_name: 'Dewa United Esports', match_win: 5, match_lose: 11, game_win: 16, game_lose: 23 },
            { id: 'rbl', tag: 'RBL', team_name: 'Rebellion Esports', match_win: 3, match_lose: 13, game_win: 12, game_lose: 27 },
            { id: 'evos', tag: 'EVOS', team_name: 'EVOS Glory', match_win: 3, match_lose: 13, game_win: 12, game_lose: 29 }
        ];

        it('memecahkan tie 10-6 antara Bigetron Alpha (+6) vs Fnatic ONIC (+5)', () => {
            const standings = calculateStandings(season14Teams, []);
            expect(standings[2].tag).toBe('BTR');  // Seed 3
            expect(standings[3].tag).toBe('ONIC'); // Seed 4
            expect(standings[2].points).toBe(6);
            expect(standings[3].points).toBe(5);
        });

        it('menempatkan RRQ dan TLID di Upper Semifinals S14', () => {
            const standings = calculateStandings(season14Teams, []);
            const bracket = initializePlayoffBracket(standings, []);
            const upperSemis = bracket.rounds.find(r => r.name === 'Upper Semifinals');
            expect(upperSemis.matches[0].teamA.tag).toBe('RRQ');
            expect(upperSemis.matches[1].teamA.tag).toBe('TLID');
        });
    });

    // ==========================================
    // MUSIM 3: MPL ID Season 15 (Awal 2025)
    // ==========================================
    describe('Musim 3: MPL ID Season 15', () => {
        const season15Teams = [
            { id: 'onic', tag: 'ONIC', team_name: 'Fnatic ONIC', match_win: 12, match_lose: 4, game_win: 26, game_lose: 11 },
            { id: 'rrq', tag: 'RRQ', team_name: 'RRQ Hoshi', match_win: 11, match_lose: 5, game_win: 25, game_lose: 15 },
            { id: 'tlid', tag: 'TLID', team_name: 'Team Liquid ID', match_win: 10, match_lose: 6, game_win: 23, game_lose: 16 },
            { id: 'ae', tag: 'AE', team_name: 'Alter Ego', match_win: 8, match_lose: 8, game_win: 20, game_lose: 19 },
            { id: 'btr', tag: 'BTR', team_name: 'Bigetron Alpha', match_win: 8, match_lose: 8, game_win: 19, game_lose: 20 },
            { id: 'geek', tag: 'GEEK', team_name: 'Geek Fam ID', match_win: 7, match_lose: 9, game_win: 18, game_lose: 21 },
            { id: 'evos', tag: 'EVOS', team_name: 'EVOS Glory', match_win: 6, match_lose: 10, game_win: 16, game_lose: 23 },
            { id: 'dewa', tag: 'DEWA', team_name: 'Dewa United', match_win: 6, match_lose: 10, game_win: 15, game_lose: 24 },
            { id: 'navi', tag: 'NAVI', team_name: 'NAVI', match_win: 4, match_lose: 12, game_win: 12, game_lose: 25 }
        ];

        it('memecahkan tie 8-8 antara Alter Ego (+1) vs Bigetron Alpha (-1)', () => {
            const standings = calculateStandings(season15Teams, []);
            expect(standings[3].tag).toBe('AE');  // Seed 4
            expect(standings[4].tag).toBe('BTR'); // Seed 5
            expect(standings[3].points).toBe(1);
            expect(standings[4].points).toBe(-1);
        });

        it('memecahkan tie eliminasi 6-10 antara EVOS Glory (-7) vs Dewa United (-9)', () => {
            const standings = calculateStandings(season15Teams, []);
            expect(standings[6].tag).toBe('EVOS'); // Pos 7
            expect(standings[7].tag).toBe('DEWA'); // Pos 8
        });
    });

    // ==========================================
    // MUSIM 4: MPL ID Season 16 (Akhir 2025)
    // ==========================================
    describe('Musim 4: MPL ID Season 16', () => {
        const season16Teams = [
            { id: 'tlid', tag: 'TLID', team_name: 'Team Liquid ID', match_win: 13, match_lose: 3, game_win: 28, game_lose: 10 },
            { id: 'btr', tag: 'BTR', team_name: 'Bigetron by Vitality', match_win: 11, match_lose: 5, game_win: 24, game_lose: 15 },
            { id: 'onic', tag: 'ONIC', team_name: 'Fnatic ONIC', match_win: 9, match_lose: 7, game_win: 22, game_lose: 18 },
            { id: 'dewa', tag: 'DEWA', team_name: 'Dewa United Esports', match_win: 9, match_lose: 7, game_win: 21, game_lose: 18 },
            { id: 'rrq', tag: 'RRQ', team_name: 'RRQ Hoshi', match_win: 9, match_lose: 7, game_win: 20, game_lose: 19 },
            { id: 'geek', tag: 'GEEK', team_name: 'Geek Fam ID', match_win: 7, match_lose: 9, game_win: 17, game_lose: 22 },
            { id: 'ae', tag: 'AE', team_name: 'Alter Ego', match_win: 6, match_lose: 10, game_win: 16, game_lose: 23 },
            { id: 'evos', tag: 'EVOS', team_name: 'EVOS Glory', match_win: 5, match_lose: 11, game_win: 15, game_lose: 24 },
            { id: 'navi', tag: 'NAVI', team_name: 'NAVI', match_win: 3, match_lose: 13, game_win: 11, game_lose: 27 }
        ];

        it('memecahkan 3-way tie 9-7 (ONIC +4, DEWA +3, RRQ +1) dengan akurat', () => {
            const standings = calculateStandings(season16Teams, []);
            expect(standings[2].tag).toBe('ONIC'); // Seed 3 (+4)
            expect(standings[3].tag).toBe('DEWA'); // Seed 4 (+3)
            expect(standings[4].tag).toBe('RRQ');  // Seed 5 (+1)
        });
    });

    // ==========================================
    // MUSIM 5: MPL ID Season 17 (Awal 2026)
    // ==========================================
    describe('Musim 5: MPL ID Season 17', () => {
        const season17Teams = [
            { id: 't1', tag: 'ONIC', team_name: 'FNATIC ONIC', match_win: 12, match_lose: 3, game_win: 26, game_lose: 7 },
            { id: 't2', tag: 'TLID', team_name: 'Team Liquid ID', match_win: 10, match_lose: 5, game_win: 21, game_lose: 14 },
            { id: 't3', tag: 'DEWA', team_name: 'Dewa United Esports', match_win: 9, match_lose: 7, game_win: 21, game_lose: 16 },
            { id: 't4', tag: 'BTR', team_name: 'Bigetron by Vitality', match_win: 9, match_lose: 7, game_win: 20, game_lose: 21 },
            { id: 't5', tag: 'GEEK', team_name: 'Geek Fam ID', match_win: 8, match_lose: 8, game_win: 19, game_lose: 19 },
            { id: 't6', tag: 'EVOS', team_name: 'EVOS Glory', match_win: 8, match_lose: 8, game_win: 18, game_lose: 17 },
            { id: 't7', tag: 'AE', team_name: 'Alter Ego Esports', match_win: 7, match_lose: 9, game_win: 19, game_lose: 25 },
            { id: 't8', tag: 'NAVI', team_name: 'Natus Vincere', match_win: 6, match_lose: 10, game_win: 15, game_lose: 22 },
            { id: 't9', tag: 'RRQ', team_name: 'RRQ Hoshi', match_win: 1, match_lose: 15, game_win: 6, game_lose: 30 }
        ];

        it('memecahkan tie 9-7 antara Dewa United (+5) vs Bigetron (-1)', () => {
            const standings = calculateStandings(season17Teams, []);
            expect(standings[2].tag).toBe('DEWA'); // Seed 3
            expect(standings[3].tag).toBe('BTR');  // Seed 4
        });

        it('memecahkan tie 8-8 antara EVOS Glory (+1) vs Geek Fam (0)', () => {
            const standings = calculateStandings(season17Teams, []);
            expect(standings[4].tag).toBe('EVOS'); // Seed 5 (+1)
            expect(standings[5].tag).toBe('GEEK'); // Seed 6 (0)
        });
    });

    // ==========================================
    // VALIDASI INVARIAN 5 MUSIM
    // ==========================================
    describe('Konsistensi Invarian Regulasi Across 5 Seasons', () => {
        it('memastikan di setiap musim tepat 6 tim lolos Playoff dan 3 tim tereliminasi', () => {
            const seasons = [
                // Array of 9 teams per season
                [13, 11, 10, 8, 8, 7, 6, 5, 4],
                [13, 11, 10, 10, 7, 6, 5, 3, 3],
                [12, 11, 10, 8, 8, 7, 6, 6, 4],
                [13, 11, 9, 9, 9, 7, 6, 5, 3],
                [12, 10, 9, 9, 8, 8, 7, 6, 1]
            ];

            seasons.forEach((seasonWins, sIdx) => {
                const teams = seasonWins.map((wins, i) => ({
                    id: `s${sIdx}_t${i}`,
                    tag: `T${i}`,
                    match_win: wins,
                    points: (wins * 2) - 10
                }));

                const standings = calculateStandings(teams, []);
                expect(standings.length).toBe(9);

                // Top 6 harus selalu memiliki match_win >= tim di bawahnya
                for (let j = 0; j < 8; j++) {
                    expect(standings[j].match_win).toBeGreaterThanOrEqual(standings[j + 1].match_win);
                }

                // Playoff bracket verification
                const bracket = initializePlayoffBracket(standings, []);
                expect(bracket.format).toBe('top6');
                expect(bracket.rounds.length).toBe(4);
            });
        });
    });
});
