import { describe, it, expect, beforeEach, vi } from "vitest";
import { SearchMatchesService } from "../search-matches.service";
import { MatchRepository } from "../../domain/match.repository";

describe("SearchMatchesService — edge cases", () => {
  let service: SearchMatchesService;
  let mockRepository: MatchRepository;

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn().mockResolvedValue({ matches: [], total: 0 }),
      findById: vi.fn(),
    } as unknown as MatchRepository;

    service = new SearchMatchesService(mockRepository);
  });

  it("returns totalPages = 0 when total is 0", async () => {
    const result = await service.run({});
    expect(result.pagination.totalPages).toBe(0);
  });

  it("rounds up totalPages when total is not a multiple of limit", async () => {
    vi.mocked(mockRepository.findAll).mockResolvedValue({
      matches: [],
      total: 23,
    });

    const result = await service.run({ limit: 10 });

    expect(result.pagination.totalPages).toBe(3);
  });

  it("falls back to limit = 10 when limit exceeds the max", async () => {
    await service.run({ limit: 9999 });

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      {},
      { page: 1, limit: 10 }
    );
  });

  it("accepts limit = 100 (boundary)", async () => {
    await service.run({ limit: 100 });

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      {},
      { page: 1, limit: 100 }
    );
  });

  it("forwards an arbitrarily high page even if there are no results", async () => {
    vi.mocked(mockRepository.findAll).mockResolvedValue({
      matches: [],
      total: 5,
    });

    const result = await service.run({ page: 500, limit: 10 });

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      {},
      { page: 500, limit: 10 }
    );
    expect(result.matches).toEqual([]);
    expect(result.pagination.page).toBe(500);
  });

  it("does not include undefined filter values in the filters object", async () => {
    await service.run({ teamId: undefined, matchDay: undefined });

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      {},
      { page: 1, limit: 10 }
    );
  });

  it("still forwards sort when only sortOrder is provided (sortBy falls back in the adapter)", async () => {
    await service.run({ sortOrder: "desc" });

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      {},
      { page: 1, limit: 10 },
      { sortBy: undefined, sortOrder: "desc" }
    );
  });

  it("throws when page is a decimal below 1", async () => {
    await expect(service.run({ page: 0.5 })).rejects.toThrow(
      "Page must be greater than 0"
    );
  });
});
