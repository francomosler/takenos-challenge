import { ValueObject } from "../../../shared/domain/value-object";

interface MatchProps {
  id: number;
  drawId: number;
  homeTeam: number;
  awayTeam: number;
  matchDay: number;
}

export interface MatchPrimitives {
  id: number;
  drawId: number;
  homeTeamId: number;
  awayTeamId: number;
  matchDay: number;
}

export class Match extends ValueObject<MatchProps> {
  private constructor(
    id: number,
    drawId: number,
    homeTeam: number,
    awayTeam: number,
    matchDay: number
  ) {
    super({ id, drawId, homeTeam, awayTeam, matchDay });
  }

  public static create(
    id: number,
    drawId: number,
    homeTeam: number,
    awayTeam: number,
    matchDay: number
  ): Match {
    return new Match(id, drawId, homeTeam, awayTeam, matchDay);
  }

  get id(): number {
    return this.props.id;
  }

  get drawId(): number {
    return this.props.drawId;
  }

  get matchDay(): number {
    return this.props.matchDay;
  }

  get homeTeamId(): number {
    return this.props.homeTeam;
  }

  get awayTeamId(): number {
    return this.props.awayTeam;
  }

  public static fromPrimitives(params: MatchPrimitives): Match {
    const { id, drawId, homeTeamId, awayTeamId, matchDay } = params;
    return new Match(id, drawId, homeTeamId, awayTeamId, matchDay);
  }

  public toPrimitives(): MatchPrimitives {
    return {
      id: this.props.id,
      drawId: this.props.drawId,
      homeTeamId: this.props.homeTeam,
      awayTeamId: this.props.awayTeam,
      matchDay: this.props.matchDay,
    };
  }
}
