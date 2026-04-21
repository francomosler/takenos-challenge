import { z } from "zod";

const optionalPositiveInt = (fieldName: string) =>
  z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (Number.isFinite(val) && val > 0), {
      message: `${fieldName} must be greater than 0`,
    });

const optionalMatchDay = (fieldName: string) =>
  z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 1 && val <= 8), {
      message: `${fieldName} must be between 1 and 8`,
    });

export const SearchMatchesQuerySchema = z
  .object({
    teamId: optionalPositiveInt("Team ID"),
    countryId: optionalPositiveInt("Country ID"),
    matchDay: optionalMatchDay("Match day"),
    matchDayFrom: optionalMatchDay("Match day from"),
    matchDayTo: optionalMatchDay("Match day to"),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, {
        message: "Page must be greater than 0",
      }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val >= 1 && val <= 100, {
        message: "Limit must be between 1 and 100",
      }),
    sortBy: z
      .enum(["matchDay", "id", "homeTeam", "awayTeam"])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .refine(
    (data) =>
      data.matchDayFrom === undefined ||
      data.matchDayTo === undefined ||
      data.matchDayFrom <= data.matchDayTo,
    {
      message: "matchDayFrom must be less than or equal to matchDayTo",
      path: ["matchDayFrom"],
    }
  );

export type SearchMatchesQuery = z.infer<typeof SearchMatchesQuerySchema>;
