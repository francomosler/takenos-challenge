import { Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { drawRouter } from "../../contexts/draw/presentation/draw.router.js";
import { matchesRouter } from "../../contexts/matches/presentation/matches.router.js";
import { teamsRouter } from "../../contexts/teams/presentation/teams.router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadOpenApiSpec(): unknown | null {
  const candidates = [
    path.resolve(__dirname, "../../../docs/openapi.yaml"),
    path.resolve(__dirname, "../../../../docs/openapi.yaml"),
    path.resolve(process.cwd(), "docs/openapi.yaml"),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return YAML.parse(fs.readFileSync(filePath, "utf8"));
    }
  }

  return null;
}

export function registerRoutes(app: Express): void {
  app.get("/health", (_req, res) => {
    return res.status(200).json({
      status: "ok",
      service: "champions-league-draw-api",
      timestamp: new Date().toISOString(),
    });
  });

  const openapiSpec = loadOpenApiSpec();
  if (openapiSpec) {
    app.get("/openapi.json", (_req, res) => res.status(200).json(openapiSpec));
    app.use(
      "/docs",
      swaggerUi.serve,
      swaggerUi.setup(openapiSpec as any, {
        customSiteTitle: "Champions League Draw API — Docs",
      })
    );
  }

  app.use(drawRouter);
  app.use(matchesRouter);
  app.use(teamsRouter);
}
