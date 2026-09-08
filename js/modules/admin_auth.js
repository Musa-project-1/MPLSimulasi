/**
 * Admin Role & Authentication Gate
 * Protects master schedule broadcasting and cloud database publishing.
 */

import { openModal, closeModal, showToast } from '../ui/core.js';
import { safeStorage } from '../store.js';
import { isSupabaseAuthAdmin, signInWithPassword, signOutSupabase } from './supabase.js';

export const DEFAULT_ADMIN_PIN = 'mpl2026';
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 60 * 1000;

let sessionAdminAuth = false;
let failedAttempts = 0;
let lockoutUntil = 0;

export function getRemainingLockoutSeconds() {
    const diff = lockoutUntil - Date.now();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
}

export function resetLockout() {
    failedAttempts = 0;
    lockoutUntil = 0;
}

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
    return isSupabaseAuthAdmin();
}

export function authenticateAdmin(inputPin) {
    const remainingSeconds = getRemainingLockoutSeconds();
    if (remainingSeconds > 0) {
        return { 
            success: false, 
            error: `Terlalu banyak percobaan gagal. Akses diblokir sementara selama ${remainingSeconds} detik.` 
        };
    }

    const clean = (inputPin || '').trim();
    const correctPin = getAdminPin();

    if (clean === correctPin) {
        resetLockout();
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('mpl_admin_authenticated', 'true');
            }
        } catch (_) {}
        sessionAdminAuth = true;
        updateAdminUIState();
        return { success: true };
    }

    failedAttempts++;
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        return {
            success: false,
            error: `PIN Admin salah 5 kali berturut-turut. Akses diblokir sementara selama 60 detik.`
        };
    }

    const remainingTries = MAX_FAILED_ATTEMPTS - failedAttempts;
    return { 
        success: false, 
        error: `PIN Admin salah. Sisa kesempatan: ${remainingTries} kali.` 
    };
}

export function logoutAdmin() {
    signOutSupabase();
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

    const emailInput = document.getElementById('input-admin-email');
    const passwordInput = document.getElementById('input-admin-password');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';

    const errEl = document.getElementById('admin-login-error');
    if (errEl) errEl.classList.add('hidden');

    openModal('modal-admin-login');
}

export async function submitAdminLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = document.getElementById('input-admin-email')?.value || '';
    const password = document.getElementById('input-admin-password')?.value || '';
    const result = await signInWithPassword(email, password);
    const errEl = document.getElementById('admin-login-error');

    if (result.success) {
        closeModal('modal-admin-login');
        updateAdminUIState();
        showToast("Login Admin berhasil. Mode Master aktif.", "success");
    } else if (errEl) {
        errEl.innerText = result.error;
        errEl.classList.remove('hidden');
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

    renderAdminSettingsCard();
}

export function handleChangeAdminPinForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const oldPin = document.getElementById('setting-old-admin-pin')?.value || '';
    const newPin = document.getElementById('setting-new-admin-pin')?.value || '';
    const confirmPin = document.getElementById('setting-confirm-admin-pin')?.value || '';

    if (newPin !== confirmPin) {
        showToast("Konfirmasi PIN baru tidak cocok.", "warning");
        return;
    }

    const res = setAdminPin(oldPin, newPin);
    if (res.success) {
        showToast("PIN Admin berhasil diperbarui!", "success");
        const f = document.getElementById('form-change-admin-pin');
        if (f) f.reset();
    } else {
        showToast(res.error || "Gagal mengubah PIN.", "error");
    }
}

export function renderAdminSettingsCard() {
    if (typeof document === 'undefined') return;
    const statusEl = document.getElementById('setting-admin-status-badge');
    const actionsEl = document.getElementById('setting-admin-actions');
    const formEl = document.getElementById('form-change-admin-pin-container');
    const isLoggedIn = isAdminLoggedIn();

    if (statusEl) {
        statusEl.className = isLoggedIn 
            ? "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-500 border border-rose-500/30"
            : "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-[var(--border-color)]";
        statusEl.innerText = isLoggedIn ? "Mode Admin Aktif" : "Mode Pengunjung (Viewer)";
    }

    if (actionsEl) {
        if (isLoggedIn) {
            actionsEl.innerHTML = `
                <button type="button" onclick="logoutAdmin();" class="btn-esports px-4 py-2 bg-slate-800 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                    <i class="ph ph-sign-out text-base"></i> Keluar dari Mode Admin
                </button>
            `;
        } else {
            actionsEl.innerHTML = `
                <button type="button" onclick="openAdminLoginModal();" class="btn-esports px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                    <i class="ph ph-shield-check text-base"></i> Masuk Mode Admin
                </button>
            `;
        }
    }

    if (formEl) {
        formEl.classList.toggle('hidden', !isLoggedIn);
    }
}
