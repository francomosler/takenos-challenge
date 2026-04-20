import { Express } from "express";
import { drawRouter } from "../../contexts/draw/presentation/draw.router.js";
import { matchesRouter } from "../../contexts/matches/presentation/matches.router.js";

export function registerRoutes(app: Express): void {
  app.use(drawRouter);
  app.use(matchesRouter);
}
