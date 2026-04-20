import { describe, it, expect } from "vitest";
import { Team } from "../../team";
import { Country } from "../../country";
import { PotAssigner } from "../pot-assigner.service";

describe("PotAssigner", () => {
  it("should assign 36 teams into 4 pots of 9 teams according to order", () => {
    const countries = [
      Country.create(1, "ESP"),
      Country.create(2, "ENG"),
      Country.create(3, "FRA"),
      Country.create(4, "GER"),
      Country.create(5, "ITA"),
      Country.create(6, "POR"),
      Country.create(7, "NED"),
      Country.create(8, "BEL"),
    ];

    const teams: Team[] = [];
    for (let i = 1; i <= 36; i++) {
      const country = countries[i % countries.length];
      teams.push(Team.create(i, `Team ${i}`, country));
    }

    const potAssignments = PotAssigner.fromTeamList(teams);

    expect(potAssignments.size).toBe(36);

    const pots: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] };
    potAssignments.forEach((pot, teamId) => {
      pots[pot].push(teamId);
    });

    for (let pot = 1; pot <= 4; pot++) {
      expect(pots[pot].length).toBe(9);
    }

    for (let i = 1; i <= 36; i++) {
      const expectedPot = Math.floor((i - 1) / 9) + 1;
      expect(potAssignments.get(i)).toBe(expectedPot);
    }
  });
});
