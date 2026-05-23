export let activeSessionId = null;
export let activeSessionName = "";
export let sessionsList = [];
export let globalTeams = [];
export let globalMatches = [];

export function setActiveSessionId(id) { activeSessionId = id; }
export function setActiveSessionName(name) { activeSessionName = name; }
export function setSessionsList(list) { sessionsList = list; }
export function setGlobalTeams(teams) { globalTeams = teams; }
export function setGlobalMatches(matches) { globalMatches = matches; }

export function loadSessionsList() {
    const raw = localStorage.getItem('mpl_sim_sessions');
    sessionsList = raw ? JSON.parse(raw) : [];
    return sessionsList;
}

export function saveSessionsList() {
    localStorage.setItem('mpl_sim_sessions', JSON.stringify(sessionsList));
}

export function getSessionTeams(sessionId = activeSessionId) {
    return JSON.parse(localStorage.getItem('mpl_teams_' + sessionId) || '[]');
}

export function getSessionMatches(sessionId = activeSessionId) {
    return JSON.parse(localStorage.getItem('mpl_matches_' + sessionId) || '[]');
}

export function saveSessionData(teams, matches, sessionId = activeSessionId) {
    localStorage.setItem('mpl_teams_' + sessionId, JSON.stringify(teams));
    localStorage.setItem('mpl_matches_' + sessionId, JSON.stringify(matches));
}

export function exportSession(sessionId) {
    const session = sessionsList.find(s => s.id === sessionId);
    if (!session) return;

    const teams = getSessionTeams(sessionId);
    const matches = getSessionMatches(sessionId);

    const data = {
        version: "1.0",
        type: "MPL_SIM_SESSION",
        session: session,
        teams: teams,
        matches: matches
    };

    const filename = `MPLSim_${session.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    triggerDownload(data, filename);
}

function triggerDownload(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function migrateLegacyData() {
    const legacyTeams = localStorage.getItem('mpl_sim_teams');
    if (legacyTeams) {
        loadSessionsList();
        if (!sessionsList.find(s => s.id === 'legacy')) {
            const newSession = { id: 'legacy', name: 'Legacy Season', timestamp: Date.now() };
            sessionsList.push(newSession);
            saveSessionsList();
            
            localStorage.setItem('mpl_teams_legacy', legacyTeams);
            localStorage.setItem('mpl_matches_legacy', localStorage.getItem('mpl_sim_matches') || '[]');
            
            localStorage.removeItem('mpl_sim_teams');
            localStorage.removeItem('mpl_sim_matches');
        }
    }
}
