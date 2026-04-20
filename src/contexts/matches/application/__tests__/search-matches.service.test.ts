import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchMatchesService } from '../search-matches.service';
import { MatchRepository } from '../../domain/match.repository';
import { MatchEntity } from '../../domain/match.entity';

describe('SearchMatchesService', () => {
  let service: SearchMatchesService;
  let mockRepository: MatchRepository;

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
    } as any;

    service = new SearchMatchesService(mockRepository);
  });

  describe('run', () => {
    it('should return matches with default pagination when no params provided', async () => {
      // Arrange
      const mockMatches = [
        MatchEntity.fromPrimitives({
          id: 1,
          drawId: 1,
          homeTeam: {
            id: 1,
            name: 'Real Madrid',
            country: { id: 1, name: 'Spain' },
          },
          awayTeam: {
            id: 2,
            name: 'Barcelona',
            country: { id: 1, name: 'Spain' },
          },
          matchDay: 1,
        }),
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue({
        matches: mockMatches,
        total: 1,
      });

      // Act
      const result = await service.run({});

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 10 }
      );
      expect(result.matches).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by teamId when provided', async () => {
      // Arrange
      const teamId = 5;
      vi.mocked(mockRepository.findAll).mockResolvedValue({
        matches: [],
        total: 0,
      });

      // Act
      await service.run({ teamId });

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { teamId },
        { page: 1, limit: 10 }
      );
    });

    it('should filter by matchDay when provided', async () => {
      // Arrange
      const matchDay = 3;
      vi.mocked(mockRepository.findAll).mockResolvedValue({
        matches: [],
        total: 0,
      });

      // Act
      await service.run({ matchDay });

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { matchDay },
        { page: 1, limit: 10 }
      );
    });

    it('should use custom pagination when provided', async () => {
      // Arrange
      const page = 2;
      const limit = 20;
      vi.mocked(mockRepository.findAll).mockResolvedValue({
        matches: [],
        total: 50,
      });

      // Act
      const result = await service.run({ page, limit });

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        {},
        { page: 2, limit: 20 }
      );
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should throw error when page is less than 1', async () => {
      // Act & Assert
      await expect(service.run({ page: 0 })).rejects.toThrow(
        'Page must be greater than 0'
      );
    });

    it('should throw error when negative page provided', async () => {
      // Act & Assert
      await expect(service.run({ page: -1 })).rejects.toThrow(
        'Page must be greater than 0'
      );
    });

    it('should limit max results to 100', async () => {
      // Arrange
      vi.mocked(mockRepository.findAll).mockResolvedValue({
        matches: [],
        total: 0,
      });

      // Act
      await service.run({ limit: 150 });

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 10 }
      );
    });

    it('should combine multiple filters', async () => {
      // Arrange
      const teamId = 10;
      const matchDay = 5;
      const page = 3;
      const limit = 15;

      vi.mocked(mockRepository.findAll).mockResolvedValue({
        matches: [],
        total: 100,
      });

      // Act
      const result = await service.run({ teamId, matchDay, page, limit });

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { teamId, matchDay },
        { page: 3, limit: 15 }
      );
      expect(result.pagination.totalPages).toBe(7);
    });

    it('should return correct match primitives', async () => {
      // Arrange
      const mockMatches = [
        MatchEntity.fromPrimitives({
          id: 1,
          drawId: 1,
          homeTeam: {
            id: 10,
            name: 'Bayern Munich',
            country: { id: 3, name: 'Germany' },
          },
          awayTeam: {
            id: 20,
            name: 'Manchester City',
            country: { id: 2, name: 'England' },
          },
          matchDay: 4,
        }),
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue({
        matches: mockMatches,
        total: 1,
      });

      // Act
      const result = await service.run({});

      // Assert
      expect(result.matches[0]).toEqual({
        id: '1',
        homeTeam: {
          id: 10,
          name: 'Bayern Munich',
          country: { id: 3, name: 'Germany' },
        },
        awayTeam: {
          id: 20,
          name: 'Manchester City',
          country: { id: 2, name: 'England' },
        },
        matchDay: 4,
      });
    });
  });
});
