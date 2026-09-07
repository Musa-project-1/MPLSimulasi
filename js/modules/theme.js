/**
 * Theme Manager for MPL Simulator
 * Supports 'light' (soft minimalist), 'dark' (midnight), and 'mpl' (onyx crimson).
 */

export function setTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-mpl');
    if (theme === 'dark') document.body.classList.add('theme-dark');
    if (theme === 'mpl') document.body.classList.add('theme-mpl');

    try {
        localStorage.setItem('mpl_sim_theme', theme);
    } catch (_) {}

    updateThemeButtons(theme);
}

export function applySavedTheme() {
    let saved = 'mpl';
    try {
        saved = localStorage.getItem('mpl_sim_theme') || 'mpl';
    } catch (_) {}
    setTheme(saved);
}

export function updateThemeButtons(activeTheme) {
    const themes = ['light', 'dark', 'mpl'];
    themes.forEach(t => {
        const btn = document.querySelector(`.theme-btn-${t}`);
        if (btn) {
            if (t === activeTheme) {
                btn.classList.add('border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
            } else {
                btn.classList.remove('border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
            }
        }
    });
}
