/**
 * Schedule Database Admin UI Renderer
 */

import { escapeHTML } from './core.js';

export let activeAdminTemplate = 'standard';
if (typeof window !== 'undefined') {
    window.activeAdminTemplate = activeAdminTemplate;
}

export function renderDatabaseAdmin(templateKey, templateData = {}, allTeams = [], allTemplates = null) {
    activeAdminTemplate = templateKey;
    if (typeof window !== 'undefined') {
        window.activeAdminTemplate = templateKey;
    }

    // Render Dynamic Sidebar Template Navigation
    const navList = document.getElementById('admin-template-nav-list');
    if (navList && allTemplates) {
        navList.innerHTML = '';
        Object.keys(allTemplates).forEach(k => {
            const t = allTemplates[k];
            const isActive = k === templateKey;
            const btn = document.createElement('button');
            btn.className = `admin-nav-btn flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left truncate w-full ${
                isActive 
                    ? 'active bg-rose-600 text-white shadow-sm' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]'
            }`;
            btn.onclick = () => window.switchAdminTemplate(k);
            btn.innerHTML = `<i class="ph ph-calendar text-base flex-shrink-0"></i><span class="truncate">${escapeHTML(t.name || k)}</span>`;
            navList.appendChild(btn);
        });
    }

    const infoEl = document.getElementById('admin-template-info');
    if (infoEl) infoEl.innerText = templateData.name || templateKey;

    const list = document.getElementById('admin-matchup-list');
    if (!list) return;
    list.innerHTML = '';

    const matchups = templateData.matchups || [];
    matchups.forEach((m, index) => {
        list.appendChild(createMatchupRow(m, index, allTeams));
    });

    if (matchups.length === 0) {
        list.innerHTML = `
            <div class="py-12 text-center text-slate-400">
                <i class="ph ph-calendar-blank text-4xl mb-2"></i>
                <p class="text-sm font-medium">Belum ada jadwal yang diatur untuk template ini.</p>
            </div>
        `;
    }
}

export function createMatchupRow(m, index, allTeams) {
    const row = document.createElement('div');
    row.className = "flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all admin-matchup-item";
    row.dataset.index = index;

    let teamAOpts = `<option value="">-- TBD --</option>`;
    let teamBOpts = `<option value="">-- TBD --</option>`;

    allTeams.forEach(t => {
        const tag = escapeHTML(t.tag);
        const teamName = escapeHTML(t.team_name);
        teamAOpts += `<option value="${tag}" ${m.teamA === t.tag ? 'selected' : ''}>${tag} (${teamName})</option>`;
        teamBOpts += `<option value="${tag}" ${m.teamB === t.tag ? 'selected' : ''}>${tag} (${teamName})</option>`;
    });

    row.innerHTML = `
        <div class="flex flex-col gap-1">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Week</label>
            <input type="number" class="admin-input-week w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-emerald-500" value="${m.week || 1}" min="1">
        </div>
        <div class="flex flex-col gap-1">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Day</label>
            <input type="number" class="admin-input-day w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-emerald-500" value="${m.day || 1}" min="1">
        </div>
        
        <div class="flex-1 grid grid-cols-2 gap-4 items-center px-4">
            <div class="flex flex-col gap-1">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-left">Home Team</label>
                <select class="admin-input-teamA w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-emerald-500 transition cursor-pointer">
                    ${teamAOpts}
                </select>
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-left">Away Team</label>
                <select class="admin-input-teamB w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-emerald-500 transition cursor-pointer">
                    ${teamBOpts}
                </select>
            </div>
        </div>

        <button onclick="removeMatchupRow(${index})" class="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
            <i class="ph ph-trash text-lg"></i>
        </button>
    `;

    return row;
}

export function addEmptyMatchupRow(allTeams) {
    const list = document.getElementById('admin-matchup-list');
    if (!list) return;

    const index = list.querySelectorAll('.admin-matchup-item').length;
    if (list.querySelector('.py-12')) list.innerHTML = '';

    const newMatch = { week: 1, day: 1, teamA: "", teamB: "" };
    list.appendChild(createMatchupRow(newMatch, index, allTeams));

    const editor = list.parentElement;
    if (editor) editor.scrollTop = editor.scrollHeight;
}
