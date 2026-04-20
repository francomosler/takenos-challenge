import { injectable, inject } from "inversify";
import { TYPES } from "../../../shared/container/types.js";
import {
  MatchRepository,
  MatchFilters,
  PaginationParams,
} from "../domain/match.repository.js";

export interface SearchMatchesParams {
  teamId?: number;
  matchDay?: number;
  page?: number;
  limit?: number;
}

export interface SearchMatchesResult {
  matches: Array<{
    id: string;
    homeTeam: {
      id: number;
      name: string;
      country: {
        id: number;
        name: string;
      };
    };
    awayTeam: {
      id: number;
      name: string;
      country: {
        id: number;
        name: string;
      };
    };
    matchDay: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@injectable()
export class SearchMatchesService {
  constructor(
    @inject(TYPES.MatchRepository)
    private readonly matchRepository: MatchRepository
  ) {}

  async run(params: SearchMatchesParams): Promise<SearchMatchesResult> {
    const page = params.page || 1;
    const limit = params.limit || 10;

    const filters: MatchFilters = {};
    if (params.teamId) {
      filters.teamId = params.teamId;
    }
    if (params.matchDay) {
      filters.matchDay = params.matchDay;
    }

    const pagination: PaginationParams = {
      page,
      limit,
    };

    const { matches, total } = await this.matchRepository.findAll(
      filters,
      pagination
    );

    const totalPages = Math.ceil(total / limit);

    const matchesPrimitives = matches.map((match) => match.toPrimitives());

    return {
      matches: matchesPrimitives,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
