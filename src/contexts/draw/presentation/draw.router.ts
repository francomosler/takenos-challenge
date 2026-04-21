import { Router, Request, Response, NextFunction } from "express";
import { container } from "../../../shared/container/container.js";
import { TYPES } from "../../../shared/container/types.js";
import { CreateDrawService } from "../application/create-draw.service.js";
import { SearchCurrentDrawService } from "../application/search-current-draw.service.js";
import { SearchDrawStatisticsService } from "../application/search-draw-statistics.service.js";
import { DrawAlreadyExistsError } from "../domain/exceptions/draw-already-exists.error.js";
import { DrawRepository } from "../domain/draw.repository.js";

export const drawRouter = Router();

drawRouter.post(
  "/draw",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const drawService = container.get<CreateDrawService>(
        TYPES.CreateDrawService
      );
      await drawService.run();

      return res.status(201).json({ message: "Draw created successfully" });
    } catch (error) {
      if (error instanceof DrawAlreadyExistsError) {
        return res.status(409).send("Draw already exists");
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);

drawRouter.delete(
  "/draw",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const drawService = container.get<SearchCurrentDrawService>(
        TYPES.SearchCurrentDrawService
      );
      const drawRepository = container.get<DrawRepository>(TYPES.DrawRepository);

      const existingDraw = await drawService.run();
      if (!existingDraw) {
        return res.status(404).json({ message: "No draw found" });
      }

      await drawRepository.deleteAll();
      return res.status(200).json({ message: "Draw deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);

drawRouter.get(
  "/draw/statistics",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statisticsService = container.get<SearchDrawStatisticsService>(
        TYPES.SearchDrawStatisticsService
      );

      const statistics = await statisticsService.run();
      if (!statistics) {
        return res.status(404).json({ message: "No draw found" });
      }

      return res.status(200).json(statistics);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);

drawRouter.get(
  "/draw",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const drawService = container.get<SearchCurrentDrawService>(
        TYPES.SearchCurrentDrawService
      );
      const draw = await drawService.run();

      if (!draw) {
        return res.status(404).json({ message: "No draw found" });
      }

      const drawPrimitives = draw.toPrimitives();

      return res.status(200).json(drawPrimitives);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
);
