/**
 * Synthetic Web Audio Sound Effects for Esports Atmosphere
 * Zero external audio files; pure procedural Web Audio API synthesis.
 */

import { safeStorage } from '../store.js';

let audioCtx = null;
let soundMemoryFlag = true;

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

export function isSoundEnabled() {
    const val = safeStorage.getItem('mpl_sound_enabled');
    if (val === null) return soundMemoryFlag;
    return val !== 'false';
}

export function setSoundEnabled(enabled) {
    soundMemoryFlag = !!enabled;
    safeStorage.setItem('mpl_sound_enabled', enabled ? 'true' : 'false');
}

export function playScoreSound() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    } catch (_) {}
}

export function playSuccessSound() {
    if (!isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => { // C5 - E5 - G5
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);

            gain.gain.setValueAtTime(0.06, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.26);
        });
    } catch (_) {}
}
