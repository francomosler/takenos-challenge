import "reflect-metadata";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import logger from "morgan";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { initializeDatabase } from "./src/shared/infrastructure/database.js";
import { registerRoutes } from "./src/shared/infrastructure/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();

// view engine setup
app.set("view engine", "jade");

const allowedOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Initialize database connection
initializeDatabase();

// Register application routes
registerRoutes(app);

export default app;
