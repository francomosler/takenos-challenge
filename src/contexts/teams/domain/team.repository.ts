import { TeamEntity } from "./team.entity";

export interface TeamFilters {
  countryId?: number;
  search?: string;
}

export interface TeamRepository {
  findAll(filters?: TeamFilters): Promise<TeamEntity[]>;
  findById(id: number): Promise<TeamEntity | null>;
}
