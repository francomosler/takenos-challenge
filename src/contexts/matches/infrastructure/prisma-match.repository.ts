import { injectable } from "inversify";
import { PrismaRepository } from "../../../shared/infrastructure/prisma.repository.js";
import { MatchEntity } from "../domain/match.entity.js";
import {
  MatchRepository,
  MatchFilters,
  PaginationParams,
  PaginatedMatches,
} from "../domain/match.repository.js";

@injectable()
export class PrismaMatchRepository
  extends PrismaRepository<"Match">
  implements MatchRepository
{
  protected modelName = "Match" as const;

  async findAll(
    filters: MatchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedMatches> {
    const { teamId, matchDay } = filters;
    const { page, limit } = pagination;

    const where: any = {};

    if (teamId) {
      where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }

    if (matchDay) {
      where.matchDay = matchDay;
    }

    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        skip,
        take: limit,
        include: {
          homeTeam: {
            include: {
              country: true,
            },
          },
          awayTeam: {
            include: {
              country: true,
            },
          },
        },
        orderBy: [{ matchDay: "asc" }, { id: "asc" }],
      }),
      this.prisma.match.count({ where }),
    ]);

    const matchEntities = matches.map((match) => {
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
    });

    return {
      matches: matchEntities,
      total,
    };
  }
}
