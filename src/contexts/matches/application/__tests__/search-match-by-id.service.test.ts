import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchMatchByIdService } from '../search-match-by-id.service';
import { MatchRepository } from '../../domain/match.repository';
import { MatchEntity } from '../../domain/match.entity';
import { MatchNotFoundError } from '../../domain/exceptions/match-not-found.error';

describe('SearchMatchByIdService', () => {
  let service: SearchMatchByIdService;
  let mockRepository: MatchRepository;

  const buildMatch = (id: number) =>
    MatchEntity.fromPrimitives({
      id,
      drawId: 1,
      homeTeam: {
        id: 1,
        name: 'Real Madrid',
        country: { id: 1, name: 'Spain' },
      },
      awayTeam: {
        id: 2,
        name: 'Bayern Munich',
        country: { id: 2, name: 'Germany' },
      },
      matchDay: 3,
    });

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
    } as any;

    service = new SearchMatchByIdService(mockRepository);
  });

  it('should return the match primitives when found', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(buildMatch(42));

    const result = await service.run(42);

    expect(mockRepository.findById).toHaveBeenCalledWith(42);
    expect(result).toEqual({
      id: '42',
      homeTeam: {
        id: 1,
        name: 'Real Madrid',
        country: { id: 1, name: 'Spain' },
      },
      awayTeam: {
        id: 2,
        name: 'Bayern Munich',
        country: { id: 2, name: 'Germany' },
      },
      matchDay: 3,
    });
  });

  it('should throw MatchNotFoundError when the match does not exist', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    await expect(service.run(999)).rejects.toBeInstanceOf(MatchNotFoundError);
  });

  it('should reject ids that are not positive integers', async () => {
    await expect(service.run(0)).rejects.toThrow(
      'Match id must be a positive integer'
    );
    await expect(service.run(-3)).rejects.toThrow(
      'Match id must be a positive integer'
    );
    await expect(service.run(1.5)).rejects.toThrow(
      'Match id must be a positive integer'
    );
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });
});
