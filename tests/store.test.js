import { beforeEach, describe, expect, it } from 'vitest';
import {
    loadSessionsList,
    migrateStorageSchema,
    safeStorage,
    STORAGE_SCHEMA_VERSION
} from '../js/store.js';

describe('Persistent storage boundary', () => {
    beforeEach(() => {
        safeStorage.removeItem('mpl_sim_sessions');
        safeStorage.removeItem('mpl_storage_schema_version');
    });

    it('recovers from corrupt session JSON without throwing', () => {
        safeStorage.setItem('mpl_sim_sessions', '{not-json');
        expect(() => loadSessionsList()).not.toThrow();
        expect(loadSessionsList()).toEqual([]);
        expect(safeStorage.getItem('mpl_sim_sessions')).toBe('[]');
    });

    it('normalizes a corrupt schema version during migration', () => {
        safeStorage.setItem('mpl_storage_schema_version', 'not-a-version');
        migrateStorageSchema();
        expect(Number(safeStorage.getItem('mpl_storage_schema_version'))).toBe(STORAGE_SCHEMA_VERSION);
    });

    it('completes schema migration and remains idempotent', () => {
        safeStorage.setItem('mpl_sim_sessions', JSON.stringify([{ id: 's1', name: 'Season' }]));
        migrateStorageSchema();
        expect(Number(safeStorage.getItem('mpl_storage_schema_version'))).toBe(STORAGE_SCHEMA_VERSION);
        expect(JSON.parse(safeStorage.getItem('mpl_sim_sessions'))[0].shareKey).toBeNull();

        migrateStorageSchema();
        expect(JSON.parse(safeStorage.getItem('mpl_sim_sessions'))[0].shareKey).toBeNull();
    });
});
