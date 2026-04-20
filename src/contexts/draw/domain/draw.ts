import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { DrawService } from "./application/draw-assigner.service";
import { Match } from "./match";
import { Team, TeamPrimitives } from "./team";

export interface PotAssignment {
  team: Team;
  potId: number;
}

export interface PotPrimitives {
  id: number;
  teams: TeamPrimitives[];
}

export interface DrawMatchPrimitives {
  id?: number;
  drawId: number;
  homeTeam: TeamPrimitives;
  awayTeam: TeamPrimitives;
  matchDay: number;
}

export interface DrawPrimitives {
  id?: number;
  createdAt: Date;
  pots: PotPrimitives[];
  matches: DrawMatchPrimitives[];
}

interface TeamSchedule {
  teamId: number;
  opponents: Set<number>;
  homeMatches: number;
  awayMatches: number;
  matchesByMatchDay: Map<number, number>;
  opponentsByPot: Map<number, number>;
}

export class Draw extends AggregateRoot {
  private teams: Team[] = [];
  private matches: Match[] = [];
  private teamPotAssignments: Map<number, number> = new Map();

  private constructor(
    public readonly id: number | null,
    public readonly createdAt: Date,
    teams: Team[],
    matches: Match[],
    teamPotAssignments: Map<number, number>
  ) {
    super();

    this.teams = teams;

    this.matches = matches;

    if (teamPotAssignments) {
      this.teamPotAssignments = teamPotAssignments;
    }
  }

  public static create(
    teams: Team[],
    potAssignments: Map<number, number>
  ): Draw {
    if (teams.length !== 36) {
      throw new Error("Draw requires exactly 36 teams");
    }

    const matches: Match[] = [];
    const draw = new Draw(null, new Date(), teams, matches, potAssignments);
    draw.generateMatches();
    return draw;
  }

  private generateMatches(): void {
    // Use 1 as temporary drawId - will be updated when saved to DB
    this.matches = DrawService.generateMatches(
      this.teams,
      this.teamPotAssignments,
      1
    );
  }

  public getTeamIdsByPot(potId: number): number[] {
    const teamIds: number[] = [];
    for (const [teamId, assignedPotId] of this.teamPotAssignments.entries()) {
      if (assignedPotId === potId) {
        teamIds.push(teamId);
      }
    }
    return teamIds;
  }

  public getPotByTeamId(teamId: number): number | null {
    return this.teamPotAssignments.get(teamId) ?? null;
  }

  public getTeams(): Team[] {
    return [...this.teams];
  }

  public getMatches(): Match[] {
    return [...this.matches];
  }

  public static fromPrimitives(primitives: DrawPrimitives): Draw {
    const teams: Team[] = [];
    const teamPotAssignments = new Map<number, number>();

    for (const pot of primitives.pots) {
      for (const teamPrimitive of pot.teams) {
        const team = Team.fromPrimitives(teamPrimitive);
        teams.push(team);
        teamPotAssignments.set(teamPrimitive.id, pot.id);
      }
    }

    const matches = primitives.matches.map((m) =>
      Match.fromPrimitives({
        id: m.id || 1,
        drawId: m.drawId,
        homeTeamId: m.homeTeam.id,
        awayTeamId: m.awayTeam.id,
        matchDay: m.matchDay,
      })
    );

    const draw = new Draw(
      primitives.id ?? null,
      primitives.createdAt,
      teams,
      matches,
      teamPotAssignments
    );
    return draw;
  }

  public toPrimitives(): DrawPrimitives {
    const teamMap = new Map<number, Team>();
    for (const team of this.teams) {
      teamMap.set(team.id, team);
    }

    const pots: PotPrimitives[] = [];
    for (let potId = 1; potId <= 4; potId++) {
      const teamIdsInPot = this.getTeamIdsByPot(potId);
      const teamsInPot = teamIdsInPot
        .map((teamId) => teamMap.get(teamId)!)
        .filter((team) => team !== undefined)
        .map((team) => team.toPrimitives());

      pots.push({
        id: potId,
        teams: teamsInPot,
      });
    }

    const matches: DrawMatchPrimitives[] = this.matches.map((match) => {
      const matchPrimitives = match.toPrimitives();
      const homeTeam = teamMap.get(matchPrimitives.homeTeamId);
      const awayTeam = teamMap.get(matchPrimitives.awayTeamId);

      if (!homeTeam || !awayTeam) {
        throw new Error("Match references non-existent team");
      }

      return {
        id: matchPrimitives.id,
        drawId: matchPrimitives.drawId,
        homeTeam: homeTeam.toPrimitives(),
        awayTeam: awayTeam.toPrimitives(),
        matchDay: matchPrimitives.matchDay,
      };
    });

    return {
      id: this.id || 0,
      createdAt: this.createdAt,
      pots,
      matches,
    };
  }
}
