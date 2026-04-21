import { z } from "zod";

export const SearchTeamsQuerySchema = z.object({
  countryId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || val > 0, {
      message: "Country ID must be greater than 0",
    }),
  search: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
});

export type SearchTeamsQuery = z.infer<typeof SearchTeamsQuerySchema>;
