import { MatchEntity } from "./match.entity";

export interface MatchFilters {
  teamId?: number;
  matchDay?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedMatches {
  matches: MatchEntity[];
  total: number;
}

export interface MatchRepository {
  findAll(
    filters: MatchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedMatches>;
}
