import { describe, it, expect } from 'vitest';
import { simulateMonteCarlo } from '../js/simulation/engine.js';

describe('Monte Carlo Simulation Engine', () => {
    const teams = [
        { id: 't1', tag: 'ONIC', team_name: 'FNATIC ONIC', match_win: 10, match_played: 10, points: 15 },
        { id: 't2', tag: 'RRQ', team_name: 'RRQ Hoshi', match_win: 8, match_played: 10, points: 8 },
        { id: 't3', tag: 'BTR', team_name: 'Bigetron Alpha', match_win: 6, match_played: 10, points: 2 },
        { id: 't4', tag: 'EVOS', team_name: 'EVOS Glory', match_win: 5, match_played: 10, points: 0 },
        { id: 't5', tag: 'AE', team_name: 'Alter Ego', match_win: 4, match_played: 10, points: -2 },
        { id: 't6', tag: 'GEEK', team_name: 'Geek Fam', match_win: 4, match_played: 10, points: -3 },
        { id: 't7', tag: 'DEWA', team_name: 'Dewa United', match_win: 2, match_played: 10, points: -8 },
        { id: 't8', tag: 'TLID', team_name: 'Team Liquid ID', match_win: 1, match_played: 10, points: -10 }
    ];

    const scheduledMatches = [
        { id: 'sm1', week: 9, day: 1, team_a_id: 't1', team_b_id: 't8', status: 'SCHEDULED' },
        { id: 'sm2', week: 9, day: 2, team_a_id: 't2', team_b_id: 't7', status: 'SCHEDULED' }
    ];

    it('produces valid percentage outputs totaling mathematically sensible brackets', () => {
        const results = simulateMonteCarlo(teams, scheduledMatches, { volatility: 30 }, 1000);
        expect(results.length).toBe(teams.length);

        results.forEach(res => {
            expect(res).toHaveProperty('prob_upper');
            expect(res).toHaveProperty('prob_playoff');
            expect(res).toHaveProperty('prob_elim');

            const upper = parseFloat(res.prob_upper);
            const playoff = parseFloat(res.prob_playoff);
            const elim = parseFloat(res.prob_elim);

            expect(playoff).toBeGreaterThanOrEqual(upper);
            expect(upper).toBeGreaterThanOrEqual(0);
            expect(upper).toBeLessThanOrEqual(100);
            expect(elim).toBeGreaterThanOrEqual(0);
            expect(elim).toBeLessThanOrEqual(100);
        });

        // Top team with 10-0 record should have virtually 100% playoff probability
        const onic = results.find(t => t.id === 't1');
        expect(parseFloat(onic.prob_playoff)).toBeGreaterThanOrEqual(95);

        // Bottom team with 1-9 record should have low playoff probability
        const tlid = results.find(t => t.id === 't8');
        expect(parseFloat(tlid.prob_playoff)).toBeLessThan(50);
    });

    it('handles empty scheduled matches without crashing (returns current standings status)', () => {
        const results = simulateMonteCarlo(teams, [], {}, 500);
        expect(results.length).toBe(teams.length);
        const onic = results.find(t => t.id === 't1');
        expect(onic.prob_playoff).toBe('100.00%');
    });
});
