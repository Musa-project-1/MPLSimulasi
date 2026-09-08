import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    adminMutation,
    getAuthAccessToken,
    isSupabaseAuthAdmin,
    signInWithPassword,
    signOutSupabase
} from '../js/modules/supabase.js';

const storage = new Map();

beforeEach(() => {
    storage.clear();
    globalThis.sessionStorage = {
        getItem: (key) => storage.get(key) || null,
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: (key) => storage.delete(key)
    };
    vi.restoreAllMocks();
});

describe('Supabase Auth admin boundary', () => {
    it('stores an admin Auth session and exposes its access token', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                access_token: 'access-token',
                refresh_token: 'refresh-token',
                user: { app_metadata: { role: 'admin' } }
            })
        }));

        const result = await signInWithPassword('admin@example.com', 'secret');

        expect(result.success).toBe(true);
        expect(getAuthAccessToken()).toBe('access-token');
        expect(isSupabaseAuthAdmin()).toBe(true);
    });

    it('rejects a valid Auth user without the admin role', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                access_token: 'user-token',
                refresh_token: 'refresh-token',
                user: { app_metadata: { role: 'user' } }
            })
        }));

        const result = await signInWithPassword('user@example.com', 'secret');

        expect(result.success).toBe(false);
        expect(getAuthAccessToken()).toBeNull();
        expect(isSupabaseAuthAdmin()).toBe(false);
    });

    it('sends official mutations to the Edge Function with the Auth bearer token', async () => {
        storage.set('mpl_supabase_auth_session', JSON.stringify({
            access_token: 'admin-token',
            user: { app_metadata: { role: 'admin' } }
        }));
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true, id: 'master_s18' })
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await adminMutation('upsert_schedule', {
            id: 'master_s18',
            templates_data: { standard: {} }
        });

        expect(result.ok).toBe(true);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/functions/v1/admin-mutate'),
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer admin-token' })
            })
        );
    });

    it('clears the Auth session on logout', () => {
        storage.set('mpl_supabase_auth_session', JSON.stringify({ access_token: 'token' }));
        signOutSupabase();
        expect(getAuthAccessToken()).toBeNull();
    });
});
