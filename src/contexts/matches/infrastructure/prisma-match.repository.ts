import { injectable } from "inversify";
import { PrismaRepository } from "../../../shared/infrastructure/prisma.repository.js";
import { MatchEntity } from "../domain/match.entity.js";
import {
  MatchRepository,
  MatchFilters,
  MatchSort,
  PaginationParams,
  PaginatedMatches,
} from "../domain/match.repository.js";

const MATCH_INCLUDE = {
  homeTeam: { include: { country: true } },
  awayTeam: { include: { country: true } },
} as const;

@injectable()
export class PrismaMatchRepository
  extends PrismaRepository<"Match">
  implements MatchRepository
{
  protected modelName = "Match" as const;

  async findAll(
    filters: MatchFilters,
    pagination: PaginationParams,
    sort?: MatchSort
  ): Promise<PaginatedMatches> {
    const { teamId, countryId, matchDay, matchDayFrom, matchDayTo } = filters;
    const { page, limit } = pagination;

    const where: any = {};
    const andClauses: any[] = [];

    if (teamId) {
      andClauses.push({
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      });
    }

    if (countryId) {
      andClauses.push({
        OR: [
          { homeTeam: { countryId } },
          { awayTeam: { countryId } },
        ],
      });
    }

    if (matchDay !== undefined) {
      where.matchDay = matchDay;
    } else if (matchDayFrom !== undefined || matchDayTo !== undefined) {
      where.matchDay = {
        ...(matchDayFrom !== undefined ? { gte: matchDayFrom } : {}),
        ...(matchDayTo !== undefined ? { lte: matchDayTo } : {}),
      };
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        skip,
        take: limit,
        include: MATCH_INCLUDE,
        orderBy: this.buildOrderBy(sort),
      }),
      this.prisma.match.count({ where }),
    ]);

    const matchEntities = matches.map((match) => this.toEntity(match));

    return {
      matches: matchEntities,
      total,
    };
  }

  async findById(id: number): Promise<MatchEntity | null> {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: MATCH_INCLUDE,
    });

    if (!match) {
      return null;
    }

    return this.toEntity(match);
  }

  private buildOrderBy(sort?: MatchSort): any {
    const order: "asc" | "desc" = sort?.sortOrder ?? "asc";

    switch (sort?.sortBy) {
      case "id":
        return [{ id: order }];
      case "homeTeam":
        return [{ homeTeam: { name: order } }, { matchDay: "asc" }];
      case "awayTeam":
        return [{ awayTeam: { name: order } }, { matchDay: "asc" }];
      case "matchDay":
      default:
        return [{ matchDay: order }, { id: "asc" }];
    }
  }

  private toEntity(match: any): MatchEntity {
    if (!match.homeTeam.country || !match.awayTeam.country) {
      throw new Error(
        `Match ${match.id} has teams without country information`
      );
    }

    return MatchEntity.fromPrimitives({
      id: match.id,
      drawId: match.drawId,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        country: {
          id: match.homeTeam.country.id,
          name: match.homeTeam.country.name,
        },
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        country: {
          id: match.awayTeam.country.id,
          name: match.awayTeam.country.name,
        },
      },
      matchDay: match.matchDay,
    });
  }
}
