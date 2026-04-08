import { Router } from "express";
import { login, logout, verify, scrapers } from "../controllers/authController.js";
import { loginLimiter } from "../middlewares/rateLimiter.js";
import { validate, loginSchema } from "../validators/authValidator.js";
import type { MoodleScraper } from "../scrapers/moodleScraper.js";

const router = Router();

import ssoSyncRoutes from "./ssoSync.js";

// Used by assignments controller
export function getScraper(sessionId: string): MoodleScraper | null {
  return scrapers.get(sessionId) || null;
}

router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/verify", verify);

// Mount SSO routes under /api/auth/sso
router.use("/sso", ssoSyncRoutes);

export default router;
