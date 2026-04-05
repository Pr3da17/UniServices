import { Router } from "express";
import { login, logout, verify, scrapers } from "../controllers/authController";
import { loginLimiter } from "../middlewares/rateLimiter";
import { validate, loginSchema } from "../validators/authValidator";
import type { MoodleScraper } from "../scrapers/moodleScraper";

const router = Router();

// Used by assignments controller
export function getScraper(sessionId: string): MoodleScraper | null {
  return scrapers.get(sessionId) || null;
}

router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/verify", verify);

export default router;
