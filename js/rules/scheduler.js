/**
 * Algorithmic Round-Robin Tournament Scheduler for MPL
 * Automatically generates balanced, conflict-free 72-match Double Round-Robin
 * schedules for any season (Season 18, 19, 20, 21, etc.).
 */

/**
 * Generates an official 9-week, 72-match MPL Double Round-Robin schedule.
 * - 9 teams participate.
 * - Each team plays 16 matches (2 against each opponent, Home & Away).
 * - 8 matches per week (Day 1: 2 matches, Day 2: 3 matches, Day 3: 3 matches).
 * - Total: 72 matches over 9 weeks.
 */
export function generateMPLSchedule(teamTags = [], seasonNumber = 18) {
    const validTags = teamTags && teamTags.length >= 9
        ? teamTags.slice(0, 9)
        : ["ONIC", "BTR", "EVOS", "TLID", "AE", "DEWA", "GEEK", "NAVI", "RRQ"];

    // 9 teams + 1 phantom 'BYE' slot for standard round-robin rotation
    const n = 10;
    const rotation = [...validTags, "BYE"];

    const cycle1Matchups = [];
    const cycle2Matchups = [];

    // Cycle 1: Single Round-Robin (9 rounds)
    for (let round = 0; round < n - 1; round++) {
        const roundPairs = [];

        for (let i = 0; i < n / 2; i++) {
            const team1 = rotation[i];
            const team2 = rotation[n - 1 - i];

            if (team1 !== "BYE" && team2 !== "BYE") {
                // Alternate home and away to maintain balance
                const isEvenRound = round % 2 === 0;
                roundPairs.push({
                    teamA: isEvenRound ? team1 : team2,
                    teamB: isEvenRound ? team2 : team1
                });
            }
        }

        cycle1Matchups.push(roundPairs);

        // Standard Circle Method rotation: index 0 is fixed, rotate 1 to n-1
        const fixed = rotation[0];
        const last = rotation[n - 1];
        const rest = rotation.slice(1, n - 1);
        rotation.length = 0;
        rotation.push(fixed, last, ...rest);
    }

    // Cycle 2: Return Leg (Home and Away swapped)
    cycle1Matchups.forEach(roundPairs => {
        const swappedPairs = roundPairs.map(p => ({
            teamA: p.teamB,
            teamB: p.teamA
        }));
        cycle2Matchups.push(swappedPairs);
    });

    // Merge both cycles into a continuous 72-match pool
    const all72Matches = [];
    cycle1Matchups.forEach(round => all72Matches.push(...round));
    cycle2Matchups.forEach(round => all72Matches.push(...round));

    // Distribute into 9 weeks: 8 matches per week (Day 1: 2, Day 2: 3, Day 3: 3)
    const daysStructure = [
        { day: 1, count: 2, name: 'Hari 1 (Jumat)' },
        { day: 2, count: 3, name: 'Hari 2 (Sabtu)' },
        { day: 3, count: 3, name: 'Hari 3 (Minggu)' }
    ];

    const finalMatchups = [];
    let matchIndex = 0;

    for (let w = 1; w <= 9; w++) {
        daysStructure.forEach(d => {
            for (let m = 0; m < d.count; m++) {
                if (matchIndex < all72Matches.length) {
                    const pair = all72Matches[matchIndex];
                    finalMatchups.push({
                        week: w,
                        day: d.day,
                        teamA: pair.teamA,
                        teamB: pair.teamB
                    });
                    matchIndex++;
                }
            }
        });
    }

    return {
        key: `s${seasonNumber}`,
        name: `MPL ID Season ${seasonNumber} (9 Weeks, 72 Matches)`,
        weeks: 9,
        daysPerWeek: [
            { day: 1, name: 'Hari 1 (Jumat)', count: 2 },
            { day: 2, name: 'Hari 2 (Sabtu)', count: 3 },
            { day: 3, name: 'Hari 3 (Minggu)', count: 3 }
        ],
        matchups: finalMatchups
    };
}
