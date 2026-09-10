/**
 * Modul Tampilan Session Manager (Landing Hub)
 * Batas: <450 baris
 */

import { formatDateIndo } from './components.js';

export function renderSessionList(sessionsList, activeSessionId) {
    const listEl = document.getElementById('session-list');
    if (!listEl) return;

    if (!sessionsList || sessionsList.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-12 px-6 border border-dashed border-slate-700/80 rounded-2xl bg-slate-900/30">
                <div class="w-12 h-12 mx-auto mb-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <svg class="ph-icon text-2xl" aria-hidden="true"><use href="icons/sprite.svg#ph-folder-dashed"/></svg>
                </div>
                <h3 class="text-base font-bold text-slate-200 mb-1">Belum Ada Sesi Simulasi</h3>
                <p class="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                    Mulai petualangan simulasi turnamen MPL Anda dengan membuat sesi musim baru atau mengimpor data sesi sebelumnya.
                </p>
                <button onclick="openCreateSessionModal()" class="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-rose-600/20">
                    <svg class="ph-icon text-base" aria-hidden="true"><use href="icons/sprite.svg#ph-plus-circle"/></svg> Buat Sesi Baru
                </button>
            </div>
        `;
        return;
    }

    const sorted = [...sessionsList].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    let html = '';
    sorted.forEach(session => {
        const isActive = session.id === activeSessionId;
        const dateStr = formatDateIndo(session.timestamp);

        // Ambil data progres jika ada di localStorage
        const rawMatches = localStorage.getItem('mpl_matches_' + session.id);
        let progressStr = '0 Match';
        let progressPct = 0;
        if (rawMatches) {
            try {
                const matches = JSON.parse(rawMatches);
                const comp = matches.filter(m => m.status === 'COMPLETED').length;
                const tot = matches.length;
                progressPct = tot > 0 ? Math.round((comp / tot) * 100) : 0;
                progressStr = `${comp}/${tot} Selesai (${progressPct}%)`;
            } catch (e) {
                // Ignore
            }
        }

        html += `
            <div class="session-card group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/30 transition-all duration-200 gap-4 shadow-sm hover:shadow-md">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600/20 to-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 font-oswald text-lg font-bold flex-shrink-0">
                        ${session.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <h3 class="text-base font-bold text-slate-100 group-hover:text-rose-400 transition-colors">
                                ${session.name}
                            </h3>
                            ${isActive ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Aktif</span>' : ''}
                        </div>
                        <div class="flex items-center gap-3 text-xs text-slate-400">
                            <span class="flex items-center gap-1"><svg class="ph-icon text-slate-500" aria-hidden="true"><use href="icons/sprite.svg#ph-calendar"/></svg> ${dateStr}</span>
                            <span class="text-slate-600">·</span>
                            <span class="flex items-center gap-1 font-mono text-[11px] text-slate-300"><svg class="ph-icon text-rose-400" aria-hidden="true"><use href="icons/sprite.svg#ph-chart-line-up"/></svg> ${progressStr}</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 self-end sm:self-center">
                    <button onclick="exportSpecificSession('${session.id}')" title="Ekspor Cadangan JSON" class="btn-icon p-2.5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition">
                        <svg class="ph-icon text-lg" aria-hidden="true"><use href="icons/sprite.svg#ph-file-arrow-down"/></svg>
                    </button>
                    <button onclick="confirmDeleteSession('${session.id}', '${session.name.replace(/'/g, "\\'")}')" title="Hapus Sesi" class="btn-icon p-2.5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-rose-950/40 hover:border-rose-800/60 text-slate-400 hover:text-rose-300 transition">
                        <svg class="ph-icon text-lg" aria-hidden="true"><use href="icons/sprite.svg#ph-trash"/></svg>
                    </button>
                    <button onclick="openSession('${session.id}')" class="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-rose-600/10">
                        <span>Buka</span>
                        <svg class="ph-icon font-bold" aria-hidden="true"><use href="icons/sprite.svg#ph-arrow-right"/></svg>
                    </button>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;
}
