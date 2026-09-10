/**
 * Modul Bagan Playoff Hybrid Resmi MPL Indonesia
 * Batas: <450 baris
 */

/**
 * Menginisialisasi bagan Playoff Hybrid (Top 6) atau Top 4
 */
export function initializePlayoffBracket(standings) {
    const teams = standings || [];
    const totalTeams = teams.length;

    if (totalTeams >= 6) {
        const top6 = teams.slice(0, 6);
        return {
            format: "hybrid_top6",
            rounds: [
                {
                    id: "play_in",
                    name: "Play-ins (Round 1)",
                    matches: [
                        {
                            id: "p1",
                            name: "Match 1",
                            teamA: top6[2],
                            teamB: top6[5],
                            scoreA: "",
                            scoreB: "",
                            winner: null,
                            loser: null,
                            targetWin: 3,
                            nextWinMatch: "p3",
                            nextWinSlot: "B"
                        },
                        {
                            id: "p2",
                            name: "Match 2",
                            teamA: top6[3],
                            teamB: top6[4],
                            scoreA: "",
                            scoreB: "",
                            winner: null,
                            loser: null,
                            targetWin: 3,
                            nextWinMatch: "p4",
                            nextWinSlot: "B"
                        }
                    ]
                },
                {
                    id: "upper_semis",
                    name: "Upper Semifinals",
                    matches: [
                        {
                            id: "p3",
                            name: "Match 3",
                            teamA: top6[0],
                            teamB: null,
                            scoreA: "",
                            scoreB: "",
                            winner: null,
                            loser: null,
                            targetWin: 3,
                            nextWinMatch: "p6",
                            nextWinSlot: "A",
                            nextLoseMatch: "p5",
                            nextLoseSlot: "A"
                        },
                        {
                            id: "p4",
                            name: "Match 4",
                            teamA: top6[1],
                            teamB: null,
                            scoreA: "",
                            scoreB: "",
                            winner: null,
                            loser: null,
                            targetWin: 3,
                            nextWinMatch: "p6",
                            nextWinSlot: "B",
                            nextLoseMatch: "p5",
                            nextLoseSlot: "B"
                        }
                    ]
                },
                {
                    id: "lower_semi",
                    name: "Lower Semifinal",
                    matches: [
                        {
                            id: "p5",
                            name: "Match 5",
                            teamA: null,
                            teamB: null,
                            scoreA: "",
                            scoreB: "",
                            winner: null,
                            loser: null,
                            targetWin: 3,
                            nextWinMatch: "p7",
                            nextWinSlot: "B"
                        }
                    ]
                },
                {
                    id: "upper_final",
                    name: "Upper Final",
                    matches: [
                        {
                            id: "p6",
                            name: "Match 6",
                            teamA: null,
                            teamB: null,
                            scoreA: "",
                            scoreB: "",
                            winner: null,
                            loser: null,
                            targetWin: 3,
                            nextWinMatch: "p8",
                            nextWinSlot: "A",
                            nextLoseMatch: "p7",
                            nextLoseSlot: "A"
                        }
                    ]
                },
                {
                    id: "lower_final",
                    name: "Lower Final",
                    matches: [
                        {
                            id: "p7",
                            name: "Match 7",
                            teamA: null,
                            teamB: null,
                            scoreA: "",
                            scoreB: "",
                            winner: null,
                            loser: null,
                            targetWin: 3,
                            nextWinMatch: "p8",
                            nextWinSlot: "B"
                        }
                    ]
                },
                {
                    id: "grand_final",
                    name: "Grand Finals",
                    matches: [
                        {
                            id: "p8",
                            name: "Grand Final",
                            teamA: null,
                            teamB: null,
                            scoreA: "",
                            scoreB: "",
                            winner: null,
                            loser: null,
                            targetWin: 4
                        }
                    ]
                }
            ]
        };
    }

    // Format Top 4 Fallback
    const top4 = teams.slice(0, 4);
    return {
        format: "top4",
        rounds: [
            {
                id: "semis",
                name: "Semifinals",
                matches: [
                    { id: "s1", name: "Semi 1", teamA: top4[0], teamB: top4[3], scoreA: "", scoreB: "", winner: null, targetWin: 3, nextWinMatch: "s3", nextWinSlot: "A" },
                    { id: "s2", name: "Semi 2", teamA: top4[1], teamB: top4[2], scoreA: "", scoreB: "", winner: null, targetWin: 3, nextWinMatch: "s3", nextWinSlot: "B" }
                ]
            },
            {
                id: "gf",
                name: "Grand Final",
                matches: [
                    { id: "s3", name: "Grand Final", teamA: null, teamB: null, scoreA: "", scoreB: "", winner: null, targetWin: 4 }
                ]
            }
        ]
    };
}

/**
 * Memperbarui skor bracket dan mengalirkan tim pemenang/kalah ke match selanjutnya
 */
export function updatePlayoffMatchScore(bracketData, matchId, slot, rawValue) {
    if (!bracketData || !bracketData.rounds) return bracketData;

    let targetMatch = null;
    bracketData.rounds.forEach(r => {
        const found = r.matches.find(m => m.id === matchId);
        if (found) targetMatch = found;
    });

    if (!targetMatch) return bracketData;

    if (slot === 'A') targetMatch.scoreA = rawValue === "" ? "" : parseInt(rawValue);
    if (slot === 'B') targetMatch.scoreB = rawValue === "" ? "" : parseInt(rawValue);

    const sA = targetMatch.scoreA === "" ? null : parseInt(targetMatch.scoreA);
    const sB = targetMatch.scoreB === "" ? null : parseInt(targetMatch.scoreB);
    const winTarget = targetMatch.targetWin || 3;

    // Reset status pemenang jika skor belum mencapai target
    if (sA === null || sB === null || (sA < winTarget && sB < winTarget)) {
        targetMatch.winner = null;
        targetMatch.loser = null;
    } else if (sA === sB) {
        targetMatch.winner = null;
        targetMatch.loser = null;
    } else {
        const aWon = sA > sB;
        targetMatch.winner = aWon ? targetMatch.teamA : targetMatch.teamB;
        targetMatch.loser = aWon ? targetMatch.teamB : targetMatch.teamA;
    }

    // Alirkan tim ke match berikutnya
    propagateBracketWinners(bracketData);

    return bracketData;
}

function propagateBracketWinners(bracketData) {
    const matchMap = {};
    bracketData.rounds.forEach(r => {
        r.matches.forEach(m => { matchMap[m.id] = m; });
    });

    bracketData.rounds.forEach(r => {
        r.matches.forEach(m => {
            if (m.nextWinMatch && matchMap[m.nextWinMatch]) {
                const target = matchMap[m.nextWinMatch];
                if (m.nextWinSlot === 'A') target.teamA = m.winner;
                if (m.nextWinSlot === 'B') target.teamB = m.winner;
            }
            if (m.nextLoseMatch && matchMap[m.nextLoseMatch]) {
                const target = matchMap[m.nextLoseMatch];
                if (m.nextLoseSlot === 'A') target.teamA = m.loser;
                if (m.nextLoseSlot === 'B') target.teamB = m.loser;
            }
        });
    });
}
