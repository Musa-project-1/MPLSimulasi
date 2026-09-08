import { describe, expect, it } from 'vitest';
import { escapeHTML } from '../js/ui/core.js';

describe('UI safety helpers', () => {
    it('escapes HTML text and attribute metacharacters', () => {
        expect(escapeHTML(`<img src=x onerror="alert(1)">`)).toBe(
            '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
        );
    });

    it('handles nullish values without creating markup', () => {
        expect(escapeHTML(null)).toBe('');
        expect(escapeHTML(undefined)).toBe('');
    });
});
