import { Router } from "express";
import { getSession } from "../scrapers/moodleScraper";
import { CasClient } from "../utils/casClient";

const router = Router();

// A simple cache to keep CasClients alive per user session
// This allows incredibly fast subsequent ST generation without re-logging
const casClientCache = new Map<string, CasClient>();

/**
 * SSO Warmup: Called in the background when the user logs in.
 * Establishes the high-speed CAS session in server memory.
 */
router.get("/warm-cache", async (req, res) => {
  const { sessionId } = req.query;
  const session = getSession(sessionId?.toString() || "");

  if (!session || !session.password) {
    return res.status(401).json({ error: "Session Moodle invalide ou expirée." });
  }

  try {
    let casClient = casClientCache.get(session.username);

    if (!casClient) {
      casClient = new CasClient();
      console.log(`[SSO Warmup] Authorizing fast CAS client for ${session.username}...`);
      await casClient.login(session.username, session.password);
      casClientCache.set(session.username, casClient);
      console.log(`[SSO Warmup] Client cached and ready.`);
    }

    // ASYNC PRE-WARM: Launch Puppeteer in the background to silently fetch Zimbra tokens
    // without blocking the dashboard load, making future Zimbra clicks completely instant.
    const now = Date.now();
    const isZimbraWarm = session.zimbraCookies && session.zimbraLastAuth && (now - session.zimbraLastAuth < 30 * 60 * 1000);
    if (!isZimbraWarm) {
      console.log(`🐌 [SSO Warmup] Asynchronously booting Puppeteer to pre-forge Zimbra Magic Link for ${session.username}...`);
      refreshZimbraSession(session).catch(e => console.error("❌ Background Zimbra Warmup Failed:", e.message));
    }

    res.json({ success: true, status: "ready" });
  } catch (error: any) {
    console.error("❌ [SSO Warmup] Failed:", error.message);
    casClientCache.delete(session.username);
    res.status(500).json({ error: "Warmup failed", details: error.message });
  }
});

import { refreshZimbraSession } from "./mail";

/**
 * SSO Jump Gate: The Ultra-Fast Redirector
 * Uses the pre-warmed CasClient to strike CAS and get a ticket in ~50ms.
 */
router.get("/jump", async (req, res) => {
  const { sessionId, service } = req.query;

  if (!service) return res.status(400).send("Service URL required");

  const session = getSession(sessionId?.toString() || "");
  if (!session || !session.password) {
    return res.redirect(service.toString()); // Fallback to raw service on auth failure
  }

  const targetUrl = service.toString();

  // MAGIC LINK: ZIMBRA PREAUTH BACKDOOR
  if (targetUrl.includes("wmailetu")) {
    console.log(`✉️ [SSO Jump] Forging Zimbra Preauth Magic Link for ${session.username}...`);
    try {
      // Extract hash fragment if deep-linking into a specific mail
      const hashIndex = targetUrl.indexOf('#');
      const hash = hashIndex !== -1 ? targetUrl.substring(hashIndex) : '';

      // 1. Check cache first! If warm-cache ran in the background, this is INSTANT (0ms)
      const now = Date.now();
      const needsAuth = !session.zimbraCookies ||
        session.zimbraCookies.length === 0 ||
        !session.zimbraLastAuth ||
        (now - session.zimbraLastAuth > 30 * 60 * 1000);

      let cookies = session.zimbraCookies;
      if (needsAuth) {
        console.log("🐌 [SSO Jump] Cache miss. Firing Puppeteer on demand...");
        cookies = await refreshZimbraSession(session);
      } else {
        console.log("🚀 [SSO Jump] Cache hit! Zero-Load Zimbra execution.");
      }

      // 2. We locate the golden ZM_AUTH_TOKEN
      const tokenCookie = (cookies || []).find((c: string) => c.startsWith("ZM_AUTH_TOKEN="));
      if (!tokenCookie) throw new Error("ZM_AUTH_TOKEN not found in extracted cookies");

      const authToken = tokenCookie.split(";")[0].replace("ZM_AUTH_TOKEN=", "");

      // 3. We construct the Magic Link and flash the browser straight into the inbox
      // The browser guarantees that the hash fragment is preserved across Zimbra's internal 302 redirects!
      const magicLink = `https://wmailetu.univ-artois.fr/service/preauth?isredirect=1&authtoken=${authToken}${hash}`;
      return res.redirect(magicLink);
    } catch (e: any) {
      console.error("❌ [SSO Jump] Magic Link generation failed:", e.message);
      return res.redirect(targetUrl);
    }
  }

  try {
    let casClient = casClientCache.get(session.username);

    // If cache was dropped for some reason, re-warm on the fly
    if (!casClient) {
      casClient = new CasClient();
      await casClient.login(session.username, session.password);
      casClientCache.set(session.username, casClient);
    }

    console.log(`⚡ [SSO Jump] Flash ST Generation for ${session.username} -> ${targetUrl}`);
    const authenticatedUrl = await casClient.getServiceTicket(targetUrl);

    // Redirect the browser instantly
    res.redirect(authenticatedUrl);
  } catch (error: any) {
    console.error("❌ [SSO Jump] Failed:", error.message);
    // Ultimate fallback if CAS is down or ticket fails
    res.redirect(targetUrl);
  }
});

export default router;
