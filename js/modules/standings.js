/**
 * Modul Kalkulasi Klasemen & Tie-Breaker Resmi MPL
 * Batas: <450 baris
 */

/**
 * Menghitung ulang statistik tim dari jadwal pertandingan dan mengurutkannya
 * sesuai aturan tie-breaker resmi turnamen MPL:
 * 1. Match Win (Kemenangan Pertandingan)
 * 2. Net Game Difference / Points (Selisih Game: Game Win - Game Lose)
 * 3. Head-to-Head (H2H) Hasil Pertemuan Antara Tim Seimbang
 * 4. Game Win (Total Kemenangan Game)
 * 5. Urutan Alfabetis Tim
 */
export function calculateStandings(teams, matches) {
    if (!teams || teams.length === 0) return [];
    
    // Inisialisasi ulang metrik setiap tim
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

    // Catat H2H cache: h2h[teamA_id][teamB_id] = { match_win, game_diff }
    const h2h = {};
    teams.forEach(t1 => {
        h2h[t1.id] = {};
        teams.forEach(t2 => {
            h2h[t1.id][t2.id] = { match_win: 0, game_win: 0, game_lose: 0 };
        });
    });

    // Iterasi pertandingan yang selesai
    (matches || []).forEach(m => {
        if (m.status === 'COMPLETED' && m.team_a_id && m.team_b_id && statsMap[m.team_a_id] && statsMap[m.team_b_id]) {
            const sA = parseInt(m.score_a) || 0;
            const sB = parseInt(m.score_b) || 0;
            const tA = statsMap[m.team_a_id];
            const tB = statsMap[m.team_b_id];

            tA.match_played += 1;
            tB.match_played += 1;
            tA.game_win += sA;
            tA.game_lose += sB;
            tB.game_win += sB;
            tB.game_lose += sA;

            if (sA > sB) {
                tA.match_win += 1;
                tB.match_lose += 1;
                if (h2h[m.team_a_id] && h2h[m.team_a_id][m.team_b_id]) {
                    h2h[m.team_a_id][m.team_b_id].match_win += 1;
                }
            } else if (sB > sA) {
                tB.match_win += 1;
                tA.match_lose += 1;
                if (h2h[m.team_b_id] && h2h[m.team_b_id][m.team_a_id]) {
                    h2h[m.team_b_id][m.team_a_id].match_win += 1;
                }
            }

            if (h2h[m.team_a_id] && h2h[m.team_a_id][m.team_b_id]) {
                h2h[m.team_a_id][m.team_b_id].game_win += sA;
                h2h[m.team_a_id][m.team_b_id].game_lose += sB;
            }
            if (h2h[m.team_b_id] && h2h[m.team_b_id][m.team_a_id]) {
                h2h[m.team_b_id][m.team_a_id].game_win += sB;
                h2h[m.team_b_id][m.team_a_id].game_lose += sA;
            }
        }
    });

    // Hitung poin akhir (net game difference)
    Object.values(statsMap).forEach(t => {
        t.points = t.game_win - t.game_lose;
    });

    // Sorting dengan canonical tie-breaker
    const sorted = Object.values(statsMap).sort((a, b) => {
        // 1. Match Win
        if (b.match_win !== a.match_win) return b.match_win - a.match_win;

        // 2. Net Game Difference (Points)
        if (b.points !== a.points) return b.points - a.points;

        // 3. Head-to-Head (H2H)
        const h2h_A_vs_B = (h2h[a.id] && h2h[a.id][b.id]) ? h2h[a.id][b.id].match_win : 0;
        const h2h_B_vs_A = (h2h[b.id] && h2h[b.id][a.id]) ? h2h[b.id][a.id].match_win : 0;
        if (h2h_A_vs_B !== h2h_B_vs_A) {
            return h2h_B_vs_A - h2h_A_vs_B;
        }

        const h2hGameDiffA = (h2h[a.id] && h2h[a.id][b.id]) ? (h2h[a.id][b.id].game_win - h2h[a.id][b.id].game_lose) : 0;
        const h2hGameDiffB = (h2h[b.id] && h2h[b.id][a.id]) ? (h2h[b.id][a.id].game_win - h2h[b.id][a.id].game_lose) : 0;
        if (h2hGameDiffA !== h2hGameDiffB) {
            return h2hGameDiffB - h2hGameDiffA;
        }

        // 4. Game Win
        if (b.game_win !== a.game_win) return b.game_win - a.game_win;

        // 5. Nama Tim
        return (a.team_name || '').localeCompare(b.team_name || '');
    });

    return sorted;
}

/**
 * Menentukan zona klasemen berdasarkan peringkat (1-indexed)
 */
export function getZoneByRank(rankIndex, totalTeams = 9) {
    if (rankIndex <= 2) return { key: 'upper', label: 'Upper Bracket', class: 'zone-upper' };
    if (rankIndex <= 6) return { key: 'playin', label: 'Play-in (Lower)', class: 'zone-playin' };
    return { key: 'elim', label: 'Tereliminasi', class: 'zone-elim' };
}
