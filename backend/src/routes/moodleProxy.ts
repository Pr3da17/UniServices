import { Router } from "express";
import axios from "axios";
import { getSession } from "../scrapers/moodleScraper.js";

const router = Router();

/**
 * Proxy route for Moodle resources (PDF, images, etc.)
 * Usage: /api/proxy/resource?sessionId=...&url=...
 */
router.get("/resource", async (req, res) => {
  const { sessionId, url } = req.query;

  if (!sessionId || !url) {
    return res.status(400).json({ error: "sessionId and url are required" });
  }

  const moodleUrl = url.toString();

  // Security check: only allow Artois Moodle domain
  if (!moodleUrl.startsWith("https://moodle.univ-artois.fr")) {
    return res.status(403).json({ error: "Invalid domain. Only moodle.univ-artois.fr is allowed." });
  }

  const session = getSession(sessionId.toString());
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  try {
    console.log(`📡 [PROXY] Fetching resource: ${moodleUrl} for user ${session.username}`);

    const response = await axios({
      method: "get",
      url: moodleUrl,
      headers: {
        "Cookie": session.cookies,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      responseType: "stream"
    });

    // Pass along important headers
    const contentType = response.headers["content-type"];
    const contentDisposition = response.headers["content-disposition"];

    if (contentType) res.setHeader("Content-Type", contentType);
    if (contentDisposition) res.setHeader("Content-Disposition", contentDisposition);

    // Stream the response to the user
    response.data.pipe(res);
  } catch (error: any) {
    console.error("❌ [PROXY] Error fetching resource:", error.message);
    res.status(error.response?.status || 502).json({
      error: "Failed to fetch resource from Moodle",
      details: error.message
    });
  }
});

export default router;
