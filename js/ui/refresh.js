/**
 * Centralized application view refresh bridge.
 * Keeps mutation flows from duplicating global loader checks.
 */
let refreshGeneration = 0;
const loaders = {
    matches: null,
    standings: null,
    dashboard: null
};

export function registerViewLoaders(nextLoaders = {}) {
    Object.keys(loaders).forEach(name => {
        if (typeof nextLoaders[name] === 'function') loaders[name] = nextLoaders[name];
    });
}

export function refreshAppViews({ matches = true, standings = true, dashboard = true, standingsArgs = [] } = {}) {
    if (typeof window === 'undefined') return;
    const generation = ++refreshGeneration;
    const run = (enabled, name, args = []) => {
        const loader = loaders[name];
        if (!enabled || typeof loader !== 'function') return;
        Promise.resolve(loader(...args)).catch(error => {
            if (generation === refreshGeneration) console.warn(`View refresh failed (${name}):`, error);
        });
    };
    run(matches, 'matches');
    run(standings, 'standings', standingsArgs);
    run(dashboard, 'dashboard');
}

export function getRefreshGeneration() {
    return refreshGeneration;
}
