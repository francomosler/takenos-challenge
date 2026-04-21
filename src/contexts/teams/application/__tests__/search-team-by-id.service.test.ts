import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchTeamByIdService } from '../search-team-by-id.service';
import { TeamRepository } from '../../domain/team.repository';
import { TeamEntity } from '../../domain/team.entity';
import { TeamNotFoundError } from '../../domain/exceptions/team-not-found.error';
import { MatchRepository } from '../../../matches/domain/match.repository';
import { MatchEntity } from '../../../matches/domain/match.entity';

describe('SearchTeamByIdService', () => {
  let service: SearchTeamByIdService;
  let mockTeamRepository: TeamRepository;
  let mockMatchRepository: MatchRepository;

  beforeEach(() => {
    mockTeamRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
    } as any;

    mockMatchRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
    } as any;

    service = new SearchTeamByIdService(mockTeamRepository, mockMatchRepository);
  });

  it('should return the team with its matches when found', async () => {
    const team = TeamEntity.create(1, 'Real Madrid', {
      id: 1,
      name: 'Spain',
    });
    const match = MatchEntity.fromPrimitives({
      id: 10,
      drawId: 1,
      homeTeam: { id: 1, name: 'Real Madrid', country: { id: 1, name: 'Spain' } },
      awayTeam: {
        id: 2,
        name: 'Bayern Munich',
        country: { id: 2, name: 'Germany' },
      },
      matchDay: 1,
    });

    vi.mocked(mockTeamRepository.findById).mockResolvedValue(team);
    vi.mocked(mockMatchRepository.findAll).mockResolvedValue({
      matches: [match],
      total: 1,
    });

    const result = await service.run(1);

    expect(mockTeamRepository.findById).toHaveBeenCalledWith(1);
    expect(mockMatchRepository.findAll).toHaveBeenCalledWith(
      { teamId: 1 },
      { page: 1, limit: 100 },
      { sortBy: 'matchDay', sortOrder: 'asc' }
    );
    expect(result.team).toEqual({
      id: 1,
      name: 'Real Madrid',
      country: { id: 1, name: 'Spain' },
    });
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].id).toBe('10');
  });

  it('should throw TeamNotFoundError when the team does not exist', async () => {
    vi.mocked(mockTeamRepository.findById).mockResolvedValue(null);

    await expect(service.run(999)).rejects.toBeInstanceOf(TeamNotFoundError);
    expect(mockMatchRepository.findAll).not.toHaveBeenCalled();
  });

  it('should reject ids that are not positive integers', async () => {
    await expect(service.run(0)).rejects.toThrow(
      'Team id must be a positive integer'
    );
    await expect(service.run(-1)).rejects.toThrow(
      'Team id must be a positive integer'
    );
    expect(mockTeamRepository.findById).not.toHaveBeenCalled();
  });
});
