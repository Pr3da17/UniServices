import { Request, Response, NextFunction } from "express";
import { MoodleScraper, getSession, deleteSession } from "../scrapers/moodleScraper";
import type { LoginRequest, LoginResponse, ErrorResponse } from "../types";

const MOODLE_BASE_URL = process.env.MOODLE_BASE_URL || "https://moodle.univ-artois.fr";
export const scrapers = new Map<string, MoodleScraper>();

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body as LoginRequest;

    const scraper = new MoodleScraper(MOODLE_BASE_URL);
    const session = await scraper.login(username, password);

    const sessionId = session.sessionId || `session_${Date.now()}`;
    
    // On garde le mot de passe en mémoire UNIQUEMENT pour la synchro SSO initiale
    // @ts-ignore
    session.password = password; 

    scrapers.set(sessionId, scraper);

    console.log(`✅ Login successful: ${username} -> Session: ${sessionId}`);

    res.json({
      success: true,
      userId: session.userId,
      username: session.username,
      sessionId,
      message: "Login successful",
    } as LoginResponse);
  } catch (error) {
    console.error("❌ Login failed:", error);
    res.status(401).json({
      error: "Login failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    } as ErrorResponse);
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      scrapers.delete(sessionId);
      deleteSession(sessionId);
      console.log(`🚪 Logout: ${sessionId}`);
    }
    res.json({ success: true, message: "Logged out" });
  } catch (error) {
    res.status(500).json({
      error: "Logout failed",
      timestamp: Date.now(),
    } as ErrorResponse);
  }
};

export const verify = (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId query parameter required",
        timestamp: Date.now(),
      } as ErrorResponse);
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(401).json({
        error: "Invalid or expired session",
        timestamp: Date.now(),
      } as ErrorResponse);
    }

    res.json({
      valid: true,
      userId: session.userId,
      username: session.username,
      loginTime: session.loginTime,
    });
  } catch (error) {
    res.status(500).json({
      error: "Verification failed",
      timestamp: Date.now(),
    } as ErrorResponse);
  }
};
