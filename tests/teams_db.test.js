import { describe, it, expect, beforeEach } from 'vitest';
import { 
    getMasterTeams, 
    addMasterTeam, 
    updateMasterTeam, 
    deleteMasterTeam,
    addPlayerToTeam,
    updatePlayerInTeam,
    removePlayerFromTeam,
    saveMasterTeams
} from '../js/modules/teams_db.js';

describe('Dynamic Master Teams & Roster Database', () => {
    it('initializes with 9 default MPL teams and valid rosters', () => {
        const teams = getMasterTeams();
        expect(teams.length).toBe(9);
        expect(teams[0].tag).toBe('ONIC');
        expect(teams[0].roster.length).toBe(5);
        expect(teams[0].roster[0].role).toBe('EXP Laner');
    });

    it('allows Admin to add a new team dynamically', () => {
        const res = addMasterTeam({ tag: 'AURA', name: 'AURA Fire' });
        expect(res.success).toBe(true);
        expect(res.team.tag).toBe('AURA');
        expect(res.team.roster.length).toBe(5);

        const currentTeams = getMasterTeams();
        expect(currentTeams.some(t => t.tag === 'AURA')).toBe(true);
    });

    it('rejects adding team with duplicate tag', () => {
        const res = addMasterTeam({ tag: 'ONIC', name: 'Duplicate Onic' });
        expect(res.success).toBe(false);
        expect(res.error).toContain('sudah ada');
    });

    it('allows Admin to update team name and tag', () => {
        const teams = getMasterTeams();
        const btr = teams.find(t => t.tag === 'BTR');
        const res = updateMasterTeam(btr.id, { name: 'Bigetron Esports' });
        expect(res.success).toBe(true);
        expect(res.team.team_name).toBe('Bigetron Esports');
    });

    it('allows Admin to add, update, and remove players from a team roster', () => {
        const teams = getMasterTeams();
        const rrq = teams.find(t => t.tag === 'RRQ');
        const initialCount = rrq.roster.length;

        // Add player
        const addRes = addPlayerToTeam(rrq.id, { nick: 'Lemon', role: 'Mid Laner' });
        expect(addRes.success).toBe(true);
        expect(addRes.player.nick).toBe('Lemon');

        // Update player
        const updateRes = updatePlayerInTeam(rrq.id, addRes.player.id, { nick: 'King Lemon', role: 'Gold Laner' });
        expect(updateRes.success).toBe(true);
        expect(updateRes.player.nick).toBe('King Lemon');

        // Remove player
        const removeRes = removePlayerFromTeam(rrq.id, addRes.player.id);
        expect(removeRes.success).toBe(true);
        
        const updatedTeams = getMasterTeams();
        const updatedRrq = updatedTeams.find(t => t.tag === 'RRQ');
        expect(updatedRrq.roster.length).toBe(initialCount);
    });

    it('allows Admin to delete a team', () => {
        const teams = getMasterTeams();
        const target = teams.find(t => t.tag === 'AURA');
        if (target) {
            const res = deleteMasterTeam(target.id);
            expect(res.success).toBe(true);
            const currentTeams = getMasterTeams();
            expect(currentTeams.some(t => t.tag === 'AURA')).toBe(false);
        }
    });
});
