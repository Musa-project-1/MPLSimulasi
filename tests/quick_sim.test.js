import { describe, it, expect } from 'vitest';
import * as Store from '../js/store.js';
import { handleMockData } from '../js/modules/schedule.js';
import { calculateStandings } from '../js/rules/standings.js';

describe('Quick Simulation & Match Operations Engine', () => {
    it('correctly updates match score, switches status to COMPLETED, and reflects in standings', () => {
        const testSessionId = 'test_sess_' + Date.now();
        Store.setActiveSessionId(testSessionId);

        const initialTeams = [
            { id: 't1', tag: 'RRQ', team_name: 'RRQ Hoshi', match_played: 0, match_win: 0, match_lose: 0, game_win: 0, game_lose: 0, points: 0 },
            { id: 't2', tag: 'ONIC', team_name: 'FNATIC ONIC', match_played: 0, match_win: 0, match_lose: 0, game_win: 0, game_lose: 0, points: 0 }
        ];

        const initialMatches = [
            { id: 'm_test_1', week: 1, day: 1, team_a_id: 't1', team_b_id: 't2', score_a: '', score_b: '', status: 'SCHEDULED' }
        ];

        Store.saveSessionData(initialTeams, initialMatches, testSessionId);

        // Update score: RRQ 2 - 0 ONIC
        const res = handleMockData('update_score', {
            match_id: 'm_test_1',
            score_a: 2,
            score_b: 0,
            status: 'COMPLETED'
        });

        expect(res).toEqual({ success: true });

        const updatedTeams = Store.getSessionTeams(testSessionId);
        const rrq = updatedTeams.find(t => t.id === 't1');
        const onic = updatedTeams.find(t => t.id === 't2');

        expect(rrq.match_played).toBe(1);
        expect(rrq.match_win).toBe(1);
        expect(rrq.game_win).toBe(2);
        expect(rrq.points).toBe(2);

        expect(onic.match_played).toBe(1);
        expect(onic.match_lose).toBe(1);
        expect(onic.game_lose).toBe(2);
        expect(onic.points).toBe(-2);

        // Verify standings order
        const standings = calculateStandings(updatedTeams, Store.getSessionMatches(testSessionId));
        expect(standings[0].tag).toBe('RRQ');
        expect(standings[1].tag).toBe('ONIC');
    });

    it('correctly reverts stats when a match is reset back to SCHEDULED', () => {
        const testSessionId = 'test_sess_reset_' + Date.now();
        Store.setActiveSessionId(testSessionId);

        const initialTeams = [
            { id: 't1', tag: 'RRQ', team_name: 'RRQ Hoshi', match_played: 0, match_win: 0, match_lose: 0, game_win: 0, game_lose: 0, points: 0 },
            { id: 't2', tag: 'ONIC', team_name: 'FNATIC ONIC', match_played: 0, match_win: 0, match_lose: 0, game_win: 0, game_lose: 0, points: 0 }
        ];

        const initialMatches = [
            { id: 'm_test_2', week: 1, day: 1, team_a_id: 't1', team_b_id: 't2', score_a: '', score_b: '', status: 'SCHEDULED' }
        ];

        Store.saveSessionData(initialTeams, initialMatches, testSessionId);

        // Score 2-1
        handleMockData('update_score', {
            match_id: 'm_test_2',
            score_a: 2,
            score_b: 1,
            status: 'COMPLETED'
        });

        // Reset
        handleMockData('update_score', {
            match_id: 'm_test_2',
            score_a: '',
            score_b: '',
            status: 'SCHEDULED'
        });

        const updatedTeams = Store.getSessionTeams(testSessionId);
        const rrq = updatedTeams.find(t => t.id === 't1');
        const onic = updatedTeams.find(t => t.id === 't2');

        expect(rrq.match_played).toBe(0);
        expect(rrq.match_win).toBe(0);
        expect(rrq.points).toBe(0);
        expect(onic.match_played).toBe(0);
        expect(onic.match_lose).toBe(0);
        expect(onic.points).toBe(0);
    });
});
