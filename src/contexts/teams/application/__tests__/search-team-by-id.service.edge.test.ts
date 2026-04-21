import { describe, it, expect, beforeEach, vi } from "vitest";
import { SearchTeamByIdService } from "../search-team-by-id.service";
import { TeamRepository } from "../../domain/team.repository";
import { TeamEntity } from "../../domain/team.entity";
import { MatchRepository } from "../../../matches/domain/match.repository";

describe("SearchTeamByIdService — edge cases", () => {
  let service: SearchTeamByIdService;
  let teamRepo: TeamRepository;
  let matchRepo: MatchRepository;

  beforeEach(() => {
    teamRepo = { findAll: vi.fn(), findById: vi.fn() } as unknown as TeamRepository;
    matchRepo = { findAll: vi.fn(), findById: vi.fn() } as unknown as MatchRepository;
    service = new SearchTeamByIdService(teamRepo, matchRepo);
  });

  it("rejects non-integer ids (e.g. NaN, decimals)", async () => {
    await expect(service.run(NaN)).rejects.toThrow(
      "Team id must be a positive integer"
    );
    await expect(service.run(1.5)).rejects.toThrow(
      "Team id must be a positive integer"
    );
    expect(teamRepo.findById).not.toHaveBeenCalled();
  });

  it("returns an empty matches list when the team exists but has no matches yet", async () => {
    const team = TeamEntity.create(42, "Ajax", { id: 30, name: "Netherlands" });
    vi.mocked(teamRepo.findById).mockResolvedValue(team);
    vi.mocked(matchRepo.findAll).mockResolvedValue({ matches: [], total: 0 });

    const result = await service.run(42);

    expect(result.team.id).toBe(42);
    expect(result.matches).toEqual([]);
  });
});
