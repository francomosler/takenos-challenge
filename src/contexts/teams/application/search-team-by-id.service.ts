import { injectable, inject } from "inversify";
import { TYPES } from "../../../shared/container/types.js";
import { TeamRepository } from "../domain/team.repository.js";
import { TeamNotFoundError } from "../domain/exceptions/team-not-found.error.js";
import { TeamEntityPrimitives } from "../domain/team.entity.js";
import { MatchRepository } from "../../matches/domain/match.repository.js";
import { MatchPrimitives } from "../../matches/domain/match.entity.js";

export interface TeamDetailResult {
  team: TeamEntityPrimitives;
  matches: MatchPrimitives[];
}

@injectable()
export class SearchTeamByIdService {
  constructor(
    @inject(TYPES.TeamRepository)
    private readonly teamRepository: TeamRepository,
    @inject(TYPES.MatchRepository)
    private readonly matchRepository: MatchRepository
  ) {}

  async run(id: number): Promise<TeamDetailResult> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Team id must be a positive integer");
    }

    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new TeamNotFoundError(id);
    }

    // All the team's matches across the current draw, ordered by matchday.
    // We don't paginate here because a team plays only 8 matches per draw.
    const { matches } = await this.matchRepository.findAll(
      { teamId: id },
      { page: 1, limit: 100 },
      { sortBy: "matchDay", sortOrder: "asc" }
    );

    return {
      team: team.toPrimitives(),
      matches: matches.map((match) => match.toPrimitives()),
    };
  }
}
