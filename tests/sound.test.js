import { describe, it, expect, beforeEach } from 'vitest';
import { isSoundEnabled, setSoundEnabled, playScoreSound, playSuccessSound } from '../js/modules/sound.js';

describe('Synthetic Web Audio Sound System', () => {
    beforeEach(() => {
        setSoundEnabled(true);
    });

    it('defaults to sound enabled', () => {
        expect(isSoundEnabled()).toBe(true);
    });

    it('persists toggle preference', () => {
        setSoundEnabled(false);
        expect(isSoundEnabled()).toBe(false);
        setSoundEnabled(true);
        expect(isSoundEnabled()).toBe(true);
    });

    it('safely handles audio execution in headless/Node environment without errors', () => {
        expect(() => playScoreSound()).not.toThrow();
        expect(() => playSuccessSound()).not.toThrow();
    });
});
