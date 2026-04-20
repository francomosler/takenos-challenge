import { describe, it, expect, beforeEach } from 'vitest';
import { DrawService } from '../draw-assigner.service';
import { Team } from '../../team';
import { Country } from '../../country';

describe('DrawService', () => {
  let teams: Team[];
  let potAssignments: Map<number, number>;

  beforeEach(() => {
    // Create test teams with realistic country distribution
    // Simulating Champions League: some countries have multiple teams
    const countries = [
      { id: 1, name: 'Spain' },
      { id: 2, name: 'England' },
      { id: 3, name: 'Germany' },
      { id: 4, name: 'Italy' },
      { id: 5, name: 'France' },
      { id: 6, name: 'Portugal' },
      { id: 7, name: 'Netherlands' },
      { id: 8, name: 'Scotland' },
      { id: 9, name: 'Ukraine' },
      { id: 10, name: 'Austria' },
      { id: 11, name: 'Belgium' },
      { id: 12, name: 'Turkey' },
      { id: 13, name: 'Greece' },
      { id: 14, name: 'Denmark' },
      { id: 15, name: 'Switzerland' },
      { id: 16, name: 'Czech Republic' },
    ].map(c => Country.create(c.id, c.name));

    // Create 36 teams distributed across countries
    // Some countries have multiple teams (Spain:3, England:4, Germany:2, Italy:3, etc.)
    const teamDistribution = [
      { countryId: 1, count: 3 }, // Spain
      { countryId: 2, count: 4 }, // England
      { countryId: 3, count: 2 }, // Germany
      { countryId: 4, count: 3 }, // Italy
      { countryId: 5, count: 2 }, // France
      { countryId: 6, count: 2 }, // Portugal
      { countryId: 7, count: 2 }, // Netherlands
      { countryId: 8, count: 2 }, // Scotland
      { countryId: 9, count: 2 }, // Ukraine
      { countryId: 10, count: 2 }, // Austria
      { countryId: 11, count: 2 }, // Belgium
      { countryId: 12, count: 2 }, // Turkey
      { countryId: 13, count: 2 }, // Greece
      { countryId: 14, count: 2 }, // Denmark
      { countryId: 15, count: 2 }, // Switzerland
      { countryId: 16, count: 2 }, // Czech Republic
    ];

    teams = [];
    let teamId = 1;
    teamDistribution.forEach(({ countryId, count }) => {
      const country = countries.find(c => c.id === countryId)!;
      for (let i = 0; i < count; i++) {
        teams.push(
          Team.create(
            teamId++,
            `Team ${teamId} from ${country.name}`,
            country
          )
        );
      }
    });

    // Assign teams to pots (9 teams per pot)
    potAssignments = new Map();
    teams.forEach((team, index) => {
      const pot = Math.floor(index / 9) + 1;
      potAssignments.set(team.id, pot);
    });
  });

  describe('generateMatches', () => {
    it('should generate exactly 144 matches', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      expect(matches).toHaveLength(144);
    });

    it('should ensure each team plays exactly 8 matches', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      // Count matches per team
      teams.forEach(team => {
        const teamMatches = matches.filter(
          m => m.homeTeamId === team.id || m.awayTeamId === team.id
        );
        expect(teamMatches).toHaveLength(8);
      });
    });

    it('should ensure each team has exactly 4 home and 4 away matches', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      teams.forEach(team => {
        const homeMatches = matches.filter(m => m.homeTeamId === team.id);
        const awayMatches = matches.filter(m => m.awayTeamId === team.id);

        expect(homeMatches).toHaveLength(4);
        expect(awayMatches).toHaveLength(4);
      });
    });

    it('should ensure no team plays the same opponent twice', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      teams.forEach(team => {
        const teamMatches = matches.filter(
          m => m.homeTeamId === team.id || m.awayTeamId === team.id
        );

        const opponents = teamMatches.map(m =>
          m.homeTeamId === team.id ? m.awayTeamId : m.homeTeamId
        );

        // All opponents should be unique
        const uniqueOpponents = new Set(opponents);
        expect(uniqueOpponents.size).toBe(8);
      });
    });

    it('should not allow teams from the same country to play each other', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      matches.forEach(match => {
        const homeTeam = teams.find(t => t.id === match.homeTeamId)!;
        const awayTeam = teams.find(t => t.id === match.awayTeamId)!;

        expect(homeTeam.country.id).not.toBe(awayTeam.country.id);
      });
    });

    it('should limit each team to max 2 opponents from the same country', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      teams.forEach(team => {
        const teamMatches = matches.filter(
          m => m.homeTeamId === team.id || m.awayTeamId === team.id
        );

        // Count opponents by country
        const opponentsByCountry = new Map<number, number>();

        teamMatches.forEach(match => {
          const opponentId = match.homeTeamId === team.id ? match.awayTeamId : match.homeTeamId;
          const opponent = teams.find(t => t.id === opponentId)!;

          if (opponent.country.id !== team.country.id) {
            const count = opponentsByCountry.get(opponent.country.id) || 0;
            opponentsByCountry.set(opponent.country.id, count + 1);
          }
        });

        // No country should have more than 2 opponents
        opponentsByCountry.forEach((count, countryId) => {
          expect(count).toBeLessThanOrEqual(2);
        });
      });
    });

    it('should distribute matches across 8 match days', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      const matchesByDay = new Map<number, number>();

      matches.forEach(match => {
        const count = matchesByDay.get(match.matchDay) || 0;
        matchesByDay.set(match.matchDay, count + 1);
      });

      // Should have exactly 8 match days
      expect(matchesByDay.size).toBe(8);

      // Each match day should have 18 matches (36 teams / 2)
      matchesByDay.forEach(count => {
        expect(count).toBe(18);
      });
    });

    it('should ensure each team plays once per match day', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      teams.forEach(team => {
        const teamMatches = matches.filter(
          m => m.homeTeamId === team.id || m.awayTeamId === team.id
        );

        const matchDays = teamMatches.map(m => m.matchDay);

        // All match days should be unique
        const uniqueMatchDays = new Set(matchDays);
        expect(uniqueMatchDays.size).toBe(8);

        // Should cover match days 1-8
        matchDays.sort();
        expect(Math.min(...matchDays)).toBe(1);
        expect(Math.max(...matchDays)).toBe(8);
      });
    });

    it('should not have duplicate matches', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      const matchKeys = new Set<string>();

      matches.forEach(match => {
        // Create normalized key (always smaller ID first)
        const team1 = Math.min(match.homeTeamId, match.awayTeamId);
        const team2 = Math.max(match.homeTeamId, match.awayTeamId);
        const key = `${team1}-${team2}`;

        expect(matchKeys.has(key)).toBe(false);
        matchKeys.add(key);
      });

      expect(matchKeys.size).toBe(144);
    });

    it('should generate consistent results across multiple runs', () => {
      // Run the algorithm 3 times
      const results = [
        DrawService.generateMatches(teams, potAssignments, 1),
        DrawService.generateMatches(teams, potAssignments, 2),
        DrawService.generateMatches(teams, potAssignments, 3),
      ];

      // All should generate 144 matches
      results.forEach(matches => {
        expect(matches).toHaveLength(144);
      });

      // All should satisfy all constraints
      results.forEach(matches => {
        teams.forEach(team => {
          const teamMatches = matches.filter(
            m => m.homeTeamId === team.id || m.awayTeamId === team.id
          );
          expect(teamMatches).toHaveLength(8);
        });
      });
    });

    it('should handle teams with the same country correctly', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      // Find teams from the same country
      const spainTeams = teams.filter(t => t.country.id === 1); // Spain has 3 teams
      const englandTeams = teams.filter(t => t.country.id === 2); // England has 4 teams

      // Spain teams should never play each other
      spainTeams.forEach(team1 => {
        const team1Matches = matches.filter(
          m => m.homeTeamId === team1.id || m.awayTeamId === team1.id
        );

        team1Matches.forEach(match => {
          const opponentId = match.homeTeamId === team1.id ? match.awayTeamId : match.homeTeamId;
          const opponent = teams.find(t => t.id === opponentId)!;

          expect(opponent.country.id).not.toBe(1); // Should not be Spain
        });
      });

      // England teams should never play each other
      englandTeams.forEach(team1 => {
        const team1Matches = matches.filter(
          m => m.homeTeamId === team1.id || m.awayTeamId === team1.id
        );

        team1Matches.forEach(match => {
          const opponentId = match.homeTeamId === team1.id ? match.awayTeamId : match.homeTeamId;
          const opponent = teams.find(t => t.id === opponentId)!;

          expect(opponent.country.id).not.toBe(2); // Should not be England
        });
      });
    });

    it('should assign valid match IDs starting from 1', () => {
      const matches = DrawService.generateMatches(teams, potAssignments, 1);

      const matchIds = matches.map(m => m.id).sort((a, b) => a - b);

      // IDs should start from 1
      expect(matchIds[0]).toBe(1);

      // IDs should be sequential
      expect(matchIds[143]).toBe(144);

      // All IDs should be unique
      const uniqueIds = new Set(matchIds);
      expect(uniqueIds.size).toBe(144);
    });

    it('should assign correct drawId to all matches', () => {
      const drawId = 42;
      const matches = DrawService.generateMatches(teams, potAssignments, drawId);
      
      matches.forEach(match => {
        expect(match.drawId).toBe(drawId);
      });
    });
  });
});
