import { MatchEntity } from "./match.entity";

export interface MatchFilters {
  teamId?: number;
  countryId?: number;
  matchDay?: number;
  matchDayFrom?: number;
  matchDayTo?: number;
}

export type MatchSortField = "matchDay" | "id" | "homeTeam" | "awayTeam";
export type SortOrder = "asc" | "desc";

export interface MatchSort {
  sortBy?: MatchSortField;
  sortOrder?: SortOrder;
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
    pagination: PaginationParams,
    sort?: MatchSort
  ): Promise<PaginatedMatches>;
  findById(id: number): Promise<MatchEntity | null>;
}
