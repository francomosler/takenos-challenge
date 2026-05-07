import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-prod";
const TOKEN_EXPIRY = "8h";
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000; // 8h in ms

router.post("/auth/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ sub: ADMIN_USER }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  res.json({ message: "Login successful" });
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", path: "/" });
  res.json({ message: "Logged out" });
});

router.get("/auth/me", (req: Request, res: Response) => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    res.json({ username: payload.sub });
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
});

export const authRouter = router;
