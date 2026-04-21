import { Router, Request, Response, NextFunction } from "express";
import { container } from "../../../shared/container/container.js";
import { TYPES } from "../../../shared/container/types.js";
import { SearchTeamsService } from "../application/search-teams.service.js";
import { SearchTeamByIdService } from "../application/search-team-by-id.service.js";
import { SearchTeamsQuerySchema } from "./dtos/search-teams.dto.js";
import { TeamNotFoundError } from "../domain/exceptions/team-not-found.error.js";

export const teamsRouter = Router();

teamsRouter.get(
  "/teams",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedQuery = SearchTeamsQuerySchema.parse(req.query);

      const searchTeamsService = container.get<SearchTeamsService>(
        TYPES.SearchTeamsService
      );

      const teams = await searchTeamsService.run({
        countryId: parsedQuery.countryId,
        search: parsedQuery.search,
      });

      return res.status(200).json({ teams });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);

teamsRouter.get(
  "/teams/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res
          .status(400)
          .json({ message: "Team id must be a positive integer" });
      }

      const searchTeamByIdService = container.get<SearchTeamByIdService>(
        TYPES.SearchTeamByIdService
      );

      const result = await searchTeamByIdService.run(id);

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof TeamNotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);
