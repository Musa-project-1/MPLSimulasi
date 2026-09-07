import { describe, it, expect } from 'vitest';
import { calculateClinchStatus, CLINCH_STATUS } from '../js/rules/clinch.js';

describe('Magic Number & Clinch Engine', () => {
    it('detects playoff clinched when team wins exceed 7th place max potential wins', () => {
        const standings = [
            { id: 't1', tag: 'ONIC', match_played: 12, match_win: 13, points: 15 },
            { id: 't2', tag: 'RRQ', match_played: 12, match_win: 9, points: 8 },
            { id: 't3', tag: 'BTR', match_played: 12, match_win: 7, points: 6 },
            { id: 't4', tag: 'TLID', match_played: 12, match_win: 7, points: 3 },
            { id: 't5', tag: 'EVOS', match_played: 12, match_win: 6, points: 0 },
            { id: 't6', tag: 'AE', match_played: 12, match_win: 5, points: -2 },
            // 7th place Dewa has 3 wins, 4 remaining. Max potential wins = 7.
            { id: 't7', tag: 'DEWA', match_played: 12, match_win: 3, points: -6 },
            { id: 't8', tag: 'GEEK', match_played: 12, match_win: 2, points: -8 },
            { id: 't9', tag: 'NAVI', match_played: 12, match_win: 2, points: -10 }
        ];

        const res = calculateClinchStatus(standings, 16);
        const onic = res.find(t => t.tag === 'ONIC');
        // ONIC has 12 wins. 7th place DEWA max potential is 3 + 4 = 7 wins.
        // 12 > 7, so ONIC has clinched!
        expect(onic.clinch.status).toBe(CLINCH_STATUS.UPPER_CLINCHED);
        expect(onic.clinch.badgeLabel).toBe('Upper Bye');

        const rrq = res.find(t => t.tag === 'RRQ');
        // RRQ has 9 wins > 7 max wins of DEWA -> Clinched Playoff
        expect(rrq.clinch.status).toBe(CLINCH_STATUS.PLAYOFF_CLINCHED);
        expect(rrq.clinch.badgeLabel).toBe('Lolos Playoff');
    });

    it('detects mathematical elimination when team max potential wins cannot catch 6th place', () => {
        const standings = [
            { id: 't1', tag: 'ONIC', match_played: 14, match_win: 12, points: 15 },
            { id: 't2', tag: 'RRQ', match_played: 14, match_win: 10, points: 8 },
            { id: 't3', tag: 'BTR', match_played: 14, match_win: 9, points: 6 },
            { id: 't4', tag: 'TLID', match_played: 14, match_win: 8, points: 3 },
            { id: 't5', tag: 'EVOS', match_played: 14, match_win: 8, points: 0 },
            // 6th place AE has 7 wins.
            { id: 't6', tag: 'AE', match_played: 14, match_win: 7, points: -2 },
            { id: 't7', tag: 'DEWA', match_played: 14, match_win: 5, points: -6 },
            { id: 't8', tag: 'GEEK', match_played: 14, match_win: 4, points: -8 },
            // NAVI has 1 win and 2 remaining (max 3). Cannot reach 7 wins -> Eliminated.
            { id: 't9', tag: 'NAVI', match_played: 14, match_win: 1, points: -16 }
        ];

        const res = calculateClinchStatus(standings, 16);
        const navi = res.find(t => t.tag === 'NAVI');
        expect(navi.clinch.status).toBe(CLINCH_STATUS.ELIMINATED);
        expect(navi.clinch.badgeLabel).toBe('Tereliminasi');
    });

    it('computes accurate Magic Number for teams still in contention', () => {
        const standings = [
            { id: 't1', tag: 'ONIC', match_played: 10, match_win: 8, points: 8 },
            { id: 't2', tag: 'RRQ', match_played: 10, match_win: 7, points: 6 },
            { id: 't3', tag: 'BTR', match_played: 10, match_win: 6, points: 3 },
            { id: 't4', tag: 'TLID', match_played: 10, match_win: 6, points: 2 },
            { id: 't5', tag: 'EVOS', match_played: 10, match_win: 5, points: 1 },
            { id: 't6', tag: 'AE', match_played: 10, match_win: 5, points: -1 },
            // 7th place DEWA: 4 wins + 6 remaining = max 10 wins.
            // Target to guarantee = 10 + 1 = 11 wins.
            { id: 't7', tag: 'DEWA', match_played: 10, match_win: 4, points: -3 },
            { id: 't8', tag: 'GEEK', match_played: 10, match_win: 3, points: -7 },
            { id: 't9', tag: 'NAVI', match_played: 10, match_win: 1, points: -9 }
        ];

        const res = calculateClinchStatus(standings, 16);
        const onic = res.find(t => t.tag === 'ONIC');
        // ONIC has 8 wins, target is 11. Magic Number = 11 - 8 = 3.
        expect(onic.clinch.status).toBe(CLINCH_STATUS.IN_CONTENTION);
        expect(onic.clinch.magicNumber).toBe(3);
        expect(onic.clinch.badgeLabel).toBe('Magic: 3');
    });
});
