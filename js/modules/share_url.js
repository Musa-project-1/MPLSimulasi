/**
 * URL Hash Prediction Sharing Engine (Zero-Database Payload)
 * Compresses 72-match tournament predictions into URL hash for instant sharing.
 */

import * as Store from '../store.js';
import { showToast, customAlert } from '../ui/core.js';
import { initializeMockDataForSession } from './schedule.js';

export const SCORE_TO_CODE = {
    '': '0',
    '2-0': '1',
    '2-1': '2',
    '1-2': '3',
    '0-2': '4'
};

export const CODE_TO_SCORE = {
    '0': { scoreA: '', scoreB: '', status: 'SCHEDULED' },
    '1': { scoreA: 2, scoreB: 0, status: 'COMPLETED' },
    '2': { scoreA: 2, scoreB: 1, status: 'COMPLETED' },
    '3': { scoreA: 1, scoreB: 2, status: 'COMPLETED' },
    '4': { scoreA: 0, scoreB: 2, status: 'COMPLETED' }
};

export function encodeMatchesToCode(matches = []) {
    const sorted = [...matches].sort((a, b) => 
        (parseInt(a.week, 10) - parseInt(b.week, 10)) || 
        (parseInt(a.day, 10) - parseInt(b.day, 10)) || 
        String(a.id).localeCompare(String(b.id))
    );

    return sorted.map(m => {
        if (m.status !== 'COMPLETED') return '0';
        const key = `${m.score_a}-${m.score_b}`;
        return SCORE_TO_CODE[key] || '0';
    }).join('');
}

export function decodeCodeToMatches(codeStr = '', targetMatches = []) {
    const sorted = [...targetMatches].sort((a, b) => 
        (parseInt(a.week, 10) - parseInt(b.week, 10)) || 
        (parseInt(a.day, 10) - parseInt(b.day, 10)) || 
        String(a.id).localeCompare(String(b.id))
    );

    for (let i = 0; i < sorted.length && i < codeStr.length; i++) {
        const char = codeStr[i];
        const res = CODE_TO_SCORE[char] || CODE_TO_SCORE['0'];
        sorted[i].score_a = res.scoreA;
        sorted[i].score_b = res.scoreB;
        sorted[i].status = res.status;
    }

    return targetMatches;
}

export function generatePredictionShareUrl() {
    if (typeof window === 'undefined') return '';
    const code = encodeMatchesToCode(Store.globalMatches);
    const sessionName = encodeURIComponent(Store.activeSessionName || 'Prediksi');
    const base = window.location.origin + window.location.pathname;
    return `${base}#prediksi=${code}&nama=${sessionName}`;
}

export async function handleSharePredictionLink() {
    const url = generatePredictionShareUrl();
    if (!url) {
        showToast("Buka atau buat sesi terlebih dahulu.", "warning");
        return;
    }

    const shareTitle = `Hasil Prediksi MPLSim: ${Store.activeSessionName || 'Turnamen'}`;
    const shareText = `Lihat dan uji hasil simulasi bracket turnamen MPL saya di MPLSim:`;

    if (typeof navigator !== 'undefined' && navigator.share) {
        try {
            await navigator.share({
                title: shareTitle,
                text: shareText,
                url
            });
            return;
        } catch (_) {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(url);
            showToast("Tautan prediksi berhasil disalin! Bagikan ke WhatsApp atau teman Anda.", "success");
            return;
        } catch (_) {}
    }

    customAlert(`Tautan Prediksi Anda:\n\n${url}`);
}

export function checkAndLoadSharedPrediction() {
    if (typeof window === 'undefined' || !window.location.hash) return false;

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const code = params.get('prediksi');
    const name = params.get('nama') || 'Prediksi Teman';

    if (!code || !/^[0-4]+$/.test(code)) {
        showToast('Tautan prediksi tidak valid.', 'warning');
        return false;
    }

    const sessionTitle = String(name).slice(0, 30);
    const sessions = Store.loadSessionsList();
    const shareKey = `${code}:${sessionTitle}`;
    const existing = sessions.find(session => session.shareKey === shareKey);
    const newSessionId = existing?.id || `shared_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!existing) {
        sessions.unshift({ id: newSessionId, name: `[Link] ${sessionTitle}`, shareKey, timestamp: Date.now() });
        Store.saveSessionsList();
    }

    Store.setActiveSessionId(newSessionId);
    Store.setActiveSessionName(`[Link] ${sessionTitle}`);

    initializeMockDataForSession(newSessionId, 'standard');
    const matches = Store.getSessionMatches(newSessionId);
    const teams = Store.getSessionTeams(newSessionId);

    if (code.length > matches.length) {
        Store.safeStorage.removeItem('mpl_teams_' + newSessionId);
        Store.safeStorage.removeItem('mpl_matches_' + newSessionId);
        Store.setActiveSessionId(null);
        Store.setActiveSessionName('');
        Store.setSessionsList(sessions.filter(session => session.id !== newSessionId));
        Store.saveSessionsList();
        showToast('Tautan prediksi tidak cocok dengan format jadwal.', 'warning');
        return false;
    }

    decodeCodeToMatches(code, matches);
    Store.saveSessionData(teams, matches, newSessionId);

    window.history.replaceState(null, '', window.location.pathname);
    showToast(`Memuat hasil prediksi dari tautan: ${sessionTitle}`, "success");
    return true;
}
