/**
 * Modul Manajemen Pertandingan & Jadwal
 * Batas: <450 baris
 */

/**
 * Memperbarui skor pertandingan
 * Mendukung Best-of-3 (2-0, 2-1, 1-2, 0-2) atau reset (SCHEDULED)
 */
export function updateMatchScore(matches, matchId, scoreA, scoreB) {
    const updated = matches.map(m => {
        if (m.id !== matchId) return m;

        // Jika skor dikosongkan -> Reset status ke SCHEDULED
        if (scoreA === "" || scoreA === null || scoreA === undefined) {
            return {
                ...m,
                score_a: "",
                score_b: "",
                status: 'SCHEDULED'
            };
        }

        const sA = parseInt(scoreA);
        const sB = parseInt(scoreB);

        // Validasi format BO3
        const validScores = [
            [2, 0], [2, 1], [1, 2], [0, 2]
        ];
        const isValidBO3 = validScores.some(([a, b]) => a === sA && b === sB);

        return {
            ...m,
            score_a: sA,
            score_b: sB,
            status: 'COMPLETED',
            is_bo3_valid: isValidBO3
        };
    });

    return updated;
}

/**
 * Filter pertandingan berdasarkan minggu (Week)
 */
export function filterMatchesByWeek(matches, week) {
    if (!matches) return [];
    return matches.filter(m => parseInt(m.week) === parseInt(week));
}

/**
 * Menghitung ringkasan statistik pertandingan untuk Dashboard
 */
export function getMatchesSummary(matches, limitUpcoming = 4) {
    const all = matches || [];
    const completed = all.filter(m => m.status === 'COMPLETED').length;
    const scheduled = all.filter(m => m.status === 'SCHEDULED');
    
    // Sort upcoming berdasarkan week lalu day
    const upcoming = [...scheduled].sort((a, b) => {
        const diffWeek = parseInt(a.week) - parseInt(b.week);
        if (diffWeek !== 0) return diffWeek;
        return parseInt(a.day) - parseInt(b.day);
    }).slice(0, limitUpcoming);

    const total = all.length;
    const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
        total,
        completed,
        remaining: total - completed,
        progressPct,
        upcoming
    };
}

/**
 * Membuat struktur pertandingan awal berdasarkan template jadwal
 */
export function generateMatchesFromTemplate(template, teams, startDate = new Date()) {
    if (!template || !template.matchups) return [];

    const tagToId = {};
    (teams || []).forEach(t => { tagToId[t.tag] = t.id; });

    let matchCounter = 1;
    const matches = [];

    for (let w = 1; w <= template.weeks; w++) {
        const weekMatchups = template.matchups.filter(m => m.week === w);
        
        template.daysPerWeek.forEach((d, dIndex) => {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + ((w - 1) * 7) + dIndex);
            const dateStr = currentDate.toISOString().split('T')[0];

            const dayMatchups = weekMatchups.filter(m => m.day === d.day);

            dayMatchups.forEach(m => {
                const teamA_id = tagToId[m.teamA] || m.teamA || "";
                const teamB_id = tagToId[m.teamB] || m.teamB || "";

                matches.push({
                    id: `m_${matchCounter++}`,
                    week: w,
                    day: d.day,
                    day_name: d.name,
                    date: dateStr,
                    team_a_id: teamA_id,
                    team_b_id: teamB_id,
                    score_a: "",
                    score_b: "",
                    status: "SCHEDULED"
                });
            });
        });
    }

    return matches;
}
