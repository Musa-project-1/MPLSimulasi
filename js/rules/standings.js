/**
 * Standings and Tie-Breaker Engine for MPL (Mobile Legends Professional League)
 * Conforms to official MPL Regular Season regulations:
 * 1. Match Points (Match Win - Match Lose)
 * 2. Net Game Difference (Game Win - Game Lose)
 * 3. Head-to-Head (H2H) Match Record between tied teams
 * 4. Head-to-Head (H2H) Net Game Difference between tied teams
 * 5. Total Game Wins
 * 6. Deterministic tag fallback
 */

/**
 * Extract Head-to-Head metrics between two teams from completed matches.
 */
export function getHeadToHeadRecord(teamAId, teamBId, matches = []) {
    let matchesA = 0;
    let matchesB = 0;
    let gamesA = 0;
    let gamesB = 0;

    const completed = matches.filter(m => 
        m.status === 'COMPLETED' &&
        ((m.team_a_id === teamAId && m.team_b_id === teamBId) ||
         (m.team_a_id === teamBId && m.team_b_id === teamAId))
    );

    completed.forEach(m => {
        const isTeamAFirst = m.team_a_id === teamAId;
        const scoreThisA = parseInt(isTeamAFirst ? m.score_a : m.score_b) || 0;
        const scoreThisB = parseInt(isTeamAFirst ? m.score_b : m.score_a) || 0;

        gamesA += scoreThisA;
        gamesB += scoreThisB;

        if (scoreThisA > scoreThisB) {
            matchesA += 1;
        } else if (scoreThisB > scoreThisA) {
            matchesB += 1;
        }
    });

    return {
        matchesA,
        matchesB,
        gamesA,
        gamesB,
        diffMatches: matchesA - matchesB,
        diffGames: gamesA - gamesB
    };
}

/**
 * Calculate mini-league H2H metrics for 3+ tied teams.
 */
export function getMiniLeagueH2H(teamId, tiedTeamIds = [], matches = []) {
    let matchWins = 0;
    let matchLosses = 0;
    let gameWins = 0;
    let gameLosses = 0;

    const relevantMatches = matches.filter(m =>
        m.status === 'COMPLETED' &&
        tiedTeamIds.includes(m.team_a_id) &&
        tiedTeamIds.includes(m.team_b_id) &&
        (m.team_a_id === teamId || m.team_b_id === teamId)
    );

    relevantMatches.forEach(m => {
        const isTeamA = m.team_a_id === teamId;
        const scoreMe = parseInt(isTeamA ? m.score_a : m.score_b) || 0;
        const scoreOpp = parseInt(isTeamA ? m.score_b : m.score_a) || 0;

        gameWins += scoreMe;
        gameLosses += scoreOpp;

        if (scoreMe > scoreOpp) matchWins++;
        else if (scoreOpp > scoreMe) matchLosses++;
    });

    return {
        matchDiff: matchWins - matchLosses,
        gameDiff: gameWins - gameLosses,
        gameWins
    };
}

/**
 * Recomputes team stats strictly from match history if needed,
 * or validates existing pre-computed team objects.
 */
export function recalculateTeamStatsFromMatches(teams = [], matches = []) {
    const statsMap = {};

    teams.forEach(t => {
        statsMap[t.id] = {
            ...t,
            match_played: 0,
            match_win: 0,
            match_lose: 0,
            game_win: 0,
            game_lose: 0,
            points: 0
        };
    });

    const completed = matches.filter(m => m.status === 'COMPLETED');

    completed.forEach(m => {
        const tA = statsMap[m.team_a_id];
        const tB = statsMap[m.team_b_id];
        if (!tA || !tB) return;

        const sA = parseInt(m.score_a) || 0;
        const sB = parseInt(m.score_b) || 0;

        tA.match_played += 1;
        tB.match_played += 1;

        tA.game_win += sA;
        tA.game_lose += sB;
        tB.game_win += sB;
        tB.game_lose += sA;

        if (sA > sB) {
            tA.match_win += 1;
            tB.match_lose += 1;
        } else if (sB > sA) {
            tB.match_win += 1;
            tA.match_lose += 1;
        }

        tA.points = tA.game_win - tA.game_lose;
        tB.points = tB.game_win - tB.game_lose;
    });

    return Object.values(statsMap);
}

/**
 * Calculate team's current win/loss streak from completed matches.
 */
export function calculateTeamStreak(teamId, matches = []) {
    const completed = matches
        .filter(m => m.status === 'COMPLETED' && (m.team_a_id === teamId || m.team_b_id === teamId))
        .sort((a, b) => (parseInt(b.week) - parseInt(a.week)) || (parseInt(b.day) - parseInt(a.day)) || b.id.localeCompare(a.id));

    if (completed.length === 0) return { type: 'NONE', count: 0, label: '-' };

    const firstMatch = completed[0];
    const isFirstWon = (firstMatch.team_a_id === teamId && parseInt(firstMatch.score_a) > parseInt(firstMatch.score_b)) ||
                       (firstMatch.team_b_id === teamId && parseInt(firstMatch.score_b) > parseInt(firstMatch.score_a));

    const streakType = isFirstWon ? 'W' : 'L';
    let count = 0;

    for (const m of completed) {
        const won = (m.team_a_id === teamId && parseInt(m.score_a) > parseInt(m.score_b)) ||
                    (m.team_b_id === teamId && parseInt(m.score_b) > parseInt(m.score_a));
        if ((streakType === 'W' && won) || (streakType === 'L' && !won)) {
            count++;
        } else {
            break;
        }
    }

    return { type: streakType, count, label: `${count}${streakType}` };
}

/**
 * Sort teams according to official MPL standings and tie-breaker criteria.
 */
export function calculateStandings(teams = [], matches = []) {
    const list = teams.map(t => ({
        ...t,
        match_win: parseInt(t.match_win) || 0,
        match_lose: parseInt(t.match_lose) || 0,
        game_win: parseInt(t.game_win) || 0,
        game_lose: parseInt(t.game_lose) || 0,
        points: (parseInt(t.game_win) || 0) - (parseInt(t.game_lose) || 0),
        match_diff: (parseInt(t.match_win) || 0) - (parseInt(t.match_lose) || 0),
        streak: calculateTeamStreak(t.id, matches)
    }));

    const sorted = list.sort((a, b) => {
        // 1. Match Win difference (or Match Wins)
        if (b.match_win !== a.match_win) {
            return b.match_win - a.match_win;
        }

        // 2. Net Game Difference (Game Points)
        if (b.points !== a.points) {
            return b.points - a.points;
        }

        // 3. Head to Head analysis
        if (matches && matches.length > 0) {
            const h2h = getHeadToHeadRecord(a.id, b.id, matches);
            if (h2h.diffMatches !== 0) {
                return h2h.diffMatches > 0 ? -1 : 1;
            }
            if (h2h.diffGames !== 0) {
                return h2h.diffGames > 0 ? -1 : 1;
            }
        }

        // 4. Total Game Wins
        if (b.game_win !== a.game_win) {
            return b.game_win - a.game_win;
        }

        // 5. Fallback deterministic tag
        return (a.tag || '').localeCompare(b.tag || '');
    });

    // Annotate tie-breaker reason if tied on match wins & points
    for (let i = 0; i < sorted.length; i++) {
        const curr = sorted[i];
        const next = sorted[i + 1];

        if (next && curr.match_win === next.match_win && curr.points === next.points && matches && matches.length > 0) {
            const h2h = getHeadToHeadRecord(curr.id, next.id, matches);
            if (h2h.diffMatches > 0) {
                curr.tieBreakerNote = `H2H Match (${h2h.matchesA}-${h2h.matchesB}) vs ${next.tag}`;
            } else if (h2h.diffGames > 0) {
                curr.tieBreakerNote = `H2H Games (+${h2h.diffGames}) vs ${next.tag}`;
            } else if (curr.game_win > next.game_win) {
                curr.tieBreakerNote = `Game Wins (${curr.game_win} vs ${next.game_win})`;
            }
        }
    }

    return sorted;
}

/**
 * Calculates historical standings strictly up to a given week (Week 1 through Week 9).
 * Computes rankDelta movement compared to the preceding week.
 */
export function calculateStandingsUpToWeek(teams = [], matches = [], targetWeek = 9) {
    const currentMatches = (matches || []).filter(m => 
        m.status === 'COMPLETED' && parseInt(m.week, 10) <= targetWeek
    );
    const currentStats = recalculateTeamStatsFromMatches(teams, currentMatches);
    const currentStandings = calculateStandings(currentStats, currentMatches);

    let prevRankMap = {};
    if (targetWeek > 1) {
        const prevMatches = (matches || []).filter(m => 
            m.status === 'COMPLETED' && parseInt(m.week, 10) <= (targetWeek - 1)
        );
        const prevStats = recalculateTeamStatsFromMatches(teams, prevMatches);
        const prevStandings = calculateStandings(prevStats, prevMatches);
        prevStandings.forEach((t, idx) => {
            prevRankMap[t.id] = idx + 1;
        });
    }

    return currentStandings.map((t, idx) => {
        const currentRank = idx + 1;
        const prevRank = prevRankMap[t.id] || currentRank;
        const rankDelta = prevRank - currentRank;
        return {
            ...t,
            rankDelta
        };
    });
}
