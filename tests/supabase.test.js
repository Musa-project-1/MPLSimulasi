import { describe, it, expect, beforeEach } from 'vitest';
import { 
    getSupabaseConfig, 
    saveSupabaseConfig, 
    isSupabaseConfigured,
    testSupabaseConnection 
} from '../js/modules/supabase.js';

describe('Supabase Cloud REST Integration', () => {
    beforeEach(() => {
        saveSupabaseConfig('', '');
    });

    it('identifies unconfigured state when credentials are empty', () => {
        expect(isSupabaseConfigured()).toBe(false);
        const config = getSupabaseConfig();
        expect(config.url).toBe('');
        expect(config.key).toBe('');
    });

    it('properly saves and validates configured state', () => {
        const testUrl = 'https://mplsim-demo.supabase.co';
        const testKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key';

        saveSupabaseConfig(testUrl, testKey);
        expect(isSupabaseConfigured()).toBe(true);

        const config = getSupabaseConfig();
        expect(config.url).toBe(testUrl);
        expect(config.key).toBe(testKey);
    });

    it('returns clean error message when testing unconfigured credentials', async () => {
        const result = await testSupabaseConnection();
        expect(result.success).toBe(false);
        expect(result.message).toContain('belum diisi');
    });
});
