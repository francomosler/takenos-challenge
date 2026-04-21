import { injectable, inject } from "inversify";
import { TYPES } from "../../../shared/container/types.js";
import {
  MatchRepository,
  MatchFilters,
  MatchSort,
  MatchSortField,
  PaginationParams,
  SortOrder,
} from "../domain/match.repository.js";

export interface SearchMatchesParams {
  teamId?: number;
  countryId?: number;
  matchDay?: number;
  matchDayFrom?: number;
  matchDayTo?: number;
  page?: number;
  limit?: number;
  sortBy?: MatchSortField;
  sortOrder?: SortOrder;
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
    const DEFAULT_LIMIT = 10;
    const MAX_LIMIT = 100;

    if (params.page !== undefined && params.page < 1) {
      throw new Error("Page must be greater than 0");
    }

    const page = params.page || 1;

    let limit = params.limit || DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) {
      limit = DEFAULT_LIMIT;
    }

    const filters: MatchFilters = {};
    if (params.teamId) {
      filters.teamId = params.teamId;
    }
    if (params.countryId) {
      filters.countryId = params.countryId;
    }
    if (params.matchDay) {
      filters.matchDay = params.matchDay;
    }
    if (params.matchDayFrom) {
      filters.matchDayFrom = params.matchDayFrom;
    }
    if (params.matchDayTo) {
      filters.matchDayTo = params.matchDayTo;
    }

    const pagination: PaginationParams = {
      page,
      limit,
    };

    const hasSort = params.sortBy !== undefined || params.sortOrder !== undefined;
    const sort: MatchSort | undefined = hasSort
      ? { sortBy: params.sortBy, sortOrder: params.sortOrder }
      : undefined;

    const { matches, total } = sort
      ? await this.matchRepository.findAll(filters, pagination, sort)
      : await this.matchRepository.findAll(filters, pagination);

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
