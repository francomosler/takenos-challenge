import { Team } from "../team";

export class PotAssigner {
  private static readonly POTS = 4;
  private static readonly TEAMS_PER_POT = 9;

  static fromTeamList(teams: Team[]): Map<number, number> {
    if (teams.length !== 36) {
      throw new Error("Pot assignment requires exactly 36 teams");
    }

    const assignments = new Map<number, number>();

    teams.forEach((team, index) => {
      const pot = Math.floor(index / this.TEAMS_PER_POT) + 1;
      assignments.set(team.id, pot);
    });

    return assignments;
  }
}
