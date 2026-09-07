/**
 * Schedule Database Admin & Template Configuration
 * Supports local customization and multi-user Supabase Cloud Master Schedule sync.
 */

import * as Config from '../config.js';
import { openModal, closeModal, customAlert, showToast, showLoading } from '../ui/core.js';
import { renderDatabaseAdmin, addEmptyMatchupRow } from '../ui/admin.js';
import { isSupabaseConfigured, supabaseRequest } from './supabase.js';

export function getScheduleDatabase() {
    try {
        const custom = localStorage.getItem('mpl_custom_schedule_db');
        if (custom) return JSON.parse(custom);
    } catch (_) {}
    return Config.SCHEDULE_TEMPLATES;
}

export async function syncScheduleTemplatesFromCloud() {
    if (!isSupabaseConfigured()) return;
    try {
        const rows = await supabaseRequest('schedule_templates?id=eq.master_s18&limit=1', 'GET');
        if (rows && rows[0] && rows[0].templates_data) {
            localStorage.setItem('mpl_custom_schedule_db', JSON.stringify(rows[0].templates_data));
        }
    } catch (err) {
        console.warn('Gagal sinkronisasi master jadwal dari cloud:', err);
    }
}

export async function pushScheduleTemplatesToCloud() {
    if (!isSupabaseConfigured()) {
        showToast("Supabase Cloud belum dikonfigurasi.", "warning");
        return;
    }
    showLoading(true);
    try {
        const db = getScheduleDatabase();
        await supabaseRequest('schedule_templates', 'POST', [{
            id: 'master_s18',
            templates_data: db,
            updated_at: new Date().toISOString()
        }], 'resolution=merge-duplicates');
        showToast("Master jadwal berhasil di-push ke Cloud untuk semua user!", "success");
    } catch (err) {
        showToast("Gagal push jadwal ke Cloud: " + err.message, "error");
    } finally {
        showLoading(false);
    }
}

export async function pullScheduleTemplatesFromCloud() {
    if (!isSupabaseConfigured()) {
        showToast("Supabase Cloud belum dikonfigurasi.", "warning");
        return;
    }
    showLoading(true);
    try {
        const rows = await supabaseRequest('schedule_templates?id=eq.master_s18&limit=1', 'GET');
        if (rows && rows[0] && rows[0].templates_data) {
            localStorage.setItem('mpl_custom_schedule_db', JSON.stringify(rows[0].templates_data));
            const templateKey = window.activeAdminTemplate || 'standard';
            const allTeams = Config.getInitialMockTeams();
            renderDatabaseAdmin(templateKey, rows[0].templates_data[templateKey] || rows[0].templates_data['standard'], allTeams);
            showToast("Jadwal Season 18 terbaru berhasil ditarik dari Cloud!", "success");
        } else {
            showToast("Belum ada master jadwal di Cloud. Silakan simpan jadwal terlebih dahulu.", "info");
        }
    } catch (err) {
        showToast("Gagal tarik jadwal dari Cloud: " + err.message, "error");
    } finally {
        showLoading(false);
    }
}

export function openDatabaseAdmin() {
    closeModal('modal-settings');
    const db = getScheduleDatabase();
    const allTeams = Config.getInitialMockTeams();
    const activeKey = window.activeAdminTemplate || 'standard';
    renderDatabaseAdmin(activeKey, db[activeKey] || db['standard'], allTeams, db);
    openModal('modal-database-admin');
}

export function switchAdminTemplate(key) {
    const db = getScheduleDatabase();
    const allTeams = Config.getInitialMockTeams();
    renderDatabaseAdmin(key, db[key], allTeams, db);
}

export async function promptCreateNewSeason() {
    if (typeof window === 'undefined' || !window.prompt) return;
    const raw = window.prompt("Masukkan nomor musim baru MPL (contoh: 19, 20, 21):", "19");
    if (!raw) return;

    const seasonNum = parseInt(raw.trim(), 10);
    if (isNaN(seasonNum) || seasonNum < 1 || seasonNum > 99) {
        showToast("Nomor musim harus berupa angka antara 1 sampai 99.", "warning");
        return;
    }

    const { generateMPLSchedule } = await import('../rules/scheduler.js');
    const allTeams = Config.getInitialMockTeams();
    const teamTags = allTeams.map(t => t.tag);

    const newSeason = generateMPLSchedule(teamTags, seasonNum);
    const db = getScheduleDatabase();

    db[newSeason.key] = newSeason;

    try {
        localStorage.setItem('mpl_custom_schedule_db', JSON.stringify(db));
    } catch (_) {}

    window.activeAdminTemplate = newSeason.key;
    renderDatabaseAdmin(newSeason.key, newSeason, allTeams, db);

    if (isSupabaseConfigured()) {
        await pushScheduleTemplatesToCloud();
    }

    showToast(`Jadwal Season ${seasonNum} (72 Match) berhasil dibuat otomatis & disinkronkan ke Cloud!`, "success");
}

export function addNewMatchupRow() {
    const allTeams = Config.getInitialMockTeams();
    addEmptyMatchupRow(allTeams);
}

export function removeMatchupRow(index) {
    const rows = document.querySelectorAll('.admin-matchup-item');
    if (rows[index]) {
        rows[index].remove();
    }
}

export function saveScheduleDatabase() {
    const templateKey = window.activeAdminTemplate || 'standard';
    const db = getScheduleDatabase();

    const matchupRows = document.querySelectorAll('.admin-matchup-item');
    const newMatchups = [];

    matchupRows.forEach(row => {
        const week = parseInt(row.querySelector('.admin-input-week')?.value, 10) || 1;
        const day = parseInt(row.querySelector('.admin-input-day')?.value, 10) || 1;
        const teamA = row.querySelector('.admin-input-teamA')?.value || '';
        const teamB = row.querySelector('.admin-input-teamB')?.value || '';

        if (teamA || teamB) {
            newMatchups.push({ week, day, teamA, teamB });
        }
    });

    newMatchups.sort((a, b) => (a.week - b.week) || (a.day - b.day));

    if (!db[templateKey]) {
        db[templateKey] = { name: templateKey, weeks: 9, daysPerWeek: [], matchups: [] };
    }
    db[templateKey].matchups = newMatchups;

    try {
        localStorage.setItem('mpl_custom_schedule_db', JSON.stringify(db));
    } catch (_) {}

    if (isSupabaseConfigured()) {
        pushScheduleTemplatesToCloud().catch(err => console.warn('Auto-push template to cloud failed:', err));
    } else {
        showToast("Database Jadwal berhasil diperbarui secara lokal!", "success");
    }

    closeModal('modal-database-admin');
}

export function resetTemplateToDefault() {
    const templateKey = window.activeAdminTemplate || 'standard';
    const db = getScheduleDatabase();

    db[templateKey] = JSON.parse(JSON.stringify(Config.SCHEDULE_TEMPLATES[templateKey]));
    try {
        localStorage.setItem('mpl_custom_schedule_db', JSON.stringify(db));
    } catch (_) {}

    const allTeams = Config.getInitialMockTeams();
    renderDatabaseAdmin(templateKey, db[templateKey], allTeams);
    showToast(`Template ${templateKey} telah direset ke setelan pabrik.`, "info");
}
