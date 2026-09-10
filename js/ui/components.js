/**
 * Modul Komponen UI Bersama & Helper
 * Batas: <450 baris
 */

import { TEAM_LOGOS } from '../config.js';

/**
 * Menghasilkan elemen logo squircle tim
 * Jika gambar logo tidak ditemukan, menampilkan monogram inisial tim dengan aksen dinamis
 */
export function getTeamSquircle(tag, customClasses = "w-8 h-8", textClasses = "text-xs") {
    if (!tag || tag === "TBD") {
        return `
            <div class="${customClasses} rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 font-bold font-oswald ${textClasses} select-none shadow-sm">
                ?
            </div>
        `;
    }

    const logoUrl = TEAM_LOGOS[tag];
    if (logoUrl) {
        return `
            <div class="${customClasses} rounded-xl bg-slate-800/40 border border-slate-700/40 p-1 flex items-center justify-center overflow-hidden shadow-sm backdrop-blur-sm group-hover:border-rose-500/30 transition-colors">
                <img src="${logoUrl}" alt="Logo ${tag}" width="64" height="64" loading="lazy" decoding="async" class="w-full h-full object-contain filter drop-shadow" onerror="this.parentElement.innerHTML='<span class=\\'font-bold font-oswald text-slate-300 ${textClasses}\\'>${tag}</span>'">
            </div>
        `;
    }

    return `
        <div class="${customClasses} rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center font-bold font-oswald text-slate-200 ${textClasses} select-none shadow-sm">
            ${tag.slice(0, 3)}
        </div>
    `;
}

/**
 * Toast notification pengganti alert bawaan browser
 */
export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        container.className = 'fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const borderColors = {
        success: 'border-emerald-500/40 bg-slate-900/95 text-emerald-300',
        error: 'border-rose-500/40 bg-slate-900/95 text-rose-300',
        info: 'border-slate-700 bg-slate-900/95 text-slate-200'
    };
    const icons = {
        success: '<svg class="ph-icon text-lg text-emerald-400" aria-hidden="true"><use href="icons/sprite.svg#ph-check-circle"/></svg>',
        error: '<svg class="ph-icon text-lg text-rose-400" aria-hidden="true"><use href="icons/sprite.svg#ph-warning-circle"/></svg>',
        info: '<svg class="ph-icon text-lg text-blue-400" aria-hidden="true"><use href="icons/sprite.svg#ph-info"/></svg>'
    };

    const styleClass = borderColors[type] || borderColors.info;
    const icon = icons[type] || icons.info;

    toast.className = `pointer-events-auto flex items-center gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-semibold transform translate-y-3 opacity-0 transition-all duration-300 ${styleClass}`;
    toast.innerHTML = `
        <div class="flex-shrink-0">${icon}</div>
        <div class="flex-1 text-[12px] leading-relaxed text-slate-100">${message}</div>
    `;

    container.appendChild(toast);

    // Animasi masuk
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-3', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Otomatis hilang setelah 3.2 detik
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-3', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

/**
 * Kontrol modal global (fokus aman: simpan, jebak Tab, kembalikan, ESC tutup)
 */
let lastFocusedBeforeModal = null;
let modalKeyHandler = null;

function getFocusableIn(modalEl) {
    return [...modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter(el => !el.disabled && el.offsetParent !== null);
}

export function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    lastFocusedBeforeModal = document.activeElement;
    el.classList.remove('hidden');
    el.classList.add('flex');
    document.body.classList.add('modal-open');
    const box = el.querySelector('.modal-content');
    if (box) {
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
    }
    const focusTarget = el.querySelector('input, select, textarea, button');
    if (focusTarget) setTimeout(() => focusTarget.focus(), 60);
    if (!modalKeyHandler) {
        modalKeyHandler = (e) => {
            const activeModal = document.querySelector('.modal-wrapper:not(.hidden)');
            if (!activeModal) return;
            if (e.key === 'Escape') {
                closeModal(activeModal.id);
                return;
            }
            if (e.key !== 'Tab') return;
            const items = getFocusableIn(activeModal);
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', modalKeyHandler);
    }
}

export function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    el.classList.remove('flex');
    
    // Cek jika tidak ada modal aktif lain
    const anyModalActive = document.querySelector('.modal-wrapper:not(.hidden)');
    if (!anyModalActive) {
        document.body.classList.remove('modal-open');
        if (lastFocusedBeforeModal && document.contains(lastFocusedBeforeModal)) {
            lastFocusedBeforeModal.focus();
        }
        lastFocusedBeforeModal = null;
    }
}

/**
 * Loading indicator
 */
export function showLoading(show) {
    let loader = document.getElementById('app-loading-indicator');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'app-loading-indicator';
        loader.className = 'fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600 z-[999] transform -translate-y-full transition-transform duration-300';
        document.body.appendChild(loader);
    }
    if (show) {
        loader.classList.remove('-translate-y-full');
    } else {
        loader.classList.add('-translate-y-full');
    }
}

/**
 * Skeleton shimmer selagi Worker simulasi berjalan
 */
export function showStandingsSkeleton() {
    const bodies = ['standings-table-body', 'prob-table-body'];
    bodies.forEach(id => {
        const tbody = document.getElementById(id);
        if (!tbody) return;
        const cols = id === 'standings-table-body' ? 7 : 6;
        let html = '';
        for (let i = 0; i < 5; i++) {
            html += `<tr><td colspan="${cols}" class="px-4 py-3"><div class="skeleton" style="min-height: 32px;" aria-hidden="true"></div></td></tr>`;
        }
        tbody.innerHTML = html;
    });
    const top = document.getElementById('dash-top-standings');
    if (top) {
        top.innerHTML = '<div class="skeleton" style="min-height: 120px;" aria-hidden="true"></div>';
    }
}

/**
 * Format tanggal dalam Bahasa Indonesia yang ringkas
 */
export function formatDateIndo(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}
