import { injectable, inject } from "inversify";
import { TYPES } from "../../../shared/container/types.js";
import { DrawRepository } from "../domain/draw.repository.js";

export interface DrawStatistics {
  drawId: number;
  createdAt: Date;
  totalTeams: number;
  totalCountries: number;
  totalMatches: number;
  matchesPerMatchDay: Array<{ matchDay: number; count: number }>;
  teamsPerPot: Array<{ potId: number; count: number }>;
  teamsPerCountry: Array<{
    countryId: number;
    countryName: string;
    count: number;
  }>;
}

@injectable()
export class SearchDrawStatisticsService {
  constructor(
    @inject(TYPES.DrawRepository)
    private readonly drawRepository: DrawRepository
  ) {}

  async run(): Promise<DrawStatistics | null> {
    const draw = await this.drawRepository.searchCurrent();
    if (!draw) {
      return null;
    }

    const primitives = draw.toPrimitives();

    const matchesPerMatchDayMap = new Map<number, number>();
    for (const match of primitives.matches) {
      matchesPerMatchDayMap.set(
        match.matchDay,
        (matchesPerMatchDayMap.get(match.matchDay) ?? 0) + 1
      );
    }
    const matchesPerMatchDay = Array.from(matchesPerMatchDayMap.entries())
      .map(([matchDay, count]) => ({ matchDay, count }))
      .sort((a, b) => a.matchDay - b.matchDay);

    const teamsPerPot = primitives.pots
      .map((pot) => ({ potId: pot.id, count: pot.teams.length }))
      .sort((a, b) => a.potId - b.potId);

    const countryCounts = new Map<number, { name: string; count: number }>();
    const seenTeams = new Set<number>();
    for (const pot of primitives.pots) {
      for (const team of pot.teams) {
        if (seenTeams.has(team.id)) continue;
        seenTeams.add(team.id);

        const current = countryCounts.get(team.country.id);
        if (current) {
          current.count += 1;
        } else {
          countryCounts.set(team.country.id, {
            name: team.country.name,
            count: 1,
          });
        }
      }
    }
    const teamsPerCountry = Array.from(countryCounts.entries())
      .map(([countryId, { name, count }]) => ({
        countryId,
        countryName: name,
        count,
      }))
      .sort((a, b) =>
        b.count - a.count || a.countryName.localeCompare(b.countryName)
      );

    return {
      drawId: primitives.id ?? 0,
      createdAt: primitives.createdAt,
      totalTeams: seenTeams.size,
      totalCountries: countryCounts.size,
      totalMatches: primitives.matches.length,
      matchesPerMatchDay,
      teamsPerPot,
      teamsPerCountry,
    };
  }
}
