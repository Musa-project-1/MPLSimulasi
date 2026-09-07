import { describe, it, expect } from 'vitest';
import { 
    encodeMatchesToCode, 
    decodeCodeToMatches, 
    SCORE_TO_CODE, 
    CODE_TO_SCORE 
} from '../js/modules/share_url.js';

describe('URL Hash Prediction Sharing Engine', () => {
    it('accurately encodes match results into compact code string', () => {
        const matches = [
            { id: 'm1', week: 1, day: 1, score_a: 2, score_b: 0, status: 'COMPLETED' },
            { id: 'm2', week: 1, day: 1, score_a: 2, score_b: 1, status: 'COMPLETED' },
            { id: 'm3', week: 1, day: 2, score_a: 1, score_b: 2, status: 'COMPLETED' },
            { id: 'm4', week: 1, day: 2, score_a: 0, score_b: 2, status: 'COMPLETED' },
            { id: 'm5', week: 1, day: 3, score_a: '', score_b: '', status: 'SCHEDULED' }
        ];

        const code = encodeMatchesToCode(matches);
        expect(code).toBe('12340');
    });

    it('accurately decodes compact code string back into match results', () => {
        const targetMatches = [
            { id: 'm1', week: 1, day: 1, score_a: '', score_b: '', status: 'SCHEDULED' },
            { id: 'm2', week: 1, day: 1, score_a: '', score_b: '', status: 'SCHEDULED' },
            { id: 'm3', week: 1, day: 2, score_a: '', score_b: '', status: 'SCHEDULED' },
            { id: 'm4', week: 1, day: 2, score_a: '', score_b: '', status: 'SCHEDULED' },
            { id: 'm5', week: 1, day: 3, score_a: '', score_b: '', status: 'SCHEDULED' }
        ];

        const restored = decodeCodeToMatches('12340', targetMatches);
        expect(restored[0].status).toBe('COMPLETED');
        expect(restored[0].score_a).toBe(2);
        expect(restored[0].score_b).toBe(0);

        expect(restored[1].status).toBe('COMPLETED');
        expect(restored[1].score_a).toBe(2);
        expect(restored[1].score_b).toBe(1);

        expect(restored[2].status).toBe('COMPLETED');
        expect(restored[2].score_a).toBe(1);
        expect(restored[2].score_b).toBe(2);

        expect(restored[3].status).toBe('COMPLETED');
        expect(restored[3].score_a).toBe(0);
        expect(restored[3].score_b).toBe(2);

        expect(restored[4].status).toBe('SCHEDULED');
        expect(restored[4].score_a).toBe('');
    });
});
