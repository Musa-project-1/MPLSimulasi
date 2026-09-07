import { describe, it, expect } from 'vitest';
import { 
    parseMatchText, 
    normalizeTeamTag, 
    OFFICIAL_S18_WEEK_1_TO_4_TEXT 
} from '../js/modules/quick_importer.js';

describe('Fast Match & Score Importer (Quick Batch Text Parser)', () => {
    describe('normalizeTeamTag', () => {
        it('normalizes full team names and variants to official tags', () => {
            expect(normalizeTeamTag("FNATIC ONIC")).toBe("ONIC");
            expect(normalizeTeamTag("RRQ Hoshi")).toBe("RRQ");
            expect(normalizeTeamTag("Bigetron by Vitality")).toBe("BTR");
            expect(normalizeTeamTag("Team Liquid ID")).toBe("TLID");
            expect(normalizeTeamTag("EVOS Glory")).toBe("EVOS");
            expect(normalizeTeamTag("Alter Ego")).toBe("AE");
            expect(normalizeTeamTag("Dewa United")).toBe("DEWA");
            expect(normalizeTeamTag("Geek Fam")).toBe("GEEK");
            expect(normalizeTeamTag("Natus Vincere")).toBe("NAVI");
        });
    });

    describe('parseMatchText', () => {
        it('parses freeform score text accurately', () => {
            const sampleText = `
            Week 1
            EVOS 2-0 RRQ
            NAVI 0-2 AE
            TLID 2-1 GEEK
            `;

            const results = parseMatchText(sampleText);
            expect(results.length).toBe(3);

            expect(results[0]).toEqual({
                week: 1,
                day: 1,
                teamA: "EVOS",
                teamB: "RRQ",
                scoreA: 2,
                scoreB: 0,
                status: "COMPLETED"
            });

            expect(results[1].teamA).toBe("NAVI");
            expect(results[1].teamB).toBe("AE");
            expect(results[1].scoreA).toBe(0);
            expect(results[1].scoreB).toBe(2);
        });

        it('parses official Season 18 Week 1 to 4 dataset successfully', () => {
            const results = parseMatchText(OFFICIAL_S18_WEEK_1_TO_4_TEXT);
            expect(results.length).toBeGreaterThanOrEqual(20);

            // Week 1 matches
            const w1Matches = results.filter(m => m.week === 1);
            expect(w1Matches.length).toBe(8);

            // Week 4 matches
            const w4Matches = results.filter(m => m.week === 4);
            expect(w4Matches.length).toBe(3);
        });

        it('parses scheduled matchups without scores as SCHEDULED', () => {
            const text = `
            Week 5
            ONIC vs RRQ
            BTR vs EVOS
            `;

            const results = parseMatchText(text);
            expect(results.length).toBe(2);
            expect(results[0].status).toBe('SCHEDULED');
            expect(results[0].teamA).toBe('ONIC');
            expect(results[0].teamB).toBe('RRQ');
        });

        it('tolerates parentheses and brackets in match scores', () => {
            const text = `
            Week 6
            ONIC (2) - (0) RRQ
            BTR [2] : [1] EVOS
            `;

            const results = parseMatchText(text);
            expect(results.length).toBe(2);
            expect(results[0].scoreA).toBe(2);
            expect(results[0].scoreB).toBe(0);
            expect(results[0].teamA).toBe('ONIC');
            expect(results[0].teamB).toBe('RRQ');

            expect(results[1].scoreA).toBe(2);
            expect(results[1].scoreB).toBe(1);
            expect(results[1].teamA).toBe('BTR');
            expect(results[1].teamB).toBe('EVOS');
        });
    });
});
