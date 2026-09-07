/**
 * Dedicated Web Worker for Monte Carlo Simulation (30,000 iterations)
 */

onmessage = function(e) {
    const { teams, allMatches, settings } = e.data;
    const ITERATIONS = 30000;
    const scheduledMatches = (allMatches || []).filter(m => m.status === 'SCHEDULED');
    const completedMatches = (allMatches || []).filter(m => m.status === 'COMPLETED');

    const RIVALRIES = [
        { teams: ["RRQ", "EVOS"], intensity: 1.2 },
        { teams: ["ONIC", "BTR"], intensity: 1.15 },
        { teams: ["AE", "GEEK"], intensity: 1.1 }
    ];

    const teamBaseStats = {};
    const h2hCache = {};

    teams.forEach(t => {
        let wr = (parseInt(t.match_win) + 1) / (parseInt(t.match_played) + 2 || 2);
        
        if (settings.momentum) {
            const teamMatches = completedMatches
                .filter(m => (m.team_a_id === t.id || m.team_b_id === t.id))
                .sort((a, b) => b.id.localeCompare(a.id))
                .slice(0, 3);
            const winStreak = teamMatches.filter(m => 
                (m.team_a_id === t.id && m.score_a > m.score_b) || 
                (m.team_b_id === t.id && m.score_b > m.score_a)
            ).length;
            if (winStreak === 3) wr += 0.05;
        }

        teamBaseStats[t.id] = {
            id: t.id,
            tag: t.tag,
            wr: wr,
            match_win: parseInt(t.match_win) || 0,
            points: parseInt(t.points) || 0,
            last_match_day: 0
        };
    });

    if (settings.h2hBias) {
        completedMatches.forEach(m => {
            const key = m.team_a_id < m.team_b_id ? `${m.team_a_id}_${m.team_b_id}` : `${m.team_b_id}_${m.team_a_id}`;
            if (!h2hCache[key]) h2hCache[key] = { [m.team_a_id]: 0, [m.team_b_id]: 0 };
            const winnerId = m.score_a > m.score_b ? m.team_a_id : m.team_b_id;
            h2hCache[key][winnerId]++;
        });
    }

    const simResults = {};
    teams.forEach(t => {
        simResults[t.id] = { upper: 0, playoff: 0, elim: 0 };
    });

    for (let i = 0; i < ITERATIONS; i++) {
        const iterTeams = {};
        for (const id in teamBaseStats) {
            iterTeams[id] = { ...teamBaseStats[id], fatigue: 0 };
        }

        scheduledMatches.forEach(m => {
            const tA = iterTeams[m.team_a_id];
            const tB = iterTeams[m.team_b_id];
            if (!tA || !tB) return;

            if (settings.fatigue) {
                const currentDay = (m.week - 1) * 7 + (m.day || 1);
                [tA, tB].forEach(t => {
                    if (t.last_match_day === currentDay - 1) t.fatigue += 15;
                    else if (t.last_match_day < currentDay - 2) t.fatigue = Math.max(0, t.fatigue - 10);
                    t.last_match_day = currentDay;
                });
            }

            let probA = tA.wr / (tA.wr + tB.wr || 1);

            if (settings.rivalry) {
                const rivalry = RIVALRIES.find(r => 
                    (r.teams.includes(tA.tag) && r.teams.includes(tB.tag))
                );
                if (rivalry) {
                    const isUnderdogA = probA < 0.5;
                    const boost = (rivalry.intensity - 1) * 0.5;
                    probA = isUnderdogA ? (probA + boost) : (probA - boost);
                }
            }

            if (settings.h2hBias) {
                const key = m.team_a_id < m.team_b_id ? `${m.team_a_id}_${m.team_b_id}` : `${m.team_b_id}_${m.team_a_id}`;
                const h2h = h2hCache[key];
                if (h2h) {
                    const winA = h2h[m.team_a_id] || 0;
                    const winB = h2h[m.team_b_id] || 0;
                    if (winA + winB > 0) {
                        const h2hProbA = winA / (winA + winB);
                        probA = (probA * 0.7) + (h2hProbA * 0.3);
                    }
                }
            }

            if (settings.fatigue) {
                const penaltyA = (tA.fatigue / 100) * 0.1;
                const penaltyB = (tB.fatigue / 100) * 0.1;
                probA = probA - penaltyA + penaltyB;
            }

            const volFactor = (settings.volatility || 50) / 100;
            probA = Math.max(0.1, Math.min(0.9, (probA * (1 - volFactor)) + (0.5 * volFactor)));

            if (Math.random() < probA) {
                tA.match_win++;
                tA.points += (Math.random() > 0.5 ? 2 : 1);
            } else {
                tB.match_win++;
                tB.points += (Math.random() > 0.5 ? 2 : 1);
            }
        });

        const simStandings = Object.values(iterTeams).sort((a, b) => {
            if (b.match_win !== a.match_win) return b.match_win - a.match_win;
            return b.points - a.points;
        });
        
        simStandings.forEach((st, index) => {
            if (index < 2) simResults[st.id].upper++;
            if (index < 6) simResults[st.id].playoff++;
            if (index >= 6) simResults[st.id].elim++;
        });
    }

    const results = teams.map(t => {
        const upper = (simResults[t.id].upper / ITERATIONS) * 100;
        const playoff = (simResults[t.id].playoff / ITERATIONS) * 100;
        const elim = (simResults[t.id].elim / ITERATIONS) * 100;
        return {
            ...t,
            prob_upper: upper.toFixed(2) + '%',
            prob_playoff: playoff.toFixed(2) + '%',
            prob_playin: Math.max(0, playoff - upper).toFixed(2) + '%',
            prob_elim: elim.toFixed(2) + '%'
        };
    });

    postMessage(results);
};
