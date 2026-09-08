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
