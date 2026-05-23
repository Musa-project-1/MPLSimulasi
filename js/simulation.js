import { activeSessionId, getSessionMatches } from './store.js';

export async function runSimulation(teams) {
    return new Promise((resolve) => {
        const settings = JSON.parse(localStorage.getItem('mpl_settings_' + activeSessionId) || '{"volatility":50,"h2hBias":false,"momentum":true}');
        const allMatches = getSessionMatches();
        
        const worker = new Worker('js/simulation.worker.js');
        
        worker.onmessage = function(e) {
            resolve(e.data);
            worker.terminate();
        };

        worker.postMessage({
            teams,
            allMatches,
            settings
        });
    });
}
