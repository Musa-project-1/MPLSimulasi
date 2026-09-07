/**
 * Dashboard UI Component
 * Renders progress bar, upcoming matches list, top team spotlight, and points chart.
 */

import { globalTeams } from '../store.js';
import { getTeamLogo } from './core.js';

let chartInstance = null;

export function renderChart(topTeams = []) {
    const canvas = document.getElementById('winRateChart');
    if (!canvas) return;

    if (typeof Chart === 'undefined') {
        const container = canvas.parentElement;
        if (container && topTeams && topTeams.length > 0) {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center p-6">
                    <i class="ph ph-chart-bar text-3xl mb-2 text-rose-500"></i>
                    <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Statistik Poin Teratas</p>
                    <div class="flex flex-wrap justify-center gap-2 mt-3">
                        ${topTeams.slice(0, 5).map(t => `<span class="px-3 py-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-bold text-rose-500">${t.tag}: ${t.points} Pts</span>`).join('')}
                    </div>
                </div>
            `;
        }
        return;
    }

    const ctx = canvas.getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#E11D48');
    gradient.addColorStop(1, '#BE123C');

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topTeams.map(t => t.tag),
            datasets: [{
                label: 'Points',
                data: topTeams.map(t => t.points),
                backgroundColor: gradient,
                hoverBackgroundColor: '#9F1239',
                borderRadius: 8,
                barThickness: 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleFont: { family: 'Oswald', size: 14 },
                    bodyFont: { family: 'Inter', size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', weight: 'bold' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Oswald', size: 12 } }
                }
            }
        }
    });
}

export function loadDashboard(data) {
    if (!data) return;

    // 1. Progress Bar Update
    const progressPct = data.total_matches > 0 ? Math.round((data.completed_matches / data.total_matches) * 100) : 0;
    const bar = document.getElementById('dash-progress-bar');
    if (bar) bar.style.width = `${progressPct}%`;
    const text = document.getElementById('dash-progress-text');
    if (text) text.innerText = `${data.completed_matches} / ${data.total_matches} Match (${progressPct}%)`;

    // 2. Upcoming Matches Update
    const upcomingContainer = document.getElementById('dash-upcoming-list');
    if (upcomingContainer) {
        upcomingContainer.innerHTML = '';
        if (data.upcoming_matches && data.upcoming_matches.length > 0) {
            data.upcoming_matches.forEach(m => {
                const tA = globalTeams.find(t => t.id === m.team_a_id) || { tag: 'TBD' };
                const tB = globalTeams.find(t => t.id === m.team_b_id) || { tag: 'TBD' };

                upcomingContainer.innerHTML += `
                    <div class="flex items-center justify-between p-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-secondary)] transition-all cursor-default group">
                        <div class="flex items-center gap-4 flex-1">
                            <div class="flex flex-col items-end w-1/3">
                                <span class="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--mpl-red)] transition-colors">${tA.tag}</span>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] group-hover:bg-[var(--mpl-red)] group-hover:text-white transition-all">VS</div>
                            <div class="flex flex-col items-start w-1/3">
                                <span class="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--mpl-red)] transition-colors">${tB.tag}</span>
                            </div>
                        </div>
                        <div class="w-20 text-right">
                            <span class="text-[10px] font-bold text-[var(--mpl-red)] bg-[var(--mpl-red-glow)] border border-[var(--mpl-red)]/20 px-2 py-1 rounded-full uppercase tracking-tighter">Week ${m.week}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            upcomingContainer.innerHTML = `<p class="text-sm text-slate-500 italic p-6 text-center">Semua pertandingan reguler telah selesai disimulasikan!</p>`;
        }
    }

    // 3. Top Team Spotlight
    const topTeam = data.top_teams?.[0];
    const topName = document.getElementById('top-team-name');
    const topLogo = document.getElementById('top-team-logo');
    const topPoints = document.getElementById('top-team-points');

    if (topTeam) {
        if (topName) topName.innerText = topTeam.team_name;
        if (topLogo) topLogo.innerHTML = getTeamLogo(topTeam.tag, "w-16 h-16 drop-shadow-md transform hover:scale-110 transition-transform duration-500");
        if (topPoints) topPoints.innerText = topTeam.points;
    } else {
        if (topName) topName.innerText = "Belum Ada";
        if (topLogo) topLogo.innerHTML = "?";
        if (topPoints) topPoints.innerText = "0";
    }

    renderChart(data.top_teams || []);
}
