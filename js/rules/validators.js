/**
 * Input & Output Validation Engine for MPL Simulator
 * Enforces strict esports tournament rules, data sanitization, and schema integrity.
 */

export const VALID_ROLES = [
    "EXP Laner",
    "Jungler",
    "Mid Laner",
    "Gold Laner",
    "Roamer"
];

/**
 * Validates regular season Bo3 match score.
 * Legal scores in MPL Bo3:
 * - 2-0 or 0-2 (Clean sweep)
 * - 2-1 or 1-2 (Decider game)
 * - '' and '' (Unplayed / Scheduled)
 */
export function validateMatchupTeams(teamA, teamB) {
    const cleanA = (teamA || '').trim().toUpperCase();
    const cleanB = (teamB || '').trim().toUpperCase();

    if (!cleanA || !cleanB) {
        return { valid: false, error: "Tim Home dan Away harus dipilih." };
    }

    if (cleanA === cleanB) {
        return { valid: false, error: "Tim Home dan Away tidak boleh tim yang sama." };
    }

    return { valid: true, teamA: cleanA, teamB: cleanB };
}

export function validateBo3Score(scoreA, scoreB) {
    // Check reset / scheduled state
    if ((scoreA === "" || scoreA === null || scoreA === undefined) &&
        (scoreB === "" || scoreB === null || scoreB === undefined)) {
        return { valid: true, isReset: true, scoreA: "", scoreB: "" };
    }

    const sA = parseInt(scoreA, 10);
    const sB = parseInt(scoreB, 10);

    if (isNaN(sA) || isNaN(sB) || sA < 0 || sB < 0) {
        return { valid: false, error: "Skor harus berupa angka bilangan bulat non-negatif." };
    }

    // In Mobile Legends: Bang Bang, draws (seri) do not exist
    if (sA === sB) {
        return { valid: false, error: "Pertandingan Bo3 tidak boleh berakhir seri." };
    }

    // Exactly one team must win 2 games
    const isWinnerA = sA === 2 && (sB === 0 || sB === 1);
    const isWinnerB = sB === 2 && (sA === 0 || sA === 1);

    if (!isWinnerA && !isWinnerB) {
        return { 
            valid: false, 
            error: `Skor ${sA}-${sB} tidak valid untuk format Bo3. Skor harus 2-0, 2-1, 1-2, atau 0-2.` 
        };
    }

    return { valid: true, isReset: false, scoreA: sA, scoreB: sB, winner: isWinnerA ? 'A' : 'B' };
}

/**
 * Validates Playoff tournament match scores.
 * - Standard Playoff: Best of 5 (first to 3 wins, max 5 games: 3-0, 3-1, 3-2, 2-3, 1-3, 0-3)
 * - Grand Final: Best of 7 (first to 4 wins, max 7 games: 4-0, 4-1, 4-2, 4-3, 3-4, etc.)
 */
export function validatePlayoffScore(scoreA, scoreB, isGrandFinal = false) {
    if ((scoreA === "" || scoreA === null || scoreA === undefined) &&
        (scoreB === "" || scoreB === null || scoreB === undefined)) {
        return { valid: true, isComplete: false, scoreA: "", scoreB: "", winner: null };
    }

    const sA = parseInt(scoreA, 10);
    const sB = parseInt(scoreB, 10);

    if (isNaN(sA) || isNaN(sB) || sA < 0 || sB < 0) {
        return { valid: false, error: "Skor playoff harus berupa angka valid." };
    }

    if (sA === sB) {
        return { valid: false, error: "Skor playoff tidak boleh seri." };
    }

    const targetWins = isGrandFinal ? 4 : 3;
    const maxLoserScore = targetWins - 1;

    const winnerA = sA === targetWins && sB <= maxLoserScore;
    const winnerB = sB === targetWins && sA <= maxLoserScore;

    if (!winnerA && !winnerB) {
        const formatName = isGrandFinal ? "Bo7 (Grand Final)" : "Bo5";
        return {
            valid: false,
            error: `Skor ${sA}-${sB} tidak valid untuk format ${formatName}. Pemenang harus mencapai tepat ${targetWins} kemenangan.`
        };
    }

    return {
        valid: true,
        isComplete: true,
        scoreA: sA,
        scoreB: sB,
        winner: winnerA ? 'A' : 'B'
    };
}

/**
 * Sanitizes and validates session name.
 * Prevents XSS, excessive whitespaces, and empty strings.
 */
export function sanitizeSessionName(rawName) {
    if (!rawName || typeof rawName !== 'string') {
        return { valid: false, error: "Nama sesi tidak boleh kosong." };
    }

    // Strip HTML tags and unsafe control characters
    const clean = rawName
        .replace(/<[^>]*>/g, '')
        .replace(/[\r\n\t]/g, ' ')
        .trim();

    if (clean.length < 2) {
        return { valid: false, error: "Nama sesi minimal 2 karakter." };
    }

    if (clean.length > 50) {
        return { valid: false, error: "Nama sesi maksimal 50 karakter." };
    }

    return { valid: true, name: clean };
}

/**
 * Validates team identity data (Name and Tag).
 */
export function validateTeamData(teamName, tag) {
    const cleanName = (teamName || '').replace(/<[^>]*>/g, '').trim();
    const cleanTag = (tag || '').replace(/<[^>]*>/g, '').toUpperCase().trim();

    if (cleanName.length < 2 || cleanName.length > 40) {
        return { valid: false, error: "Nama tim harus antara 2 hingga 40 karakter." };
    }

    if (!/^[A-Z0-9]{2,6}$/.test(cleanTag)) {
        return { valid: false, error: "Tag tim harus terdiri dari 2 hingga 6 karakter huruf kapital/angka (cth: RRQ, ONIC, TLID)." };
    }

    return { valid: true, name: cleanName, tag: cleanTag };
}

/**
 * Validates player data (Nick and Role).
 */
export function validatePlayerData(nick, role) {
    const cleanNick = (nick || '').replace(/<[^>]*>/g, '').trim();

    if (cleanNick.length < 2 || cleanNick.length > 25) {
        return { valid: false, error: "Nickname pemain harus antara 2 hingga 25 karakter." };
    }

    if (!VALID_ROLES.includes(role)) {
        return { valid: false, error: `Role tidak valid. Pilih salah satu dari: ${VALID_ROLES.join(', ')}.` };
    }

    return { valid: true, nick: cleanNick, role };
}

/**
 * Validates imported JSON session files against schema specifications.
 */
export function validateSessionImport(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: "Format file JSON tidak valid atau kosong." };
    }

    if (data.type !== "MPL_SIM_SESSION") {
        return { valid: false, error: "Tipe file tidak cocok. File harus berformat 'MPL_SIM_SESSION'." };
    }

    if (!data.session || typeof data.session.name !== 'string' || !data.session.id) {
        return { valid: false, error: "Objek metadata session hilang atau tidak lengkap." };
    }

    if (!Array.isArray(data.teams) || data.teams.length === 0) {
        return { valid: false, error: "Daftar tim (teams) hilang atau bukan array valid." };
    }

    if (!Array.isArray(data.matches) || data.matches.length === 0) {
        return { valid: false, error: "Jadwal pertandingan (matches) hilang atau bukan array valid." };
    }

    // Sanitize and ensure numeric constraints
    const sanitizedTeams = data.teams.map(t => ({
        id: String(t.id || ''),
        team_name: String(t.team_name || 'Unnamed Team').replace(/<[^>]*>/g, ''),
        tag: String(t.tag || 'TBD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6),
        match_played: Math.max(0, parseInt(t.match_played, 10) || 0),
        match_win: Math.max(0, parseInt(t.match_win, 10) || 0),
        match_lose: Math.max(0, parseInt(t.match_lose, 10) || 0),
        game_win: Math.max(0, parseInt(t.game_win, 10) || 0),
        game_lose: Math.max(0, parseInt(t.game_lose, 10) || 0),
        points: parseInt(t.points, 10) || 0,
        roster: Array.isArray(t.roster) ? t.roster : []
    }));

    const teamIds = new Set();
    for (const team of sanitizedTeams) {
        if (!team.id || teamIds.has(team.id)) {
            return { valid: false, error: 'Import memiliki ID tim duplikat atau kosong.' };
        }
        teamIds.add(team.id);
    }

    const matchIds = new Set();
    const sanitizedMatches = [];
    for (const m of data.matches) {
        const id = String(m.id || '');
        const teamA = String(m.team_a_id || '');
        const teamB = String(m.team_b_id || '');
        if (!id || matchIds.has(id)) {
            return { valid: false, error: 'Import memiliki ID match duplikat atau kosong.' };
        }
        matchIds.add(id);
        if (!teamA || !teamIds.has(teamA) || (teamB && (teamA === teamB || !teamIds.has(teamB)))) {
            return { valid: false, error: 'Match import memiliki identitas tim atau ID yang tidak valid.' };
        }

        const rawA = m.score_a === undefined || m.score_a === null ? '' : String(m.score_a).trim();
        const rawB = m.score_b === undefined || m.score_b === null ? '' : String(m.score_b).trim();
        const score = rawA === '' || rawB === ''
            ? { valid: true, isReset: true, scoreA: '', scoreB: '' }
            : validateBo3Score(rawA, rawB);
        if (!score.valid) return { valid: false, error: `Skor match ${id} tidak valid: ${score.error}` };
        sanitizedMatches.push({
            id,
            week: Math.max(1, parseInt(m.week, 10) || 1),
            day: Math.max(1, parseInt(m.day, 10) || 1),
            day_name: String(m.day_name || '').replace(/[<>]/g, ''),
            date: String(m.date || '').replace(/[<>]/g, ''),
            team_a_id: teamA,
            team_b_id: teamB,
            score_a: score.scoreA,
            score_b: score.scoreB,
            status: score.isReset ? 'SCHEDULED' : 'COMPLETED',
            games: Array.isArray(m.games) ? m.games : []
        });
    }

    return {
        valid: true,
        session: {
            id: String(data.session.id),
            name: String(data.session.name).replace(/<[^>]*>/g, '').trim(),
            timestamp: parseInt(data.session.timestamp, 10) || Date.now()
        },
        teams: sanitizedTeams,
        matches: sanitizedMatches
    };
}
