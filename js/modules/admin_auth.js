/**
 * Admin Role & Authentication Gate
 * Protects master schedule broadcasting and cloud database publishing.
 */

import { openModal, closeModal, showToast } from '../ui/core.js';
import { safeStorage } from '../store.js';

export const DEFAULT_ADMIN_PIN = 'mpl2026';
let sessionAdminAuth = false;

export function getAdminPin() {
    return safeStorage.getItem('mpl_admin_pin') || DEFAULT_ADMIN_PIN;
}

export function setAdminPin(oldPin, newPin) {
    const current = getAdminPin();
    if (oldPin !== current) {
        return { success: false, error: "PIN Admin lama salah." };
    }

    const cleanNew = (newPin || '').trim();
    if (cleanNew.length < 4 || cleanNew.length > 20) {
        return { success: false, error: "PIN Admin baru harus antara 4 hingga 20 karakter." };
    }

    safeStorage.setItem('mpl_admin_pin', cleanNew);
    return { success: true };
}

export function isAdminLoggedIn() {
    try {
        if (typeof sessionStorage !== 'undefined') {
            return sessionStorage.getItem('mpl_admin_authenticated') === 'true';
        }
    } catch (_) {}
    return sessionAdminAuth;
}

export function authenticateAdmin(inputPin) {
    const clean = (inputPin || '').trim();
    const correctPin = getAdminPin();

    if (clean === correctPin) {
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('mpl_admin_authenticated', 'true');
            }
        } catch (_) {}
        sessionAdminAuth = true;
        updateAdminUIState();
        return { success: true };
    }

    return { success: false, error: "PIN Admin salah. Akses master ditolak." };
}

export function logoutAdmin() {
    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('mpl_admin_authenticated');
        }
    } catch (_) {}
    sessionAdminAuth = false;
    updateAdminUIState();
    showToast("Anda telah keluar dari Mode Admin.", "info");
}

export function openAdminLoginModal(onSuccessCallback = null) {
    if (isAdminLoggedIn()) {
        showToast("Anda sudah berada dalam Mode Admin.", "info");
        return;
    }

    const pinInput = document.getElementById('input-admin-pin');
    if (pinInput) pinInput.value = '';

    const errEl = document.getElementById('admin-login-error');
    if (errEl) errEl.classList.add('hidden');

    openModal('modal-admin-login');
}

export function submitAdminLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const pin = document.getElementById('input-admin-pin')?.value || '';
    const result = authenticateAdmin(pin);

    const errEl = document.getElementById('admin-login-error');

    if (result.success) {
        closeModal('modal-admin-login');
        showToast("Autentikasi Admin berhasil! Mode Master aktif.", "success");
    } else {
        if (errEl) {
            errEl.innerText = result.error;
            errEl.classList.remove('hidden');
        }
    }
}

export function updateAdminUIState() {
    if (typeof document === 'undefined') return;

    const isLoggedIn = isAdminLoggedIn();

    // Update Header Badges
    const adminHeaderContainer = document.getElementById('header-admin-badge-container');
    if (adminHeaderContainer) {
        if (isLoggedIn) {
            adminHeaderContainer.innerHTML = `
                <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/15 text-rose-500 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                    <i class="ph-fill ph-shield-check text-xs"></i>
                    <span>Admin Mode</span>
                    <button onclick="logoutAdmin()" class="ml-1 text-slate-400 hover:text-rose-400" title="Keluar dari Mode Admin">
                        <i class="ph ph-sign-out text-xs"></i>
                    </button>
                </div>
            `;
        } else {
            adminHeaderContainer.innerHTML = `
                <button onclick="openAdminLoginModal()" class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Login Portal Admin">
                    <i class="ph ph-shield-lock text-xl"></i>
                </button>
            `;
        }
    }
}
