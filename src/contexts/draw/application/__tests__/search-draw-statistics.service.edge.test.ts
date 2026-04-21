import { describe, it, expect, beforeEach, vi } from "vitest";
import { SearchDrawStatisticsService } from "../search-draw-statistics.service";
import { DrawRepository } from "../../domain/draw.repository";

const buildEmptyDraw = () => ({
  toPrimitives: () => ({
    id: 1,
    createdAt: new Date("2026-04-21T00:00:00.000Z"),
    pots: [
      { id: 1, teams: [] },
      { id: 2, teams: [] },
      { id: 3, teams: [] },
      { id: 4, teams: [] },
    ],
    matches: [],
  }),
});

const buildDuplicatedTeamsDraw = () => ({
  // Same team appears across pots (shouldn't happen in practice but guards the
  // `seenTeams` dedup path). Also tests stable ordering when counts are tied.
  toPrimitives: () => ({
    id: 2,
    createdAt: new Date("2026-04-21T00:00:00.000Z"),
    pots: [
      {
        id: 1,
        teams: [
          { id: 1, name: "T1", country: { id: 10, name: "Germany" } },
          { id: 2, name: "T2", country: { id: 20, name: "Austria" } },
        ],
      },
      {
        id: 2,
        teams: [
          { id: 1, name: "T1", country: { id: 10, name: "Germany" } },
          { id: 3, name: "T3", country: { id: 10, name: "Germany" } },
        ],
      },
      { id: 3, teams: [] },
      { id: 4, teams: [] },
    ],
    matches: [],
  }),
});

describe("SearchDrawStatisticsService — edge cases", () => {
  let service: SearchDrawStatisticsService;
  let repo: DrawRepository;

  beforeEach(() => {
    repo = {
      save: vi.fn(),
      searchCurrent: vi.fn(),
      findAllTeams: vi.fn(),
      deleteAll: vi.fn(),
    } as unknown as DrawRepository;
    service = new SearchDrawStatisticsService(repo);
  });

  it("returns zeroed aggregates for a draw with empty pots and no matches", async () => {
    vi.mocked(repo.searchCurrent).mockResolvedValue(buildEmptyDraw() as any);

    const result = await service.run();

    expect(result).not.toBeNull();
    expect(result!.totalTeams).toBe(0);
    expect(result!.totalCountries).toBe(0);
    expect(result!.totalMatches).toBe(0);
    expect(result!.matchesPerMatchDay).toEqual([]);
    expect(result!.teamsPerCountry).toEqual([]);
    expect(result!.teamsPerPot).toEqual([
      { potId: 1, count: 0 },
      { potId: 2, count: 0 },
      { potId: 3, count: 0 },
      { potId: 4, count: 0 },
    ]);
  });

  it("deduplicates teams that appear in multiple pots and sorts countries by count desc then name asc", async () => {
    vi.mocked(repo.searchCurrent).mockResolvedValue(
      buildDuplicatedTeamsDraw() as any
    );

    const result = await service.run();

    expect(result!.totalTeams).toBe(3);
    expect(result!.teamsPerCountry).toEqual([
      { countryId: 10, countryName: "Germany", count: 2 },
      { countryId: 20, countryName: "Austria", count: 1 },
    ]);
  });
});
