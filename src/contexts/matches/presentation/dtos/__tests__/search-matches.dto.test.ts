import { describe, it, expect } from "vitest";
import { SearchMatchesQuerySchema } from "../search-matches.dto";

describe("SearchMatchesQuerySchema — edge cases", () => {
  it("applies defaults when query is empty", () => {
    const parsed = SearchMatchesQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(10);
    expect(parsed.teamId).toBeUndefined();
    expect(parsed.sortBy).toBeUndefined();
    expect(parsed.sortOrder).toBeUndefined();
  });

  it("rejects zero matchDay", () => {
    const result = SearchMatchesQuerySchema.safeParse({ matchDay: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects matchDay above 8", () => {
    const result = SearchMatchesQuerySchema.safeParse({ matchDay: "9" });
    expect(result.success).toBe(false);
  });

  it("accepts matchDay boundary values (1 and 8)", () => {
    expect(SearchMatchesQuerySchema.safeParse({ matchDay: "1" }).success).toBe(
      true
    );
    expect(SearchMatchesQuerySchema.safeParse({ matchDay: "8" }).success).toBe(
      true
    );
  });

  it("rejects a matchDay range where from > to", () => {
    const result = SearchMatchesQuerySchema.safeParse({
      matchDayFrom: "6",
      matchDayTo: "2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/matchDayFrom/);
    }
  });

  it("accepts a matchDay range where from == to", () => {
    const result = SearchMatchesQuerySchema.safeParse({
      matchDayFrom: "3",
      matchDayTo: "3",
    });
    expect(result.success).toBe(true);
  });

  it("rejects limit above 100", () => {
    const result = SearchMatchesQuerySchema.safeParse({ limit: "101" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative page", () => {
    const result = SearchMatchesQuerySchema.safeParse({ page: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown sortBy value", () => {
    const result = SearchMatchesQuerySchema.safeParse({ sortBy: "foo" });
    expect(result.success).toBe(false);
  });

  it("coerces string integers into numbers", () => {
    const parsed = SearchMatchesQuerySchema.parse({
      teamId: "42",
      countryId: "7",
      page: "3",
      limit: "25",
    });
    expect(parsed.teamId).toBe(42);
    expect(parsed.countryId).toBe(7);
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(25);
  });
});
