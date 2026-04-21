import { injectable } from "inversify";
import { PrismaRepository } from "../../../shared/infrastructure/prisma.repository.js";
import { TeamEntity } from "../domain/team.entity.js";
import {
  TeamRepository,
  TeamFilters,
} from "../domain/team.repository.js";

@injectable()
export class PrismaTeamRepository
  extends PrismaRepository<"Team">
  implements TeamRepository
{
  protected modelName = "Team" as const;

  async findAll(filters: TeamFilters = {}): Promise<TeamEntity[]> {
    const where: any = {};

    if (filters.countryId) {
      where.countryId = filters.countryId;
    }

    if (filters.search) {
      where.name = { contains: filters.search };
    }

    const teams = await this.prisma.team.findMany({
      where,
      include: { country: true },
      orderBy: { name: "asc" },
    });

    return teams.map((team: any) => this.toEntity(team));
  }

  async findById(id: number): Promise<TeamEntity | null> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { country: true },
    });

    if (!team) {
      return null;
    }

    return this.toEntity(team);
  }

  private toEntity(team: any): TeamEntity {
    if (!team.country) {
      throw new Error(`Team ${team.id} has no country`);
    }

    return TeamEntity.create(team.id, team.name, {
      id: team.country.id,
      name: team.country.name,
    });
  }
}
