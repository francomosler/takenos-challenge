import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchDrawStatisticsService } from '../search-draw-statistics.service';
import { DrawRepository } from '../../domain/draw.repository';

const buildDrawStub = () => {
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const primitives = {
    id: 7,
    createdAt,
    pots: [
      {
        id: 1,
        teams: [
          { id: 1, name: 'Team A1', country: { id: 10, name: 'Spain' } },
          { id: 2, name: 'Team A2', country: { id: 20, name: 'England' } },
        ],
      },
      {
        id: 2,
        teams: [
          { id: 3, name: 'Team B1', country: { id: 10, name: 'Spain' } },
        ],
      },
      { id: 3, teams: [] },
      { id: 4, teams: [] },
    ],
    matches: [
      {
        id: 1,
        drawId: 7,
        homeTeam: { id: 1, name: 'Team A1', country: { id: 10, name: 'Spain' } },
        awayTeam: { id: 2, name: 'Team A2', country: { id: 20, name: 'England' } },
        matchDay: 1,
      },
      {
        id: 2,
        drawId: 7,
        homeTeam: { id: 2, name: 'Team A2', country: { id: 20, name: 'England' } },
        awayTeam: { id: 3, name: 'Team B1', country: { id: 10, name: 'Spain' } },
        matchDay: 1,
      },
      {
        id: 3,
        drawId: 7,
        homeTeam: { id: 1, name: 'Team A1', country: { id: 10, name: 'Spain' } },
        awayTeam: { id: 3, name: 'Team B1', country: { id: 10, name: 'Spain' } },
        matchDay: 2,
      },
    ],
  };

  return { toPrimitives: () => primitives, createdAt } as any;
};

describe('SearchDrawStatisticsService', () => {
  let service: SearchDrawStatisticsService;
  let mockRepository: DrawRepository;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      searchCurrent: vi.fn(),
      findAllTeams: vi.fn(),
      archiveCurrent: vi.fn(),
    } as any;

    service = new SearchDrawStatisticsService(mockRepository);
  });

  it('should return null when no draw exists', async () => {
    vi.mocked(mockRepository.searchCurrent).mockResolvedValue(null);

    const result = await service.run();

    expect(result).toBeNull();
  });

  it('should aggregate totals, matches per match day, teams per pot and per country', async () => {
    vi.mocked(mockRepository.searchCurrent).mockResolvedValue(buildDrawStub());

    const result = await service.run();

    expect(result).not.toBeNull();
    expect(result!.drawId).toBe(7);
    expect(result!.totalTeams).toBe(3);
    expect(result!.totalCountries).toBe(2);
    expect(result!.totalMatches).toBe(3);

    expect(result!.matchesPerMatchDay).toEqual([
      { matchDay: 1, count: 2 },
      { matchDay: 2, count: 1 },
    ]);

    expect(result!.teamsPerPot).toEqual([
      { potId: 1, count: 2 },
      { potId: 2, count: 1 },
      { potId: 3, count: 0 },
      { potId: 4, count: 0 },
    ]);

    expect(result!.teamsPerCountry).toEqual([
      { countryId: 10, countryName: 'Spain', count: 2 },
      { countryId: 20, countryName: 'England', count: 1 },
    ]);
  });
});
