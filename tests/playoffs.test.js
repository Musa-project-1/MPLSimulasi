import { describe, it, expect } from 'vitest';
import { initializePlayoffBracket } from '../js/modules/playoffs.js';

describe('MPL Playoff Bracket Engine', () => {
    const teams = [
        { id: 't1', tag: 'ONIC', match_win: 8, points: 12 },
        { id: 't2', tag: 'RRQ', match_win: 7, points: 8 },
        { id: 't3', tag: 'BTR', match_win: 6, points: 4 },
        { id: 't4', tag: 'EVOS', match_win: 5, points: 1 },
        { id: 't5', tag: 'AE', match_win: 4, points: -2 },
        { id: 't6', tag: 'GEEK', match_win: 3, points: -5 },
        { id: 't7', tag: 'DEWA', match_win: 2, points: -8 },
        { id: 't8', tag: 'TLID', match_win: 1, points: -10 }
    ];

    it('generates a standard 6-team bracket for MPL with seeds 1 & 2 in Upper Semifinals', () => {
        const bracket = initializePlayoffBracket(teams, []);
        expect(bracket.format).toBe('top6');
        expect(bracket.rounds.length).toBe(4);

        const playIns = bracket.rounds[0];
        expect(playIns.name).toBe('Play-ins');
        // Match 1: Seed 3 vs Seed 6 (BTR vs GEEK)
        expect(playIns.matches[0].teamA.tag).toBe('BTR');
        expect(playIns.matches[0].teamB.tag).toBe('GEEK');

        // Match 2: Seed 4 vs Seed 5 (EVOS vs AE)
        expect(playIns.matches[1].teamA.tag).toBe('EVOS');
        expect(playIns.matches[1].teamB.tag).toBe('AE');

        const upperSemis = bracket.rounds[1];
        expect(upperSemis.name).toBe('Upper Semifinals');
        // Upper Semis have seeds 1 and 2 waiting
        expect(upperSemis.matches[0].teamA.tag).toBe('ONIC');
        expect(upperSemis.matches[1].teamA.tag).toBe('RRQ');
    });

    it('generates a 4-team bracket when fewer than 6 teams participate', () => {
        const smallTeams = teams.slice(0, 4);
        const bracket = initializePlayoffBracket(smallTeams, []);
        expect(bracket.format).toBe('top4');
        expect(bracket.rounds.length).toBe(2);
        expect(bracket.rounds[0].matches[0].teamA.tag).toBe('ONIC');
        expect(bracket.rounds[0].matches[0].teamB.tag).toBe('EVOS');
    });
});
