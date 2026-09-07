/**
 * Schedule Database Admin & Template Configuration
 */

import * as Config from '../config.js';
import { openModal, closeModal, customAlert } from '../ui/core.js';
import { renderDatabaseAdmin, addEmptyMatchupRow } from '../ui/admin.js';

export function getScheduleDatabase() {
    try {
        const custom = localStorage.getItem('mpl_custom_schedule_db');
        if (custom) return JSON.parse(custom);
    } catch (_) {}
    return Config.SCHEDULE_TEMPLATES;
}

export function openDatabaseAdmin() {
    closeModal('modal-settings');
    const db = getScheduleDatabase();
    const allTeams = Config.getInitialMockTeams();
    const activeKey = window.activeAdminTemplate || 'standard';
    renderDatabaseAdmin(activeKey, db[activeKey], allTeams);
    openModal('modal-database-admin');
}

export function switchAdminTemplate(key) {
    const db = getScheduleDatabase();
    const allTeams = Config.getInitialMockTeams();
    renderDatabaseAdmin(key, db[key], allTeams);
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
        const week = parseInt(row.querySelector('.admin-input-week')?.value) || 1;
        const day = parseInt(row.querySelector('.admin-input-day')?.value) || 1;
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

    customAlert("Database Jadwal berhasil diperbarui!");
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
    customAlert(`Template ${templateKey} telah direset ke setelan pabrik.`);
}
