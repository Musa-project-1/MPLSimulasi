/**
 * Supabase Cloud REST Client (PostgREST)
 * Zero-server cloud persistence using native fetch.
 */

import * as Store from '../store.js';
import { showToast } from '../ui/core.js';

export const DEFAULT_SUPABASE_CONFIG = {
    url: 'https://qoykklpeitycbrbzmkcg.supabase.co',
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveWtrbHBlaXR5Y2JyYnpta2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTA3NTUsImV4cCI6MjEwNDM2Njc1NX0._hBFXlNwdBqnbD_-z1gt4YAgm4lh2OGmkZjf5snKJbY"
};

export function getSupabaseConfig() {
    const customUrl = Store.safeStorage.getItem('mpl_supabase_url');
    const customKey = Store.safeStorage.getItem('mpl_supabase_key');

    const url = (customUrl !== null ? customUrl : DEFAULT_SUPABASE_CONFIG.url || '').trim();
    const key = (customKey !== null ? customKey : DEFAULT_SUPABASE_CONFIG.key || '').trim();
    return { url, key };
}

export function saveSupabaseConfig(url, key) {
    Store.safeStorage.setItem('mpl_supabase_url', (url || '').trim());
    Store.safeStorage.setItem('mpl_supabase_key', (key || '').trim());
}

const AUTH_SESSION_KEY = 'mpl_supabase_auth_session';

function getAuthSession() {
    try {
        const raw = typeof sessionStorage !== 'undefined'
            ? sessionStorage.getItem(AUTH_SESSION_KEY)
            : null;
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

function saveAuthSession(session) {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function getAuthAccessToken() {
    return getAuthSession()?.access_token || null;
}

export function isSupabaseAuthAdmin() {
    return getAuthSession()?.user?.app_metadata?.role === 'admin';
}

export async function signInWithPassword(email, password) {
    const { url, key } = getSupabaseConfig();
    if (!url || !key) return { success: false, error: 'Supabase belum dikonfigurasi.' };
    if (!email?.trim() || !password) return { success: false, error: 'Email dan password wajib diisi.' };

    try {
        const authUrl = `${url}/auth/v1/token?grant_type=password`;
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: { apikey: key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return { success: false, error: 'Login Supabase gagal.' };
        if (data.user?.app_metadata?.role !== 'admin') {
            return { success: false, error: 'Akun ini bukan admin.' };
        }
        saveAuthSession(data);
        return { success: true, user: data.user };
    } catch (_) {
        return { success: false, error: 'Tidak dapat menghubungi Supabase Auth.' };
    }
}

export function signOutSupabase() {
    try {
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch (_) {}
}

export async function adminMutation(action, payload) {
    const { url, key } = getSupabaseConfig();
    const token = getAuthAccessToken();
    if (!url || !key) throw new Error('Supabase belum dikonfigurasi.');
    if (!token || !isSupabaseAuthAdmin()) throw new Error('Sesi admin Supabase belum aktif.');

    const functionUrl = `${url}/functions/v1/admin-mutate`;
    const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
            apikey: key,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, payload })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Admin mutation gagal.');
    return data;
}

export function isSupabaseConfigured() {
    const { url, key } = getSupabaseConfig();
    return Boolean(url && key && url.startsWith('http'));
}

export async function supabaseRequest(endpoint, method = 'GET', body = null, prefer = '') {
    const { url, key } = getSupabaseConfig();
    if (!url || !key) {
        throw new Error("Kredensial Supabase belum dikonfigurasi.");
    }

    const cleanBase = url.replace(/\/+$/, '');
    const targetUrl = `${cleanBase}/rest/v1/${endpoint}`;

    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
    };

    if (prefer) {
        headers['Prefer'] = prefer;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const options = {
            method,
            headers,
            signal: controller.signal
        };
        if (body && method !== 'GET' && method !== 'HEAD') {
            options.body = JSON.stringify(body);
        }

        const res = await fetch(targetUrl, options);
        clearTimeout(timeout);

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`Supabase Error ${res.status}: ${errText || res.statusText}`);
        }

        if (res.status === 204) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

export async function testSupabaseConnection() {
    try {
        if (!isSupabaseConfigured()) {
            return { success: false, message: "URL dan Anon Key Supabase belum diisi." };
        }
        const data = await supabaseRequest('sessions?select=id&limit=1', 'GET');
        return { success: true, message: "Koneksi ke Supabase Cloud berhasil!", data };
    } catch (err) {
        return { success: false, message: err.message || "Gagal menghubungi Supabase." };
    }
}

/**
 * Super-Economical TTL Cache Strategy (15 Minutes Default)
 * Prevents redundant Supabase read API calls when local cache is fresh.
 */
export function isCacheFresh(cacheKey, ttlMinutes = 15) {
    try {
        const raw = safeStorage.getItem(`mpl_ttl_${cacheKey}`);
        if (!raw) return false;
        const timestamp = parseInt(raw, 10);
        if (isNaN(timestamp)) return false;
        return (Date.now() - timestamp) < (ttlMinutes * 60 * 1000);
    } catch (_) {
        return false;
    }
}

export function touchCache(cacheKey) {
    try {
        safeStorage.setItem(`mpl_ttl_${cacheKey}`, Date.now().toString());
    } catch (_) {}
}
