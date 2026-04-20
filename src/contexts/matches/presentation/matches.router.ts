import { Router, Request, Response, NextFunction } from "express";
import { container } from "../../../shared/container/container.js";
import { TYPES } from "../../../shared/container/types.js";
import { SearchMatchesService } from "../application/search-matches.service.js";
import { SearchMatchesResponse } from "./dtos/match-response.dto.js";

export const matchesRouter = Router();

matchesRouter.get(
  "/matches",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId, matchDay, page, limit } = req.query;

      const searchMatchesService = container.get<SearchMatchesService>(
        TYPES.SearchMatchesService
      );

      const result: SearchMatchesResponse = await searchMatchesService.run({
        teamId: teamId ? Number(teamId) : undefined,
        matchDay: matchDay ? Number(matchDay) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
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
