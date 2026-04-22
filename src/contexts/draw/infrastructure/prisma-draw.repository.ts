import { injectable } from "inversify";
import { Prisma } from "@prisma";
import { PrismaRepository } from "../../../shared/infrastructure/prisma.repository.js";
import { Draw } from "../domain/draw.js";
import { DrawRepository } from "../domain/draw.repository.js";
import { Team } from "../domain/team.js";
import { Country } from "../domain/country.js";
import { DrawAlreadyExistsError } from "../domain/exceptions/draw-already-exists.error.js";

// Sentinel value stored in Draw.activeSingleton for the active row.
// Archived rows store NULL, which DBs treat as distinct from anything
// (including other NULLs) under a UNIQUE constraint.
const ACTIVE_SINGLETON: number = 1;

@injectable()
export class PrismaDrawRepository
  extends PrismaRepository<"Draw">
  implements DrawRepository
{
  protected modelName = "Draw" as const;

  public async save(draw: Draw): Promise<void> {
    const primitives = draw.toPrimitives();

    const teamPotAssignments: Array<{ teamId: number; potId: number }> = [];
    for (const pot of primitives.pots) {
      for (const team of pot.teams) {
        teamPotAssignments.push({
          teamId: team.id,
          potId: pot.id,
        });
      }
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const savedDraw = await tx.draw.upsert({
          where: { id: primitives.id ?? 0 },
          create: {
            createdAt: primitives.createdAt,
            activeSingleton: ACTIVE_SINGLETON,
            drawTeamPots: {
              create: teamPotAssignments,
            },
          },
          update: {
            createdAt: primitives.createdAt,
            drawTeamPots: {
              deleteMany: {},
              create: teamPotAssignments,
            },
          },
        });

        await tx.match.deleteMany({
          where: { drawId: savedDraw.id },
        });

        if (primitives.matches.length > 0) {
          await tx.match.createMany({
            data: primitives.matches.map((match) => ({
              drawId: savedDraw.id,
              homeTeamId: match.homeTeam.id,
              awayTeamId: match.awayTeam.id,
              matchDay: match.matchDay,
            })),
          });
        }
      });
    } catch (error) {
      // P2002 = unique constraint violation. With activeSingleton being
      // UNIQUE, this is how the DB tells us two requests tried to create a
      // draw concurrently. Map it to a domain error so the router returns 409.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new DrawAlreadyExistsError();
      }
      throw error;
    }
  }

  public async searchCurrent(): Promise<Draw | null> {
    // Single query with nested includes so the whole aggregate is read as one
    // DB snapshot. This removes the previous TOCTOU window between the three
    // separate queries (draw / teams / matches) where a concurrent DELETE or
    // re-creation could surface an inconsistent view to the client.
    const drawRecord = await this.model.findFirst({
      where: { activeSingleton: ACTIVE_SINGLETON },
      include: {
        drawTeamPots: {
          include: {
            team: { include: { country: true } },
          },
        },
        matches: {
          orderBy: { id: "asc" },
          include: {
            homeTeam: { include: { country: true } },
            awayTeam: { include: { country: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!drawRecord) {
      return null;
    }

    const pots: Array<{
      id: number;
      teams: Array<{
        id: number;
        name: string;
        country: { id: number; name: string };
      }>;
    }> = [];

    for (let potId = 1; potId <= 4; potId++) {
      const teamsInPot = drawRecord.drawTeamPots
        .filter((dtp: any) => dtp.potId === potId)
        .map((dtp: any) => {
          if (!dtp.team || !dtp.team.country) {
            throw new Error(
              `Team ${dtp.teamId} not found or has no country`
            );
          }
          return {
            id: dtp.team.id,
            name: dtp.team.name,
            country: {
              id: dtp.team.country.id,
              name: dtp.team.country.name,
            },
          };
        });

      pots.push({ id: potId, teams: teamsInPot });
    }

    return Draw.fromPrimitives({
      id: drawRecord.id,
      createdAt: drawRecord.createdAt,
      pots,
      matches: drawRecord.matches.map((match: any) => {
        if (!match.homeTeam || !match.homeTeam.country) {
          throw new Error(
            `Home team ${match.homeTeamId} not found or has no country`
          );
        }
        if (!match.awayTeam || !match.awayTeam.country) {
          throw new Error(
            `Away team ${match.awayTeamId} not found or has no country`
          );
        }

        return {
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
        };
      }),
    });
  }

  public async findAllTeams(): Promise<Team[]> {
    const teams = await this.prisma.team.findMany({
      include: {
        country: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return teams.map((team: any) => {
      if (!team.country) {
        throw new Error(`Team ${team.id} has no country`);
      }
      return Team.create(
        team.id,
        team.name,
        Country.create(team.country.id, team.country.name)
      );
    });
  }

  public async archiveCurrent(): Promise<void> {
    // Releases the unique activeSingleton slot without deleting data.
    // Using updateMany + where: { activeSingleton: 1 } keeps this idempotent
    // and race-free: at most one row ever matches the predicate, and the DB
    // applies the update atomically.
    await this.model.updateMany({
      where: { activeSingleton: ACTIVE_SINGLETON },
      data: {
        activeSingleton: null,
        archivedAt: new Date(),
      },
    });
  }
}
