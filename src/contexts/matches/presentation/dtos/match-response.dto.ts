import { z } from "zod";

export const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.object({
    id: z.number(),
    name: z.string(),
  }),
});

export const MatchSchema = z.object({
  id: z.string(),
  homeTeam: TeamSchema,
  awayTeam: TeamSchema,
  matchDay: z.number().min(1).max(8),
});

export const PaginationSchema = z.object({
  page: z.number().positive(),
  limit: z.number().positive(),
  total: z.number().nonnegative(),
  totalPages: z.number().nonnegative(),
});

export const SearchMatchesResponseSchema = z.object({
  matches: z.array(MatchSchema),
  pagination: PaginationSchema,
});

export type Match = z.infer<typeof MatchSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type SearchMatchesResponse = z.infer<typeof SearchMatchesResponseSchema>;
