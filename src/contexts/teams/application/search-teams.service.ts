import { injectable, inject } from "inversify";
import { TYPES } from "../../../shared/container/types.js";
import {
  TeamRepository,
  TeamFilters,
} from "../domain/team.repository.js";
import { TeamEntityPrimitives } from "../domain/team.entity.js";

export interface SearchTeamsParams {
  countryId?: number;
  search?: string;
}

@injectable()
export class SearchTeamsService {
  constructor(
    @inject(TYPES.TeamRepository)
    private readonly teamRepository: TeamRepository
  ) {}

  async run(params: SearchTeamsParams = {}): Promise<TeamEntityPrimitives[]> {
    const filters: TeamFilters = {};
    if (params.countryId) {
      filters.countryId = params.countryId;
    }
    if (params.search) {
      filters.search = params.search;
    }

    const teams = await this.teamRepository.findAll(filters);
    return teams.map((team) => team.toPrimitives());
  }
}
