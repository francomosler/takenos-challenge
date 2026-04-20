import { AggregateRoot } from "../../../shared/domain/aggregate-root";

export interface TeamData {
  id: number;
  name: string;
  country: {
    id: number;
    name: string;
  };
}

export interface MatchPrimitives {
  id: string;
  homeTeam: TeamData;
  awayTeam: TeamData;
  matchDay: number;
}

export class MatchEntity extends AggregateRoot {
  private constructor(
    readonly id: number,
    readonly drawId: number,
    readonly homeTeam: TeamData,
    readonly awayTeam: TeamData,
    readonly matchDay: number
  ) {
    super();
  }

  public static create(
    id: number,
    drawId: number,
    homeTeam: TeamData,
    awayTeam: TeamData,
    matchDay: number
  ): MatchEntity {
    return new MatchEntity(id, drawId, homeTeam, awayTeam, matchDay);
  }

  public static fromPrimitives(primitives: {
    id: number;
    drawId: number;
    homeTeam: TeamData;
    awayTeam: TeamData;
    matchDay: number;
  }): MatchEntity {
    return new MatchEntity(
      primitives.id,
      primitives.drawId,
      primitives.homeTeam,
      primitives.awayTeam,
      primitives.matchDay
    );
  }

  public toPrimitives(): MatchPrimitives {
    return {
      id: this.id.toString(),
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      matchDay: this.matchDay,
    };
  }
}
