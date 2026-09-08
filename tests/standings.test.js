import { describe, it, expect } from 'vitest';
import { 
    calculateStandings, 
    getHeadToHeadRecord,
    getMiniLeagueH2H,
    recalculateTeamStatsFromMatches 
} from '../js/rules/standings.js';

describe('MPL Standings & Tie-Breaker Engine', () => {
    const mockTeams = [
        { id: 't1', tag: 'RRQ', team_name: 'RRQ Hoshi', match_win: 5, match_lose: 2, game_win: 12, game_lose: 6 },
        { id: 't2', tag: 'ONIC', team_name: 'FNATIC ONIC', match_win: 5, match_lose: 2, game_win: 12, game_lose: 6 },
        { id: 't3', tag: 'EVOS', team_name: 'EVOS Glory', match_win: 4, match_lose: 3, game_win: 10, game_lose: 8 },
        { id: 't4', tag: 'BTR', team_name: 'Bigetron Alpha', match_win: 3, match_lose: 4, game_win: 8, game_lose: 9 }
    ];

    it('ranks teams primarily by Match Wins and Net Game Difference', () => {
        const standings = calculateStandings(mockTeams, []);
        expect(standings[2].tag).toBe('EVOS');
        expect(standings[3].tag).toBe('BTR');
    });

    it('resolves ties using Head-to-Head (H2H) match results when teams have identical records', () => {
        // RRQ and ONIC have same match_win (5) and points (12-6 = +6).
        // If ONIC defeated RRQ 2-1 in their head-to-head match:
        const matches = [
            { id: 'm1', team_a_id: 't2', team_b_id: 't1', score_a: 2, score_b: 1, status: 'COMPLETED' }
        ];

        const h2h = getHeadToHeadRecord('t2', 't1', matches);
        expect(h2h.matchesA).toBe(1);
        expect(h2h.matchesB).toBe(0);
        expect(h2h.diffMatches).toBe(1);

        const standings = calculateStandings(mockTeams, matches);
        expect(standings[0].tag).toBe('ONIC');
        expect(standings[1].tag).toBe('RRQ');
        expect(standings[0].tieBreakerNote).toContain('H2H Match');
    });

    it('resolves ties by H2H Game Difference if H2H match wins are equal (split 1-1 in double round robin)', () => {
        // Match 1: ONIC 2 - 1 RRQ
        // Match 2: RRQ 2 - 0 ONIC
        // RRQ has +1 net game difference over ONIC in H2H (3-2 in games)
        const matches = [
            { id: 'm1', team_a_id: 't2', team_b_id: 't1', score_a: 2, score_b: 1, status: 'COMPLETED' },
            { id: 'm2', team_a_id: 't1', team_b_id: 't2', score_a: 2, score_b: 0, status: 'COMPLETED' }
        ];

        const standings = calculateStandings(mockTeams, matches);
        expect(standings[0].tag).toBe('RRQ');
        expect(standings[1].tag).toBe('ONIC');
    });

    it('calculates mini-league H2H across three tied teams', () => {
        const matches = [
            { team_a_id: 't1', team_b_id: 't2', score_a: 2, score_b: 0, status: 'COMPLETED' },
            { team_a_id: 't2', team_b_id: 't3', score_a: 2, score_b: 1, status: 'COMPLETED' },
            { team_a_id: 't3', team_b_id: 't1', score_a: 2, score_b: 0, status: 'COMPLETED' }
        ];
        const mini = getMiniLeagueH2H('t1', ['t1', 't2', 't3'], matches);
        expect(mini.matchDiff).toBe(0);
        expect(mini.gameDiff).toBe(0);
        expect(mini.gameWins).toBe(2);
    });

    it('uses mini-league H2H before total game wins for three-way ties', () => {
        const teams = [
            { id: 't1', tag: 'AAA', match_win: 3, match_lose: 2, game_win: 10, game_lose: 5 },
            { id: 't2', tag: 'BBB', match_win: 3, match_lose: 2, game_win: 9, game_lose: 6 },
            { id: 't3', tag: 'CCC', match_win: 3, match_lose: 2, game_win: 8, game_lose: 7 }
        ];
        const matches = [
            { team_a_id: 't1', team_b_id: 't2', score_a: 2, score_b: 0, status: 'COMPLETED' },
            { team_a_id: 't2', team_b_id: 't3', score_a: 2, score_b: 0, status: 'COMPLETED' },
            { team_a_id: 't3', team_b_id: 't1', score_a: 2, score_b: 1, status: 'COMPLETED' }
        ];
        const standings = calculateStandings(teams, matches);
        expect(standings.map(team => team.id)).toEqual(['t1', 't2', 't3']);
    });

    it('correctly recalculates team stats from scratch given raw match results', () => {
        const baseTeams = [
            { id: 't1', tag: 'RRQ', team_name: 'RRQ Hoshi' },
            { id: 't2', tag: 'ONIC', team_name: 'FNATIC ONIC' }
        ];
        const matches = [
            { id: 'm1', team_a_id: 't1', team_b_id: 't2', score_a: 2, score_b: 1, status: 'COMPLETED' },
            { id: 'm2', team_a_id: 't2', team_b_id: 't1', score_a: 2, score_b: 0, status: 'COMPLETED' },
            { id: 'm3', team_a_id: 't1', team_b_id: 't2', score_a: '', score_b: '', status: 'SCHEDULED' }
        ];

        const recomputed = recalculateTeamStatsFromMatches(baseTeams, matches);
        const rrq = recomputed.find(t => t.id === 't1');
        const onic = recomputed.find(t => t.id === 't2');

        expect(rrq.match_played).toBe(2);
        expect(rrq.match_win).toBe(1);
        expect(rrq.match_lose).toBe(1);
        expect(rrq.game_win).toBe(2);
        expect(rrq.game_lose).toBe(3);
        expect(rrq.points).toBe(-1);

        expect(onic.match_played).toBe(2);
        expect(onic.match_win).toBe(1);
        expect(onic.match_lose).toBe(1);
        expect(onic.game_win).toBe(3);
        expect(onic.game_lose).toBe(2);
        expect(onic.points).toBe(1);
    });

    it('accurately computes team current win/loss streaks', () => {
        const matches = [
            { id: 'm1', week: 1, day: 1, team_a_id: 't1', team_b_id: 't2', score_a: 2, score_b: 0, status: 'COMPLETED' },
            { id: 'm2', week: 1, day: 2, team_a_id: 't1', team_b_id: 't3', score_a: 2, score_b: 1, status: 'COMPLETED' },
            { id: 'm3', week: 2, day: 1, team_a_id: 't1', team_b_id: 't4', score_a: 2, score_b: 0, status: 'COMPLETED' }
        ];

        const standings = calculateStandings(mockTeams, matches);
        const rrq = standings.find(t => t.id === 't1');
        expect(rrq.streak.type).toBe('W');
        expect(rrq.streak.count).toBe(3);
        expect(rrq.streak.label).toBe('3W');
    });
});
