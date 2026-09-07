import { describe, it, expect } from 'vitest';
import { calculateStandings } from '../js/rules/standings.js';
import { initializePlayoffBracket } from '../js/modules/playoffs.js';

describe('Real-World Scenario: MPL Indonesia Season 17 Benchmark', () => {
    // Data aktual klasemen akhir Regular Season MPL ID Season 17 (2026)
    const realSeason17Teams = [
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

    it('reproduksi pemecahan tie Dewa United vs Bigetron (Match Win sama 9-7, Dewa unggul Net Game Points)', () => {
        const standings = calculateStandings(realSeason17Teams, []);

        // Dewa (+5) harus berada di atas Bigetron (-1)
        const dewaIdx = standings.findIndex(t => t.tag === 'DEWA');
        const btrIdx = standings.findIndex(t => t.tag === 'BTR');

        expect(dewaIdx).toBe(2); // Seed 3
        expect(btrIdx).toBe(3);  // Seed 4
        expect(standings[dewaIdx].points).toBe(5);
        expect(standings[btrIdx].points).toBe(-1);
    });

    it('verifikasi seeding resmi Playoff Top 6 sesuai hasil Season 17', () => {
        const standings = calculateStandings(realSeason17Teams, []);
        const bracket = initializePlayoffBracket(standings, []);

        expect(bracket.format).toBe('top6');

        // Upper Bracket Semifinals (Round 2 Bye) terisi ONIC & TLID
        const upperSemis = bracket.rounds.find(r => r.name === 'Upper Semifinals');
        expect(upperSemis.matches[0].teamA.tag).toBe('ONIC');
        expect(upperSemis.matches[1].teamA.tag).toBe('TLID');

        // Play-ins Round 1
        const playIns = bracket.rounds.find(r => r.name === 'Play-ins');
        expect(playIns.matches[0].teamA.tag).toBe('DEWA'); // Seed 3
        expect(playIns.matches[1].teamA.tag).toBe('BTR');  // Seed 4

        // Zona Eliminasi (Peringkat 7, 8, 9)
        const elimTeams = standings.slice(6).map(t => t.tag);
        expect(elimTeams).toEqual(['AE', 'NAVI', 'RRQ']);
    });
});
