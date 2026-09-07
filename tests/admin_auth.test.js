import { describe, it, expect, beforeEach } from 'vitest';
import { 
    authenticateAdmin, 
    isAdminLoggedIn, 
    logoutAdmin, 
    setAdminPin, 
    getAdminPin,
    DEFAULT_ADMIN_PIN 
} from '../js/modules/admin_auth.js';

describe('Admin Authentication & Security Gate', () => {
    beforeEach(() => {
        logoutAdmin();
    });

    it('defaults to not logged in', () => {
        expect(isAdminLoggedIn()).toBe(false);
    });

    it('successfully authenticates with the master default PIN', () => {
        const res = authenticateAdmin(DEFAULT_ADMIN_PIN);
        expect(res.success).toBe(true);
        expect(isAdminLoggedIn()).toBe(true);
    });

    it('rejects incorrect PIN and maintains unauthenticated state', () => {
        const res = authenticateAdmin('wrong_password');
        expect(res.success).toBe(false);
        expect(res.error).toContain('salah');
        expect(isAdminLoggedIn()).toBe(false);
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

    it('clears authentication state upon logout', () => {
        authenticateAdmin(DEFAULT_ADMIN_PIN);
        expect(isAdminLoggedIn()).toBe(true);

        logoutAdmin();
        expect(isAdminLoggedIn()).toBe(false);
    });
});
