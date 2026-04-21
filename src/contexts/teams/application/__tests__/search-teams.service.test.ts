import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchTeamsService } from '../search-teams.service';
import { TeamRepository } from '../../domain/team.repository';
import { TeamEntity } from '../../domain/team.entity';

describe('SearchTeamsService', () => {
  let service: SearchTeamsService;
  let mockRepository: TeamRepository;

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
    } as any;

    service = new SearchTeamsService(mockRepository);
  });

  it('should return all teams as primitives when no filters are provided', async () => {
    const teams = [
      TeamEntity.create(1, 'Real Madrid', { id: 1, name: 'Spain' }),
      TeamEntity.create(2, 'Bayern Munich', { id: 2, name: 'Germany' }),
    ];
    vi.mocked(mockRepository.findAll).mockResolvedValue(teams);

    const result = await service.run();

    expect(mockRepository.findAll).toHaveBeenCalledWith({});
    expect(result).toEqual([
      { id: 1, name: 'Real Madrid', country: { id: 1, name: 'Spain' } },
      { id: 2, name: 'Bayern Munich', country: { id: 2, name: 'Germany' } },
    ]);
  });

  it('should forward countryId filter to the repository', async () => {
    vi.mocked(mockRepository.findAll).mockResolvedValue([]);

    await service.run({ countryId: 3 });

    expect(mockRepository.findAll).toHaveBeenCalledWith({ countryId: 3 });
  });

  it('should forward search filter to the repository', async () => {
    vi.mocked(mockRepository.findAll).mockResolvedValue([]);

    await service.run({ search: 'Madrid' });

    expect(mockRepository.findAll).toHaveBeenCalledWith({ search: 'Madrid' });
  });

  it('should combine countryId and search filters', async () => {
    vi.mocked(mockRepository.findAll).mockResolvedValue([]);

    await service.run({ countryId: 1, search: 'Real' });

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      countryId: 1,
      search: 'Real',
    });
  });
});
