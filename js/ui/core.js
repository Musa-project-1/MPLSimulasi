/**
 * Core UI Components, Modals, Alerts, Navigation, and Brand Monogram
 */

import { TEAM_LOGOS } from '../config.js';
import { sessionsList } from '../store.js';

export let currentViewWeek = 1;
let lastModalTrigger = null;

export function setCurrentViewWeek(week) { currentViewWeek = week; }
export function getCurrentViewWeek() { return currentViewWeek; }

/**
 * Robust HTML Sanitizer to prevent Stored & Reflected XSS
 */
export function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Geometric Monogram Logo for MPLSim
 * Distinct esports studio identity: Ruby / Crimson gradient squircle with angular faceted M.
 */
export function getAppLogoSvg(sizeClass = 'w-9 h-9') {
    return `
    <div class="${sizeClass} relative flex-shrink-0 flex items-center justify-center select-none" aria-label="MPLSim Logo">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-md">
            <defs>
                <linearGradient id="mplGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#E11D48" />
                    <stop offset="60%" stop-color="#BE123C" />
                    <stop offset="100%" stop-color="#4C0519" />
                </linearGradient>
                <linearGradient id="mplInner" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
                    <stop offset="100%" stop-color="#FECDD3" stop-opacity="0.8" />
                </linearGradient>
            </defs>
            <!-- Squircle Outer Base -->
            <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#mplGrad)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />
            <!-- Inner Hex/Angled Geometric Structure -->
            <path d="M12 34V14L24 25L36 14V34" stroke="url(#mplInner)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M24 25V35" stroke="#FECDD3" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 3" />
        </svg>
    </div>
    `;
}

export function getTeamLogo(tag, customClasses = '') {
    const safeTag = escapeHTML(tag || '');
    const safeClasses = escapeHTML(customClasses);
    if (!tag || tag === 'TBD') {
        return `<span class="bg-slate-100 text-slate-400 inline-flex items-center justify-center font-bold text-[10px] ${safeClasses} border border-slate-200 flex-shrink-0 rounded-lg">?</span>`;
    }
    const logoUrl = TEAM_LOGOS[tag];
    if (logoUrl) {
        const safeUrl = escapeHTML(logoUrl);
        return `<img src="${safeUrl}" alt="${safeTag}" class="object-contain ${safeClasses}">`;
    }
    return `<span class="bg-slate-200 text-slate-600 inline-flex items-center justify-center font-bold text-[10px] ${safeClasses} border border-slate-300 flex-shrink-0 rounded-lg">${escapeHTML(String(tag).substring(0, 3))}</span>`;
}

/**
 * Lightweight Toast Notification (non-intrusive alert replacement)
 */
export function showToast(message, type = 'info') {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = "fixed bottom-5 right-5 z-[500] flex flex-col gap-2 pointer-events-none";
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const borderColors = {
        info: 'border-blue-500/30 text-blue-400 bg-slate-900/90',
        success: 'border-emerald-500/30 text-emerald-400 bg-slate-900/90',
        warning: 'border-amber-500/30 text-amber-400 bg-slate-900/90',
        error: 'border-rose-500/30 text-rose-400 bg-slate-900/90'
    };

    const icons = {
        info: 'ph-info',
        success: 'ph-check-circle',
        warning: 'ph-warning',
        error: 'ph-x-circle'
    };

    const scheme = borderColors[type] || borderColors.info;
    const icon = icons[type] || icons.info;

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border ${scheme} shadow-2xl backdrop-blur-md text-xs font-bold uppercase tracking-wider transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto max-w-sm`;
    toast.innerHTML = `
        <i class="ph-fill ${icon} text-lg flex-shrink-0"></i>
        <span class="text-[var(--text-primary)] normal-case font-medium flex-1">${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

export function showLoading(show) {
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.toggle('hidden', !show);
}

export function openModal(id) {
    const m = document.getElementById(id);
    const c = document.getElementById(id + '-content');
    if (!m) return;
    lastModalTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-hidden', 'false');
    if (c && !c.id) c.id = `${id}-content`;
    m.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => {
        m.classList.remove('opacity-0');
        if (c) {
            c.classList.remove('scale-95');
            const firstField = c.querySelector('input:not([type="hidden"]), select, textarea, button');
            if (firstField) firstField.focus({ preventScroll: true });
        }
    }, 10);
}

export function closeModal(id) {
    const m = document.getElementById(id);
    const c = document.getElementById(id + '-content');
    if (!m) return;
    m.setAttribute('aria-hidden', 'true');
    m.classList.add('opacity-0');
    if (c) c.classList.add('scale-95');
    setTimeout(() => {
        m.classList.add('hidden');
        if (!document.querySelector('[id^="modal-"]:not(.hidden)')) {
            document.body.classList.remove('modal-open');
            if (lastModalTrigger && document.contains(lastModalTrigger)) {
                lastModalTrigger.focus({ preventScroll: true });
            }
            lastModalTrigger = null;
        }
    }, 280);
}

export function customAlert(message) {
    const alertMsg = document.getElementById('alert-message');
    if (alertMsg) alertMsg.innerText = message;
    openModal('modal-alert');
}

export function updateSettingLabel(id, val) {
    const el = document.getElementById('val-setting-' + id);
    if (el) el.innerText = val + '%';
}

export function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
}

export function switchTab(viewId, element) {
    document.querySelectorAll('header nav a').forEach(el => {
        el.classList.remove('nav-active');
        el.classList.add('text-slate-600');
    });
    if (element) {
        element.classList.add('nav-active');
        element.classList.remove('text-slate-600');
    }

    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden');
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = null;
    });

    const targetView = document.getElementById('view-' + viewId);
    if (!targetView) return;

    if (viewId === 'matches') {
        targetView.classList.remove('hidden');
        targetView.classList.add('flex');
    } else {
        targetView.classList.remove('hidden');
    }

    if (viewId === 'dashboard' && window.loadDashboard) window.loadDashboard();
    if (viewId === 'standings' && window.loadStandings) window.loadStandings();
    if (viewId === 'matches' && window.loadMatches) window.loadMatches();
    if (viewId === 'teams' && window.loadTeams) window.loadTeams();
}

export function switchSubTab(tabId) {
    const tabs = ['standing', 'matrix', 'prob'];
    tabs.forEach(t => {
        const btn = document.getElementById('btn-tab-' + t);
        const panel = document.getElementById('tab-' + t);
        if (btn) {
            btn.className = t === tabId
                ? "px-4 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm rounded-md font-bold text-sm transition"
                : "px-4 py-2 text-slate-400 rounded-md font-medium text-sm hover:text-[var(--text-primary)] transition";
        }
        if (panel) {
            panel.classList.toggle('hidden', t !== tabId);
            if (t === tabId) {
                panel.style.animation = 'none';
                panel.offsetHeight;
                panel.style.animation = null;
            }
        }
    });

    if (tabId === 'matrix' && window.renderH2HMatrix) {
        window.renderH2HMatrix();
    }
}

export function switchMatchSubTab(tabId) {
    const btnRegular = document.getElementById('btn-match-regular');
    const btnPlayoffs = document.getElementById('btn-match-playoffs');
    const contRegular = document.getElementById('container-match-regular');
    const contPlayoffs = document.getElementById('container-match-playoffs');

    if (tabId === 'regular') {
        if (btnRegular) btnRegular.className = "pb-2 border-b-2 border-rose-600 text-rose-500 font-semibold px-2 uppercase tracking-wide text-sm transition-all";
        if (btnPlayoffs) btnPlayoffs.className = "pb-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-semibold px-2 uppercase tracking-wide text-sm transition-all";
        if (contRegular) contRegular.classList.remove('hidden');
        if (contPlayoffs) contPlayoffs.classList.add('hidden');
    } else {
        if (btnPlayoffs) btnPlayoffs.className = "pb-2 border-b-2 border-rose-600 text-rose-500 font-semibold px-2 uppercase tracking-wide text-sm transition-all";
        if (btnRegular) btnRegular.className = "pb-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-semibold px-2 uppercase tracking-wide text-sm transition-all";
        if (contRegular) contRegular.classList.add('hidden');
        if (contPlayoffs) contPlayoffs.classList.remove('hidden');
        if (window.loadPlayoffs) window.loadPlayoffs();
    }
}

export function switchSettingsSection(sectionId) {
    document.querySelectorAll('.settings-nav-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-indigo-600', 'text-white', 'shadow-lg');
        btn.classList.add('text-[var(--text-secondary)]', 'hover:bg-[var(--bg-input)]');
    });

    const activeBtn = document.getElementById('btn-settings-' + sectionId);
    if (activeBtn) {
        activeBtn.classList.add('active', 'bg-indigo-600', 'text-white', 'shadow-lg');
        activeBtn.classList.remove('text-[var(--text-secondary)]', 'hover:bg-[var(--bg-input)]');
    }

    document.querySelectorAll('.settings-section').forEach(sec => sec.classList.add('hidden'));
    const targetSection = document.getElementById('section-settings-' + sectionId);
    if (targetSection) targetSection.classList.remove('hidden');

    const titles = {
        'engine': 'Simulation Engine',
        'appearance': 'Interface & Visuals',
        'system': 'System Administration'
    };
    const titleEl = document.getElementById('settings-section-title');
    if (titleEl) titleEl.innerText = titles[sectionId] || 'Settings';
}

export function renderSessionManager() {
    const listEl = document.getElementById('session-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!sessionsList || sessionsList.length === 0) {
        listEl.innerHTML = `<div class="text-center py-10 text-slate-400 font-medium border border-dashed border-slate-700 rounded-xl bg-slate-800/30">Belum ada sesi tersimpan. Mulai buat sesi simulasi Anda!</div>`;
        return;
    }

    const sortedSessions = [...sessionsList].sort((a, b) => b.timestamp - a.timestamp);

    sortedSessions.forEach(session => {
        const dateObj = new Date(session.timestamp);
        const dateStr = dateObj.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const html = `
            <div class="flex justify-between items-center bg-slate-800/80 border border-slate-700 rounded-xl p-4 hover:bg-slate-700/80 hover:border-slate-500 transition cursor-pointer group" onclick="openSession('${session.id}')">
                <div class="flex items-center text-left">
                    <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-rose-400 mr-4 group-hover:bg-rose-600 group-hover:text-white transition shadow-inner">
                        <i class="ph-fill ph-game-controller text-xl"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-white text-lg tracking-wide">${escapeHTML(session.name)}</h3>
                            <span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold border border-emerald-500/20 inline-flex items-center gap-1"><i class="ph-fill ph-cloud"></i> Cloud</span>
                        </div>
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5"><i class="ph ph-clock mr-1"></i>Last active: ${dateStr}</p>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); deleteSession('${session.id}')" class="text-slate-400 hover:text-rose-400 p-2 opacity-0 group-hover:opacity-100 transition" title="Delete Session">
                    <i class="ph-fill ph-trash text-xl"></i>
                </button>
            </div>
        `;
        listEl.innerHTML += html;
    });
}

if (typeof window !== 'undefined') {
    document.addEventListener('click', (e) => {
        const modal = e.target.closest('[id^="modal-"]');
        if (modal && e.target === modal && !modal.classList.contains('hidden')) {
            closeModal(modal.id);
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('[id^="modal-"]:not(.hidden)');
            openModals.forEach(m => {
                if (m.id) closeModal(m.id);
            });
        }
    });
}
