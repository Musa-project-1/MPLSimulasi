import { describe, it, expect } from 'vitest';
import { computeWhatIfScenario } from '../js/modules/sandbox.js';
import * as Store from '../js/store.js';

describe('What-If Scenario Sandbox Engine', () => {
    it('computes rank shifts and points delta for speculative match outcomes', () => {
        const testSessionId = 'sandbox_test_sess';
        const teams = [
            { id: 't1', tag: 'ONIC', team_name: 'FNATIC ONIC', match_win: 5, match_lose: 2, game_win: 11, game_lose: 5, points: 6 },
            { id: 't2', tag: 'RRQ', team_name: 'RRQ Hoshi', match_win: 5, match_lose: 2, game_win: 10, game_lose: 5, points: 5 },
            { id: 't3', tag: 'BTR', team_name: 'Bigetron', match_win: 4, match_lose: 3, game_win: 9, game_lose: 7, points: 2 }
        ];

        // Match between RRQ and BTR is scheduled
        const matches = [
            { id: 'm_spec', week: 4, day: 1, team_a_id: 't2', team_b_id: 't3', score_a: '', score_b: '', status: 'SCHEDULED' }
        ];

        Store.setActiveSessionId(testSessionId);
        Store.saveSessionData(teams, matches, testSessionId);

        // Speculate: BTR beats RRQ 2-0
        const result = computeWhatIfScenario([
            { matchId: 'm_spec', scoreA: 0, scoreB: 2 }
        ], testSessionId);

        expect(result.comparison.length).toBe(3);

        const btr = result.comparison.find(t => t.tag === 'BTR');
        expect(btr.pointsDelta).toBe(2); // Game points increased by 2
        expect(btr.rankDelta).toBeGreaterThanOrEqual(0); // Moved up or stayed top

        const rrq = result.comparison.find(t => t.tag === 'RRQ');
        expect(rrq.pointsDelta).toBe(-2); // RRQ lost 0-2, net points decreased by 2
    });
});
