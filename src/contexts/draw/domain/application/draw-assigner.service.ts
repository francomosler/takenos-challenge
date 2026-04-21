import { Team } from "../team";
import { Match } from "../match";

const MAX_MATCHES = 8;
const MAX_HOME = 4;
const MAX_AWAY = 4;
const MATCH_DAYS = 8;
const MAX_COUNTRY_OPPONENTS = 2;

type TeamState = {
  opponents: Set<number>;
  matches: number;
  home: number;
  away: number;
  matchDays: Set<number>;
  opponentCountries: Map<number, number>;
};

export class DrawService {
  static generateMatches(
    teams: Team[],
    potAssignments: Map<number, number>,
    drawId: number
  ): Match[] {
    
    // Try up to 500 times to generate a valid draw
    for (let attempt = 0; attempt < 500; attempt++) {
      const result = this.tryGenerateMatches(teams, potAssignments, drawId);

      // Validate that all teams have exactly 8 matches
      const allTeamsComplete = teams.every(team => {
        const teamMatches = result.filter(m =>
          m.homeTeamId === team.id || m.awayTeamId === team.id
        );
        return teamMatches.length === MAX_MATCHES;
      });

      if (result.length === 144 && allTeamsComplete) {
        return result;
      }

      if (attempt < 10) {
        console.warn(`Attempt ${attempt + 1} failed, retrying...`);
      }
    }

    throw new Error('Could not generate a valid draw after 500 attempts');
  }

  private static tryGenerateMatches(
    teams: Team[],
    potAssignments: Map<number, number>,
    drawId: number
  ): Match[] {
    const states = new Map<number, TeamState>();
    const matches: Match[] = [];
    let matchId = 1;

    // Initialize team states
    for (const team of teams) {
      states.set(team.id, {
        opponents: new Set(),
        matches: 0,
        home: 0,
        away: 0,
        matchDays: new Set(),
        opponentCountries: new Map(),
      });
    }

    // Generate matches day by day
    for (let matchDay = 1; matchDay <= MATCH_DAYS; matchDay++) {
      // Get teams that haven't played this match day yet
      const availableTeams = teams.filter(team => !states.get(team.id)!.matchDays.has(matchDay));

      const paired = new Set<number>();

      // Helper function to count valid opponents for a team
      const countValidOpponents = (team: Team, currentPaired: Set<number>): number => {
        const stateA = states.get(team.id)!;
        return availableTeams.filter(teamB => {
          if (teamB.id === team.id) return false;
          if (currentPaired.has(teamB.id)) return false;

          const stateB = states.get(teamB.id)!;
          if (stateB.matches >= MAX_MATCHES) return false;
          if (stateA.opponents.has(teamB.id)) return false;
          if (team.country.id === teamB.country.id) return false;

          const aCountFromB = stateA.opponentCountries.get(teamB.country.id) || 0;
          const bCountFromA = stateB.opponentCountries.get(team.country.id) || 0;
          if (aCountFromB >= MAX_COUNTRY_OPPONENTS || bCountFromA >= MAX_COUNTRY_OPPONENTS) {
            return false;
          }

          const canHome = stateA.home < MAX_HOME && stateB.away < MAX_AWAY;
          const canAway = stateA.away < MAX_AWAY && stateB.home < MAX_HOME;
          return canHome || canAway;
        }).length;
      };

      // Process teams in order of how constrained they are (minimum remaining options first)
      while (paired.size < availableTeams.length) {
        // Find unpaired team with fewest valid opponents
        const unpaired = availableTeams.filter(t => {
          const state = states.get(t.id)!;
          return !paired.has(t.id) && state.matches < MAX_MATCHES;
        });

        if (unpaired.length === 0) break;

        // Sort by number of valid opponents (ascending) to prioritize most constrained
        const sorted = unpaired.sort((a, b) => {
          return countValidOpponents(a, paired) - countValidOpponents(b, paired);
        });

        // Among the most constrained, pick randomly to add variety
        const minCount = countValidOpponents(sorted[0], paired);
        const mostConstrained = sorted.filter(t => countValidOpponents(t, paired) === minCount);
        const teamA = mostConstrained[Math.floor(Math.random() * mostConstrained.length)];

        const stateA = states.get(teamA.id)!;

        // Find all valid opponents for this team
        const candidates = availableTeams.filter(teamB => {
          if (teamB.id === teamA.id) return false;
          if (paired.has(teamB.id)) return false;

          const stateB = states.get(teamB.id)!;
          if (stateB.matches >= MAX_MATCHES) return false;
          if (stateA.opponents.has(teamB.id)) return false;
          if (teamA.country.id === teamB.country.id) return false;

          const aCountFromB = stateA.opponentCountries.get(teamB.country.id) || 0;
          const bCountFromA = stateB.opponentCountries.get(teamA.country.id) || 0;
          if (aCountFromB >= MAX_COUNTRY_OPPONENTS || bCountFromA >= MAX_COUNTRY_OPPONENTS) {
            return false;
          }

          const canHome = stateA.home < MAX_HOME && stateB.away < MAX_AWAY;
          const canAway = stateA.away < MAX_AWAY && stateB.home < MAX_HOME;
          return canHome || canAway;
        });

        if (candidates.length === 0) break;

        // Choose opponent with fewest remaining valid opponents (most constrained)
        const sortedCandidates = candidates.sort((a, b) => {
          return countValidOpponents(a, paired) - countValidOpponents(b, paired);
        });

        // Among the most constrained opponents, pick randomly
        const minOpponentCount = countValidOpponents(sortedCandidates[0], paired);
        const mostConstrainedOpponents = sortedCandidates.filter(
          t => countValidOpponents(t, paired) === minOpponentCount
        );
        const teamB = mostConstrainedOpponents[Math.floor(Math.random() * mostConstrainedOpponents.length)];

        const stateB = states.get(teamB.id)!;

        // Determine home/away
        const canHome = stateA.home < MAX_HOME && stateB.away < MAX_AWAY;
        const canAway = stateA.away < MAX_AWAY && stateB.home < MAX_HOME;

        let isHome: boolean;
        if (canHome && canAway) {
          const aHomeNeed = MAX_HOME - stateA.home;
          const aAwayNeed = MAX_AWAY - stateA.away;
          isHome = aHomeNeed > aAwayNeed;
        } else {
          isHome = canHome;
        }

        // Create the match
        matches.push(
          Match.create(
            matchId++,
            drawId,
            isHome ? teamA.id : teamB.id,
            isHome ? teamB.id : teamA.id,
            matchDay
          )
        );

        // Update states
        stateA.opponents.add(teamB.id);
        stateB.opponents.add(teamA.id);
        stateA.matchDays.add(matchDay);
        stateB.matchDays.add(matchDay);
        stateA.matches++;
        stateB.matches++;

        if (isHome) {
          stateA.home++;
          stateB.away++;
        } else {
          stateA.away++;
          stateB.home++;
        }

        const aCountB = stateA.opponentCountries.get(teamB.country.id) || 0;
        stateA.opponentCountries.set(teamB.country.id, aCountB + 1);

        const bCountA = stateB.opponentCountries.get(teamA.country.id) || 0;
        stateB.opponentCountries.set(teamA.country.id, bCountA + 1);

        paired.add(teamA.id);
        paired.add(teamB.id);
      }
    }

    return matches;
  }
}

/* Utils */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
