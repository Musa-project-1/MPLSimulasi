import { describe, it, expect } from 'vitest';
import { generateMPLSchedule } from '../js/rules/scheduler.js';

describe('Algorithmic Round-Robin Tournament Scheduler', () => {
    it('generates an exact 72-match schedule across 9 weeks', () => {
        const schedule = generateMPLSchedule([], 18);
        expect(schedule.key).toBe('s18');
        expect(schedule.weeks).toBe(9);
        expect(schedule.matchups.length).toBe(72);

        // Check distribution: 8 matches per week
        for (let w = 1; w <= 9; w++) {
            const weekMatches = schedule.matchups.filter(m => m.week === w);
            expect(weekMatches.length).toBe(8);

            const day1 = weekMatches.filter(m => m.day === 1);
            const day2 = weekMatches.filter(m => m.day === 2);
            const day3 = weekMatches.filter(m => m.day === 3);

            expect(day1.length).toBe(2);
            expect(day2.length).toBe(3);
            expect(day3.length).toBe(3);
        }
    });

    it('ensures every team plays every opponent exactly twice (Home and Away)', () => {
        const teams = ["ONIC", "BTR", "EVOS", "TLID", "AE", "DEWA", "GEEK", "NAVI", "RRQ"];
        const schedule = generateMPLSchedule(teams, 19);

        expect(schedule.key).toBe('s19');
        expect(schedule.name).toContain('Season 19');

        // Check head-to-head frequencies for every pair
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const tA = teams[i];
                const tB = teams[j];

                const encounters = schedule.matchups.filter(m =>
                    (m.teamA === tA && m.teamB === tB) ||
                    (m.teamA === tB && m.teamB === tA)
                );

                expect(encounters.length).toBe(2);

                // Exactly one Home, exactly one Away
                const homeA = encounters.filter(m => m.teamA === tA && m.teamB === tB);
                const homeB = encounters.filter(m => m.teamA === tB && m.teamB === tA);

                expect(homeA.length).toBe(1);
                expect(homeB.length).toBe(1);
            }
        }
    });

    it('dynamically generates valid future seasons (Season 20, 21, etc.)', () => {
        const s20 = generateMPLSchedule([], 20);
        const s21 = generateMPLSchedule([], 21);

        expect(s20.key).toBe('s20');
        expect(s20.name).toContain('Season 20');
        expect(s20.matchups.length).toBe(72);

        expect(s21.key).toBe('s21');
        expect(s21.name).toContain('Season 21');
        expect(s21.matchups.length).toBe(72);
    });
});
