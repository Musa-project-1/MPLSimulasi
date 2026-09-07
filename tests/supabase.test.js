import { describe, it, expect, beforeEach } from 'vitest';
import * as Store from '../js/store.js';
import { 
    getSupabaseConfig, 
    saveSupabaseConfig, 
    isSupabaseConfigured,
    testSupabaseConnection,
    DEFAULT_SUPABASE_CONFIG
} from '../js/modules/supabase.js';

describe('Supabase Cloud REST Integration', () => {
    beforeEach(() => {
        Store.safeStorage.removeItem('mpl_supabase_url');
        Store.safeStorage.removeItem('mpl_supabase_key');
    });

    it('uses valid default cloud credentials when not overridden', () => {
        const config = getSupabaseConfig();
        expect(config.url).toBe(DEFAULT_SUPABASE_CONFIG.url);
        expect(isSupabaseConfigured()).toBe(true);
    });

    it('properly overrides and saves custom cloud credentials', () => {
        const testUrl = 'https://custom-demo.supabase.co';
        const testKey = 'custom-test-key-12345';

        saveSupabaseConfig(testUrl, testKey);
        expect(isSupabaseConfigured()).toBe(true);

        const config = getSupabaseConfig();
        expect(config.url).toBe(testUrl);
        expect(config.key).toBe(testKey);
    });

    it('identifies unconfigured state when custom credentials are set to empty', () => {
        saveSupabaseConfig('', '');
        expect(isSupabaseConfigured()).toBe(false);
        const config = getSupabaseConfig();
        expect(config.url).toBe('');
        expect(config.key).toBe('');
    });

    it('successfully connects to the live Supabase project', async () => {
        // Test connection against configured live project
        const result = await testSupabaseConnection();
        expect(result.success).toBe(true);
        expect(result.message).toContain('berhasil');
    });
});
