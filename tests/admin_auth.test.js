import { describe, it, expect, beforeEach } from 'vitest';
import { 
    authenticateAdmin, 
    isAdminLoggedIn, 
    logoutAdmin, 
    setAdminPin, 
    getAdminPin,
    resetLockout,
    DEFAULT_ADMIN_PIN 
} from '../js/modules/admin_auth.js';

describe('Admin Authentication & Security Gate', () => {
    beforeEach(() => {
        logoutAdmin();
        resetLockout();
    });

    it('defaults to not logged in', () => {
        expect(isAdminLoggedIn()).toBe(false);
    });

    it('does not grant cloud admin access from the legacy PIN', () => {
        const res = authenticateAdmin(DEFAULT_ADMIN_PIN);
        expect(res.success).toBe(true);
        expect(isAdminLoggedIn()).toBe(false);
    });

    it('rejects incorrect PIN and enforces lockout after 5 consecutive failures', () => {
        for (let i = 1; i <= 4; i++) {
            const res = authenticateAdmin('wrong_pin');
            expect(res.success).toBe(false);
            expect(res.error).toContain('Sisa kesempatan');
        }

        // 5th failure triggers lockout
        const lockoutRes = authenticateAdmin('wrong_pin');
        expect(lockoutRes.success).toBe(false);
        expect(lockoutRes.error).toContain('diblokir sementara');

        // Subsequent call is blocked by cooldown
        const blockedRes = authenticateAdmin(DEFAULT_ADMIN_PIN);
        expect(blockedRes.success).toBe(false);
        expect(blockedRes.error).toContain('diblokir');
    });

    it('supports changing the Admin PIN with old PIN verification', () => {
        const newPin = 'superSecret2026';
        const changeRes = setAdminPin(DEFAULT_ADMIN_PIN, newPin);
        expect(changeRes.success).toBe(true);
        expect(getAdminPin()).toBe(newPin);

        // Authenticate with new PIN
        const authNew = authenticateAdmin(newPin);
        expect(authNew.success).toBe(true);

        // Revert back
        setAdminPin(newPin, DEFAULT_ADMIN_PIN);
    });

    it('clears Supabase authentication state upon logout', async () => {
        globalThis.sessionStorage = {
            value: JSON.stringify({ access_token: 'token', user: { app_metadata: { role: 'admin' } } }),
            getItem() { return this.value; },
            setItem(_, value) { this.value = value; },
            removeItem() { this.value = null; }
        };
        expect(isAdminLoggedIn()).toBe(true);

        logoutAdmin();
        expect(isAdminLoggedIn()).toBe(false);
    });
});
