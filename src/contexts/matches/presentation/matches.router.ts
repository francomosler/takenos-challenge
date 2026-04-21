import { Router, Request, Response, NextFunction } from "express";
import { container } from "../../../shared/container/container.js";
import { TYPES } from "../../../shared/container/types.js";
import { SearchMatchesService } from "../application/search-matches.service.js";
import { SearchMatchByIdService } from "../application/search-match-by-id.service.js";
import { SearchMatchesResponse } from "./dtos/match-response.dto.js";
import { SearchMatchesQuerySchema } from "./dtos/search-matches.dto.js";
import { MatchNotFoundError } from "../domain/exceptions/match-not-found.error.js";

export const matchesRouter = Router();

matchesRouter.get(
  "/matches",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedQuery = SearchMatchesQuerySchema.parse(req.query);

      const searchMatchesService = container.get<SearchMatchesService>(
        TYPES.SearchMatchesService
      );

      const result: SearchMatchesResponse = await searchMatchesService.run({
        teamId: parsedQuery.teamId,
        countryId: parsedQuery.countryId,
        matchDay: parsedQuery.matchDay,
        matchDayFrom: parsedQuery.matchDayFrom,
        matchDayTo: parsedQuery.matchDayTo,
        page: parsedQuery.page,
        limit: parsedQuery.limit,
        sortBy: parsedQuery.sortBy,
        sortOrder: parsedQuery.sortOrder,
      });

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);

matchesRouter.get(
  "/matches/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res
          .status(400)
          .json({ message: "Match id must be a positive integer" });
      }

      const searchMatchByIdService = container.get<SearchMatchByIdService>(
        TYPES.SearchMatchByIdService
      );

      const match = await searchMatchByIdService.run(id);

      return res.status(200).json(match);
    } catch (error) {
      if (error instanceof MatchNotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);
