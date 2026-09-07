import { describe, it, expect } from 'vitest';
import { 
    validateBo3Score, 
    validatePlayoffScore, 
    sanitizeSessionName, 
    validateTeamData, 
    validatePlayerData, 
    validateSessionImport,
    validateMatchupTeams 
} from '../js/rules/validators.js';

describe('Validation & Sanitization Engine', () => {
    describe('validateBo3Score', () => {
        it('accepts valid Bo3 scores (2-0, 2-1, 1-2, 0-2)', () => {
            expect(validateBo3Score(2, 0).valid).toBe(true);
            expect(validateBo3Score(2, 1).valid).toBe(true);
            expect(validateBo3Score(1, 2).valid).toBe(true);
            expect(validateBo3Score(0, 2).valid).toBe(true);
        });

        it('accepts reset score ("" and "")', () => {
            const res = validateBo3Score("", "");
            expect(res.valid).toBe(true);
            expect(res.isReset).toBe(true);
        });

        it('rejects draws (seri)', () => {
            const res = validateBo3Score(1, 1);
            expect(res.valid).toBe(false);
            expect(res.error).toContain('seri');
        });

        it('rejects scores where winner did not reach 2 wins', () => {
            const res = validateBo3Score(1, 0);
            expect(res.valid).toBe(false);
            expect(res.error).toContain('tidak valid');
        });

        it('rejects scores above 2 wins in Bo3 (e.g. 3-0, 3-1)', () => {
            expect(validateBo3Score(3, 0).valid).toBe(false);
            expect(validateBo3Score(3, 1).valid).toBe(false);
        });

        it('rejects negative numbers and non-numeric inputs', () => {
            expect(validateBo3Score(-1, 2).valid).toBe(false);
            expect(validateBo3Score("abc", 2).valid).toBe(false);
        });
    });

    describe('validatePlayoffScore', () => {
        it('validates standard Bo5 playoff matches (first to 3 wins)', () => {
            expect(validatePlayoffScore(3, 0, false).valid).toBe(true);
            expect(validatePlayoffScore(3, 1, false).valid).toBe(true);
            expect(validatePlayoffScore(3, 2, false).valid).toBe(true);
            expect(validatePlayoffScore(2, 3, false).valid).toBe(true);

            // Invalid Bo5: 3-3, 4-1, 2-1
            expect(validatePlayoffScore(3, 3, false).valid).toBe(false);
            expect(validatePlayoffScore(4, 1, false).valid).toBe(false);
            expect(validatePlayoffScore(2, 1, false).valid).toBe(false);
        });

        it('validates Grand Final Bo7 matches (first to 4 wins)', () => {
            expect(validatePlayoffScore(4, 0, true).valid).toBe(true);
            expect(validatePlayoffScore(4, 2, true).valid).toBe(true);
            expect(validatePlayoffScore(4, 3, true).valid).toBe(true);
            expect(validatePlayoffScore(3, 4, true).valid).toBe(true);

            // Invalid Bo7: 3-1, 5-2, 4-4
            expect(validatePlayoffScore(3, 1, true).valid).toBe(false);
            expect(validatePlayoffScore(5, 2, true).valid).toBe(false);
            expect(validatePlayoffScore(4, 4, true).valid).toBe(false);
        });
    });

    describe('sanitizeSessionName', () => {
        it('sanitizes valid session names', () => {
            const res = sanitizeSessionName("  MPL ID Season 17  ");
            expect(res.valid).toBe(true);
            expect(res.name).toBe("MPL ID Season 17");
        });

        it('strips dangerous HTML tags', () => {
            const res = sanitizeSessionName("<script>alert(1)</script>MPL ID S17");
            expect(res.valid).toBe(true);
            expect(res.name).toBe("alert(1)MPL ID S17");
            expect(res.name).not.toContain('<script>');
        });

        it('rejects empty or too short names', () => {
            expect(sanitizeSessionName("").valid).toBe(false);
            expect(sanitizeSessionName("   ").valid).toBe(false);
            expect(sanitizeSessionName("M").valid).toBe(false);
        });
    });

    describe('validateTeamData and validatePlayerData', () => {
        it('validates team tag pattern and name length', () => {
            expect(validateTeamData("RRQ Hoshi", "RRQ").valid).toBe(true);
            expect(validateTeamData("FNATIC ONIC", "ONIC").valid).toBe(true);

            // Invalid tags: lowercase, symbols, too long, too short
            expect(validateTeamData("Test Team", "R").valid).toBe(false);
            expect(validateTeamData("Test Team", "TOOLONGTAG").valid).toBe(false);
            expect(validateTeamData("Test Team", "rrq").valid).toBe(true); // normalizes to RRQ
        });

        it('validates player roles against official positions', () => {
            expect(validatePlayerData("Kairi", "Jungler").valid).toBe(true);
            expect(validatePlayerData("Skylar", "Gold Laner").valid).toBe(true);
            expect(validatePlayerData("PlayerX", "InvalidRole").valid).toBe(false);
        });
    });

    describe('validateSessionImport', () => {
        it('rejects malformed or invalid type JSON', () => {
            expect(validateSessionImport(null).valid).toBe(false);
            expect(validateSessionImport({ type: 'OTHER' }).valid).toBe(false);
        });

        it('sanitizes and passes valid session structures', () => {
            const validData = {
                type: "MPL_SIM_SESSION",
                session: { id: "sess_1", name: "<b>Test</b> Session", timestamp: 123456 },
                teams: [{ id: "t1", team_name: "Team 1", tag: "T1", match_win: "3" }],
                matches: [{ id: "m1", week: "1", day: "1", team_a_id: "t1", score_a: "2" }]
            };

            const res = validateSessionImport(validData);
            expect(res.valid).toBe(true);
            expect(res.session.name).toBe("Test Session"); // stripped <b>
            expect(res.teams[0].match_win).toBe(3); // coerced to integer
            expect(res.matches[0].week).toBe(1);
        });
    });

    describe('validateMatchupTeams', () => {
        it('accepts valid distinct matchup teams', () => {
            const res = validateMatchupTeams('ONIC', 'RRQ');
            expect(res.valid).toBe(true);
            expect(res.teamA).toBe('ONIC');
            expect(res.teamB).toBe('RRQ');
        });

        it('rejects self-matchup where teamA equals teamB', () => {
            const res = validateMatchupTeams('ONIC', 'ONIC');
            expect(res.valid).toBe(false);
            expect(res.error).toContain('tidak boleh tim yang sama');
        });

        it('rejects missing team selections', () => {
            expect(validateMatchupTeams('', 'RRQ').valid).toBe(false);
            expect(validateMatchupTeams('ONIC', '').valid).toBe(false);
        });
    });
});
