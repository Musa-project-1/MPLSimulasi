import { getMasterTeams } from './modules/teams_db.js';

export const TEAM_LOGOS = {
    "ONIC": "img/Logo MPl/Onic.png",
    "BTR": "img/Logo MPl/btr_vit.png",
    "EVOS": "img/Logo MPl/Evos.png",
    "TLID": "img/Logo MPl/Tlid.png",
    "AE": "img/Logo MPl/AE.png",
    "DEWA": "img/Logo MPl/Dewa.png",
    "GEEK": "img/Logo MPl/Geek.png",
    "RRQ": "img/Logo MPl/RRQ.png",
    "NAVI": "img/Logo MPl/Navi.png"
};

export const DEFAULT_SETTINGS = {
    volatility: 50,
    h2hBias: false,
    momentum: true,
    fatigue: true,
    rivalry: true
};

export const RIVALRIES = [
    { teams: ["RRQ", "EVOS"], name: "El Clasico", intensity: 1.2 },
    { teams: ["ONIC", "BTR"], name: "The Royal Derby", intensity: 1.15 },
    { teams: ["AE", "GEEK"], name: "Dark Horse Clash", intensity: 1.1 }
];

export const SCHEDULE_TEMPLATES = {
    "standard": {
        name: "Standard MPL ID Season 18 (9 Weeks, 72 Matches)",
        weeks: 9,
        daysPerWeek: [
            { day: 1, name: 'Hari 1 (Jumat)', count: 2 },
            { day: 2, name: 'Hari 2 (Sabtu)', count: 3 },
            { day: 3, name: 'Hari 3 (Minggu)', count: 3 }
        ],
        matchups: [
            // Week 1
            { week: 1, day: 1, teamA: "BTR", teamB: "AE" }, { week: 1, day: 1, teamA: "NAVI", teamB: "RRQ" },
            { week: 1, day: 2, teamA: "EVOS", teamB: "GEEK" }, { week: 1, day: 2, teamA: "AE", teamB: "ONIC" }, { week: 1, day: 2, teamA: "TLID", teamB: "NAVI" },
            { week: 1, day: 3, teamA: "DEWA", teamB: "BTR" }, { week: 1, day: 3, teamA: "EVOS", teamB: "TLID" }, { week: 1, day: 3, teamA: "RRQ", teamB: "ONIC" },
            // Week 2
            { week: 2, day: 1, teamA: "ONIC", teamB: "GEEK" }, { week: 2, day: 1, teamA: "DEWA", teamB: "NAVI" },
            { week: 2, day: 2, teamA: "GEEK", teamB: "BTR" }, { week: 2, day: 2, teamA: "AE", teamB: "EVOS" }, { week: 2, day: 2, teamA: "TLID", teamB: "DEWA" },
            { week: 2, day: 3, teamA: "NAVI", teamB: "AE" }, { week: 2, day: 3, teamA: "RRQ", teamB: "TLID" }, { week: 2, day: 3, teamA: "BTR", teamB: "EVOS" },
            // Week 3
            { week: 3, day: 1, teamA: "ONIC", teamB: "DEWA" }, { week: 3, day: 1, teamA: "NAVI", teamB: "EVOS" },
            { week: 3, day: 2, teamA: "TLID", teamB: "GEEK" }, { week: 3, day: 2, teamA: "ONIC", teamB: "BTR" }, { week: 3, day: 2, teamA: "RRQ", teamB: "AE" },
            { week: 3, day: 3, teamA: "BTR", teamB: "NAVI" }, { week: 3, day: 3, teamA: "GEEK", teamB: "RRQ" }, { week: 3, day: 3, teamA: "AE", teamB: "DEWA" },
            // Week 4
            { week: 4, day: 1, teamA: "NAVI", teamB: "EVOS" }, { week: 4, day: 1, teamA: "EVOS", teamB: "DEWA" },
            { week: 4, day: 2, teamA: "TLID", teamB: "BTR" }, { week: 4, day: 2, teamA: "RRQ", teamB: "EVOS" }, { week: 4, day: 2, teamA: "GEEK", teamB: "AE" },
            { week: 4, day: 3, teamA: "ONIC", teamB: "TLID" }, { week: 4, day: 3, teamA: "BTR", teamB: "RRQ" }, { week: 4, day: 3, teamA: "DEWA", teamB: "GEEK" },
            // Week 5
            { week: 5, day: 1, teamA: "GEEK", teamB: "NAVI" }, { week: 5, day: 1, teamA: "EVOS", teamB: "ONIC" },
            { week: 5, day: 2, teamA: "DEWA", teamB: "RRQ" }, { week: 5, day: 2, teamA: "AE", teamB: "TLID" }, { week: 5, day: 2, teamA: "EVOS", teamB: "BTR" },
            { week: 5, day: 3, teamA: "AE", teamB: "NAVI" }, { week: 5, day: 3, teamA: "GEEK", teamB: "ONIC" }, { week: 5, day: 3, teamA: "DEWA", teamB: "TLID" },
            // Week 6
            { week: 6, day: 1, teamA: "NAVI", teamB: "DEWA" }, { week: 6, day: 1, teamA: "AE", teamB: "GEEK" },
            { week: 6, day: 2, teamA: "EVOS", teamB: "AE" }, { week: 6, day: 2, teamA: "TLID", teamB: "ONIC" }, { week: 6, day: 2, teamA: "RRQ", teamB: "BTR" },
            { week: 6, day: 3, teamA: "NAVI", teamB: "TLID" }, { week: 6, day: 3, teamA: "ONIC", teamB: "RRQ" }, { week: 6, day: 3, teamA: "GEEK", teamB: "EVOS" },
            // Week 7
            { week: 7, day: 1, teamA: "GEEK", teamB: "DEWA" }, { week: 7, day: 1, teamA: "BTR", teamB: "TLID" },
            { week: 7, day: 2, teamA: "DEWA", teamB: "AE" }, { week: 7, day: 2, teamA: "EVOS", teamB: "RRQ" }, { week: 7, day: 2, teamA: "ONIC", teamB: "NAVI" },
            { week: 7, day: 3, teamA: "RRQ", teamB: "GEEK" }, { week: 7, day: 3, teamA: "NAVI", teamB: "BTR" }, { week: 7, day: 3, teamA: "TLID", teamB: "EVOS" },
            // Week 8
            { week: 8, day: 1, teamA: "BTR", teamB: "GEEK" }, { week: 8, day: 1, teamA: "DEWA", teamB: "ONIC" },
            { week: 8, day: 2, teamA: "EVOS", teamB: "NAVI" }, { week: 8, day: 2, teamA: "TLID", teamB: "RRQ" }, { week: 8, day: 2, teamA: "ONIC", teamB: "AE" },
            { week: 8, day: 3, teamA: "DEWA", teamB: "EVOS" }, { week: 8, day: 3, teamA: "AE", teamB: "BTR" }, { week: 8, day: 3, teamA: "RRQ", teamB: "NAVI" },
            // Week 9
            { week: 9, day: 1, teamA: "BTR", teamB: "DEWA" }, { week: 9, day: 1, teamA: "TLID", teamB: "AE" },
            { week: 9, day: 2, teamA: "GEEK", teamB: "TLID" }, { week: 9, day: 2, teamA: "AE", teamB: "RRQ" }, { week: 9, day: 2, teamA: "BTR", teamB: "ONIC" },
            { week: 9, day: 3, teamA: "RRQ", teamB: "DEWA" }, { week: 9, day: 3, teamA: "ONIC", teamB: "EVOS" }, { week: 9, day: 3, teamA: "NAVI", teamB: "GEEK" }
        ]
    },
    "short": {
        name: "Short Season (5 Weeks, 40 Matches)",
        weeks: 5,
        daysPerWeek: [
            { day: 1, name: 'Hari 1 (Sabtu)', count: 4 },
            { day: 2, name: 'Hari 2 (Minggu)', count: 4 }
        ],
        matchups: []
    },
    "blitz": {
        name: "Blitz Tournament (2 Weeks, 16 Matches)",
        weeks: 2,
        daysPerWeek: [
            { day: 1, name: 'Hari 1', count: 4 },
            { day: 2, name: 'Hari 2', count: 4 }
        ],
        matchups: []
    }
};

export function getInitialMockTeams() {
    return getMasterTeams();
}
