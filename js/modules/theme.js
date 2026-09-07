/**
 * Theme Manager for MPL Simulator
 * Supports 'dark' (Midnight Esports) and 'light' (Clean Minimalist).
 */

export function setTheme(theme) {
    const activeTheme = theme === 'light' ? 'light' : 'dark';
    document.body.classList.remove('theme-dark', 'theme-mpl');

    if (activeTheme === 'dark') {
        document.body.classList.add('theme-dark');
    }

    try {
        localStorage.setItem('mpl_sim_theme', activeTheme);
    } catch (_) {}

    updateThemeButtons(activeTheme);
    updateThemeToggleIcon(activeTheme);
}

export function toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    setTheme(isDark ? 'light' : 'dark');
}

export function applySavedTheme() {
    let saved = 'dark';
    try {
        saved = localStorage.getItem('mpl_sim_theme') || 'dark';
        if (saved === 'mpl') saved = 'dark'; // Migrate legacy 'mpl' theme to clean 'dark'
    } catch (_) {}
    setTheme(saved);
}

export function updateThemeToggleIcon(activeTheme) {
    const iconEl = document.getElementById('theme-toggle-icon');
    if (iconEl) {
        iconEl.className = activeTheme === 'dark' ? 'ph ph-sun text-lg text-amber-400' : 'ph ph-moon text-lg text-slate-600';
    }
}

export function updateThemeButtons(activeTheme) {
    const themes = ['light', 'dark'];
    themes.forEach(t => {
        const btn = document.querySelector(`.theme-btn-${t}`);
        if (btn) {
            if (t === activeTheme) {
                btn.classList.add('border-rose-500', 'bg-rose-500/10', 'text-rose-500');
            } else {
                btn.classList.remove('border-rose-500', 'bg-rose-500/10', 'text-rose-500');
            }
        }
    });
}
