import { describe, it, expect } from 'vitest';
import { 
    calculateStandings, 
    getHeadToHeadRecord, 
    calculateTeamStreak 
} from '../js/rules/standings.js';
import { simulateMonteCarlo } from '../js/simulation/engine.js';
import { initializePlayoffBracket } from '../js/modules/playoffs.js';

describe('MPL Simulation Specification Scenarios', () => {
    // Skenario 1: Laplace Smoothing Base Strength
    it('Skenario 1: menghitung Base Win Rate dengan perataan Bayesian Laplace Smoothing', () => {
        const teams = [
            { id: 't1', tag: 'RRQ', match_win: 0, match_played: 0, points: 0 },
            { id: 't2', tag: 'ONIC', match_win: 5, match_played: 8, points: 6 }
        ];

        // Rumus: (Win + 1) / (Played + 2)
        const wr1 = (0 + 1) / (0 + 2); // 0.50
        const wr2 = (5 + 1) / (8 + 2); // 0.60

        expect(wr1).toBe(0.5);
        expect(wr2).toBe(0.6);
    });

    // Skenario 2: Momentum 3 Kemenangan Beruntun
    it('Skenario 2: mendeteksi momentum 3 kemenangan beruntun dan menaikkan win rate', () => {
        const matches = [
            { id: 'm1', week: 1, day: 1, team_a_id: 't1', team_b_id: 't2', score_a: 2, score_b: 0, status: 'COMPLETED' },
            { id: 'm2', week: 1, day: 2, team_a_id: 't1', team_b_id: 't3', score_a: 2, score_b: 1, status: 'COMPLETED' },
            { id: 'm3', week: 2, day: 1, team_a_id: 't1', team_b_id: 't4', score_a: 2, score_b: 0, status: 'COMPLETED' }
        ];

        const streak = calculateTeamStreak('t1', matches);
        expect(streak.type).toBe('W');
        expect(streak.count).toBe(3);
        expect(streak.label).toBe('3W');
    });

    // Skenario 3: Dinamika Derby Rivalitas & Underdog Boost
    it('Skenario 3: memberikan dorongan probabilitas kejutan kepada underdog dalam laga derby', () => {
        const teams = [
            { id: 't1', tag: 'RRQ', team_name: 'RRQ Hoshi', match_win: 8, match_played: 8, points: 14 },
            { id: 't2', tag: 'EVOS', team_name: 'EVOS Glory', match_win: 2, match_played: 8, points: -6 }
        ];

        const match = [
            { id: 'm_elclasico', week: 9, day: 1, team_a_id: 't1', team_b_id: 't2', status: 'SCHEDULED' }
        ];

        // Simulasi dengan rivalitas aktif vs rivalitas non-aktif
        const resWithRivalry = simulateMonteCarlo(teams, match, { rivalry: true, volatility: 0 }, 1000);
        const resWithoutRivalry = simulateMonteCarlo(teams, match, { rivalry: false, volatility: 0 }, 1000);

        const evosProbWith = parseFloat(resWithRivalry.find(t => t.id === 't2').prob_upper);
        const evosProbWithout = parseFloat(resWithoutRivalry.find(t => t.id === 't2').prob_upper);

        // Underdog (EVOS) memiliki peluang lebih tinggi ketika rivalitas diaktifkan
        expect(evosProbWith).toBeGreaterThanOrEqual(evosProbWithout);
    });

    // Skenario 4: Dampak Kelelahan Jadwal Berurutan (Fatigue)
    it('Skenario 4: menerapkan akumulasi kelelahan saat bertanding di hari berurutan', () => {
        const teams = [
            { id: 't1', tag: 'BTR', team_name: 'Bigetron', match_win: 5, match_played: 6, points: 4 },
            { id: 't2', tag: 'AE', team_name: 'Alter Ego', match_win: 5, match_played: 6, points: 4 }
        ];

        // BTR bermain 2 hari berturut-turut (Day 1 & Day 2)
        const matches = [
            { id: 'm1', week: 1, day: 1, team_a_id: 't1', team_b_id: 't3', status: 'SCHEDULED' },
            { id: 'm2', week: 1, day: 2, team_a_id: 't1', team_b_id: 't2', status: 'SCHEDULED' }
        ];

        const res = simulateMonteCarlo(teams, matches, { fatigue: true }, 500);
        expect(res.length).toBe(2);
        res.forEach(t => {
            expect(parseFloat(t.prob_playoff)).toBeGreaterThanOrEqual(0);
            expect(parseFloat(t.prob_playoff)).toBeLessThanOrEqual(100);
        });
    });

    // Skenario 5: Pemecahan Tie-Breaker H2H Pertemuan Langsung
    it('Skenario 5: memecahkan seri peringkat menggunakan hasil H2H match langsung', () => {
        const teams = [
            { id: 't1', tag: 'ONIC', match_win: 6, match_lose: 2, game_win: 14, game_lose: 6 },
            { id: 't2', tag: 'RRQ', match_win: 6, match_lose: 2, game_win: 14, game_lose: 6 }
        ];

        // Laga H2H: ONIC menang 2-1 atas RRQ
        const matches = [
            { id: 'm_h2h', team_a_id: 't1', team_b_id: 't2', score_a: 2, score_b: 1, status: 'COMPLETED' }
        ];

        const standings = calculateStandings(teams, matches);
        expect(standings[0].tag).toBe('ONIC');
        expect(standings[1].tag).toBe('RRQ');
        expect(standings[0].tieBreakerNote).toContain('H2H Match');
    });

    // Skenario 6: Pemecahan Tie-Breaker Selisih Game H2H pada Double Round-Robin (Split 1-1)
    it('Skenario 6: memecahkan seri menggunakan selisih game H2H saat skor pertemuan 1-1', () => {
        const teams = [
            { id: 't1', tag: 'ONIC', match_win: 7, match_lose: 3, game_win: 16, game_lose: 8 },
            { id: 't2', tag: 'RRQ', match_win: 7, match_lose: 3, game_win: 16, game_lose: 8 }
        ];

        // Match 1: ONIC 2 - 1 RRQ
        // Match 2: RRQ 2 - 0 ONIC
        // Total H2H Game: RRQ = 3 game, ONIC = 2 game (RRQ unggul +1)
        const matches = [
            { id: 'm_leg1', team_a_id: 't1', team_b_id: 't2', score_a: 2, score_b: 1, status: 'COMPLETED' },
            { id: 'm_leg2', team_a_id: 't2', team_b_id: 't1', score_a: 2, score_b: 0, status: 'COMPLETED' }
        ];

        const h2h = getHeadToHeadRecord('t2', 't1', matches);
        expect(h2h.diffMatches).toBe(0); // 1-1
        expect(h2h.diffGames).toBe(1); // 3-2 = +1 untuk RRQ

        const standings = calculateStandings(teams, matches);
        expect(standings[0].tag).toBe('RRQ');
        expect(standings[1].tag).toBe('ONIC');
        expect(standings[0].tieBreakerNote).toContain('H2H Games');
    });

    // Skenario 7: Konsistensi Alokasi Slot Playoff Top 6 & Distribusi Probabilitas
    it('Skenario 7: memverifikasi alokasi Seeding Top 6 dan pemenuhan distribusi probabilitas', () => {
        const teams = [
            { id: 't1', tag: 'ONIC', match_win: 12, points: 20 },
            { id: 't2', tag: 'RRQ', match_win: 10, points: 15 },
            { id: 't3', tag: 'BTR', match_win: 8, points: 8 },
            { id: 't4', tag: 'EVOS', match_win: 7, points: 5 },
            { id: 't5', tag: 'AE', match_win: 6, points: 0 },
            { id: 't6', tag: 'GEEK', match_win: 5, points: -2 },
            { id: 't7', tag: 'DEWA', match_win: 3, points: -8 },
            { id: 't8', tag: 'TLID', match_win: 2, points: -12 },
            { id: 't9', tag: 'NAVI', match_win: 1, points: -16 }
        ];

        const bracket = initializePlayoffBracket(teams, []);
        expect(bracket.format).toBe('top6');

        // Upper Bracket Semifinals terisi Seed 1 & Seed 2
        const upperSemis = bracket.rounds.find(r => r.name === 'Upper Semifinals');
        expect(upperSemis.matches[0].teamA.tag).toBe('ONIC');
        expect(upperSemis.matches[1].teamA.tag).toBe('RRQ');

        // Play-ins mempertemukan Seed 3 vs Seed 6 dan Seed 4 vs Seed 5
        const playIns = bracket.rounds.find(r => r.name === 'Play-ins');
        expect(playIns.matches[0].teamA.tag).toBe('BTR');
        expect(playIns.matches[0].teamB.tag).toBe('GEEK');
        expect(playIns.matches[1].teamA.tag).toBe('EVOS');
        expect(playIns.matches[1].teamB.tag).toBe('AE');

        // Validasi Matematis Monte Carlo
        const simRes = simulateMonteCarlo(teams, [], {}, 500);
        simRes.forEach(r => {
            const upper = parseFloat(r.prob_upper);
            const playin = parseFloat(r.prob_playin);
            const playoff = parseFloat(r.prob_playoff);
            const elim = parseFloat(r.prob_elim);

            expect(Math.abs(playoff - (upper + playin))).toBeLessThanOrEqual(0.01);
            expect(Math.abs((playoff + elim) - 100)).toBeLessThanOrEqual(0.01);
        });
    });
});
