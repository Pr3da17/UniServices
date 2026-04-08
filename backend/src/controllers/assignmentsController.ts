import { Request, Response } from "express";
import { getSession } from "../scrapers/moodleScraper.js";
import { getScraper } from "../routes/auth.js";
import type { ErrorResponse } from "../types.js";

const assignmentCache = new Map<string, { timestamp: number; data: any[] }>();
const courseContentCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 5 * 60 * 1000;

export const getAssignments = async (req: Request, res: Response) => {
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

    const cached = assignmentCache.get(sessionId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📋 Returning cached assignments for ${session.username}`);
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        timestamp: cached.timestamp,
      });
    }

    const scraper = getScraper(sessionId);
    if (!scraper) {
      return res.status(401).json({
        error: "Session scraper not found. Please login again.",
        timestamp: Date.now(),
      } as ErrorResponse);
    }

    const assignments = await scraper.getAssignments(session);

    assignmentCache.set(sessionId, {
      timestamp: Date.now(),
      data: assignments,
    });

    res.json({
      success: true,
      data: assignments,
      cached: false,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("❌ Failed to fetch assignments:", error);
    res.status(500).json({
      error: "Failed to fetch assignments",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    } as ErrorResponse);
  }
};

export const getCourses = async (req: Request, res: Response) => {
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

    const scraper = getScraper(sessionId);
    if (!scraper) {
      return res.status(401).json({
        error: "Session scraper not found. Please login again.",
        timestamp: Date.now(),
      } as ErrorResponse);
    }

    const courses = await scraper.getCourses(session);

    res.json({
      success: true,
      data: courses,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("❌ Failed to fetch courses:", error);
    res.status(500).json({
      error: "Failed to fetch courses",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    } as ErrorResponse);
  }
};

export const getCatalog = async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;
    const categoryId = req.query.categoryId as string;
    
    if (!sessionId || !categoryId) {
      return res.status(400).json({
        error: "sessionId and categoryId parameters are required",
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

    const scraper = getScraper(sessionId);
    if (!scraper) {
      return res.status(401).json({
        error: "Session scraper not found. Please login again.",
        timestamp: Date.now(),
      } as ErrorResponse);
    }

    const courses = await scraper.getCatalog(session, categoryId);

    res.json({
      success: true,
      data: courses,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("❌ Failed to fetch catalog:", error);
    res.status(500).json({
      error: "Failed to fetch catalog",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    } as ErrorResponse);
  }
};

export const getCourseContent = async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;
    const courseId = req.params.id;
    
    if (!sessionId || !courseId) {
      return res.status(400).json({
        error: "sessionId and courseId parameters are required",
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

    const cacheKey = `${sessionId}_${courseId}`;
    const forceRefresh = req.query.forceRefresh === "true";
    const cached = courseContentCache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        timestamp: cached.timestamp,
      });
    }

    const scraper = getScraper(sessionId);
    if (!scraper) {
      return res.status(401).json({
        error: "Session scraper not found. Please login again.",
        timestamp: Date.now(),
      } as ErrorResponse);
    }

    const content = await scraper.getCourseContent(session, courseId);

    courseContentCache.set(cacheKey, {
      timestamp: Date.now(),
      data: content,
    });

    res.json({
      success: true,
      data: content,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("❌ Failed to fetch course content:", error);
    res.status(500).json({
      error: "Failed to fetch course content",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    } as ErrorResponse);
  }
};

export const clearCache = (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId is required",
        timestamp: Date.now(),
      } as ErrorResponse);
    }

    assignmentCache.delete(sessionId);
    // Supprimer toutes les entrées liées à cette session dans le cache de contenu
    for (const key of courseContentCache.keys()) {
      if (key.startsWith(`${sessionId}_`)) {
        courseContentCache.delete(key);
      }
    }
    console.log(`🗑️ Cache cleared (assignments & courses) for session: ${sessionId}`);

    res.json({
      success: true,
      message: "Cache cleared",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to clear cache",
      timestamp: Date.now(),
    } as ErrorResponse);
  }
};
