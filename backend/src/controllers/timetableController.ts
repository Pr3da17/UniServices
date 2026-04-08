import { Request, Response } from 'express';
import ical from 'node-ical';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getSession } from '../scrapers/moodleScraper.js';
import { CasClient } from '../utils/casClient.js';
import { decrypt } from '../utils/security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADE_ICAL_BASE = "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/direct_planning.jsp";

/**
 * GET /api/timetable?resources=ID&sessionId=ID
 *
 * Stratégie en 2 temps :
 *  1. Cookies ADE déjà cachés en session → axios direct (rapide, ~1s)
 *  2. Puppeteer CAS login → interception de réponse HTTP (text/calendar =
 *     téléchargement dans Chrome, donc on intercepte avant que Chrome réagisse)
 *     → test automatique de différents projectIds → cache les cookies
 */
export const getTimetable = async (req: Request, res: Response) => {
  const { resources, sessionId } = req.query;
  const resourcesStr = String(resources || "");
  const sessionIdStr = sessionId as string || "";
  const CACHE_TTL = 15 * 60 * 1000; // 15 mins

  // 1. Check Backend Cache
  if (sessionIdStr) {
    const session = getSession(sessionIdStr);
    if (session?.adeTimetableCache && session.adeTimetableCache.resources === resourcesStr) {
      if (Date.now() - session.adeTimetableCache.timestamp < CACHE_TTL) {
        console.log(`⚡ [ADE] Serving session-cached data for ${resourcesStr}`);
        return res.json(session.adeTimetableCache.data);
      }
    }
  }

  if (!resources) {
    return res.status(400).json({ error: "Paramètre 'resources' manquant" });
  }

  const yr = new Date().getFullYear();
  const icsUrlBase = `${ADE_ICAL_BASE}?calType=ical&resources=${resources}&firstDate=${yr}-01-01&lastDate=${yr}-12-31`;

  let icsData = '';
  let directUrl = '';
  let eventFilter = '';

  // ── Étape 0 : Vérifier si le groupe a un lien direct (SHU) ou un filtre dans le JSON ──
  try {
    const treePath = path.join(__dirname, '../data/ade_tree.json');
    const raw = await fs.readFile(treePath, 'utf-8');
    const tree = JSON.parse(raw);
    for (const site of tree.sites || []) {
      for (const dept of site.departments || []) {
        for (const year of dept.years || []) {
          const group = year.groups.find((g: any) => g.id === resources);
          if (group) {
            if (group.directUrl) directUrl = group.directUrl;
            if (group.filter) eventFilter = group.filter;
            break;
          }
        }
      }
    }
  } catch (e: any) {
    console.warn(`⚠️ [ADE] Error reading tree: ${e.message}`);
  }

  if (directUrl) {
    console.log(`🚀 [ADE] Direct link found for resources=${resources}: ${directUrl}`);
    try {
      const resp = await axios.get(directUrl, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (resp.data?.includes('BEGIN:VCALENDAR')) {
        icsData = resp.data;
        console.log(`✅ [ADE] Direct link fetch success!`);
      }
    } catch (e: any) {
      console.warn(`⚠️ [ADE] Direct link fetch failed: ${e.message}`);
    }
  }

  // ── Étape 1 : Cookies ADE déjà cachés → axios direct ──
  if (sessionId) {
    const session = getSession(sessionId as string);
    if (session?.adeCookies && session.adeCookies.length > 0) {
      try {
        // On réessaye avec le projectId stocké s'il y en a un, sinon on boucle
        const storedPid = session.adeCookies.find(c => c.startsWith('__ade_pid='));
        const pids = storedPid ? [storedPid.split('=')[1]] : ['1', '8', '4', '2', '5', '6', '3', '7'];
        const cookieHeader = session.adeCookies.filter(c => !c.startsWith('__ade_pid=')).join('; ');

        for (const pid of pids) {
          if (icsData) break;
          const url = `${icsUrlBase}&projectId=${pid}`;
          console.log(`📅 [ADE] Cached cookies → trying pid=${pid}`);
          try {
            const resp = await axios.get(url, {
              responseType: 'text',
              headers: { Cookie: cookieHeader, 'User-Agent': 'Mozilla/5.0', Accept: 'text/calendar,*/*' },
              maxRedirects: 0,
              validateStatus: (s) => s < 400,
              timeout: 10000
            });
            if (resp.data?.includes('BEGIN:VCALENDAR')) {
              icsData = resp.data;
              console.log(`✅ [ADE] Cached cookies worked! (pid=${pid})`);
            }
          } catch { /* ignore */ }
        }

        if (!icsData) {
          console.warn(`⚠️ [ADE] Cached cookies expired, falling back to Puppeteer`);
          if (session) session.adeCookies = [];
        }
      } catch (e: any) {
        console.warn(`⚠️ [ADE] Cached cookies error: ${e.message}`);
      }
    }
  }

  // ── Étape 2 : Authentification Directe ADE (No-Puppeteer) ──
  if (!icsData && sessionId) {
    const session = getSession(sessionId as string);
    const username = session?.username;
    const password = session?.encryptedPassword ? decrypt(session.encryptedPassword) : undefined;

    if (!icsData && username && password) {
      console.log(`🚀 [ADE] Direct Auth (No-Puppeteer) for ${username} (resources=${resources})`);

      try {
        const cas = new CasClient();
        await cas.login(username, password);

        // Get ticket for ADE
        const ticketUrl = await cas.getServiceTicket(ADE_ICAL_BASE);

        // Establish ADE Session
        const initialRes = await axios.get(ticketUrl, {
          maxRedirects: 5,
          headers: { 'User-Agent': 'Mozilla/5.0' },
          validateStatus: (s) => s < 400
        });

        const adeCookies = initialRes.headers['set-cookie'] || [];
        const cookieHeader = adeCookies.join('; ');

        // Scan Project IDs browserlessly
        const pids = ['8', '1', '4', '2', '5', '6', '3', '7'];
        let capturedPid = '';

        for (const pid of pids) {
          if (icsData) break;
          const url = `${icsUrlBase}&projectId=${pid}`;
          console.log(`📅 [ADE] Direct scanning pid=${pid}...`);
          try {
            const resp = await axios.get(url, {
              headers: { 
                 Cookie: cookieHeader, 
                 'User-Agent': 'Mozilla/5.0', 
                 Accept: 'text/calendar,*/*' 
              },
              timeout: 10000
            });
            if (resp.data?.includes('BEGIN:VCALENDAR')) {
              icsData = resp.data;
              capturedPid = pid;
              console.log(`✅ [ADE] found with pid=${pid} via Direct HTTP`);
            }
          } catch { /* continue */ }
        }

        // Cache the result and cookies
        if (icsData && session) {
          session.adeCookies = adeCookies;
          if (capturedPid) session.adeCookies.push(`__ade_pid=${capturedPid}`);
          console.log(`✅ [ADE] Cookies & PID cached for ${username}`);
        }
      } catch (e: any) {
        console.error(`❌ [ADE] Direct auth fatal: ${e.message}`);
      }
    }
  }

  // ── Résultat ──
  if (!icsData || !icsData.includes('BEGIN:VCALENDAR')) {
    console.warn(`⚠️ [ADE] No iCal for resources=${resources}. sessionId=${sessionId ? 'present' : 'absent'}`);
    return res.json([]);
  }

  try {
    const data = ical.parseICS(icsData);
    const events = Object.values(data)
      .filter((event: any) => event && event.type === 'VEVENT')
      .map((event: any) => ({
        id: event.uid,
        title: event.summary || 'Cours',
        description: event.description || "",
        location: event.location || "",
        start: event.start,
        end: event.end,
        color: generateColor(event.summary || '')
      }))
      .filter((e: any) => e.start && e.end)
      // Filtrage par groupe si spécifié (plus robuste aux espaces/newlines)
      .filter((e: any) => {
        if (!eventFilter) return true;
        const searchStr = `${e.title} ${e.description}`.replace(/[\n\r\s]+/g, ' ').trim().toLowerCase();
        const cleanedFilter = eventFilter.replace(/[\n\r\s]+/g, ' ').trim().toLowerCase();
        return searchStr.includes(cleanedFilter);
      })
      .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

    if (sessionIdStr) {
      const session = getSession(sessionIdStr);
      if (session) {
        session.adeTimetableCache = {
          resources: resourcesStr,
          data: events,
          timestamp: Date.now()
        };
      }
    }

    console.log(`✅ [ADE] Returning ${events.length} events for resources=${resourcesStr}`);
    res.json(events);
  } catch (parseErr: any) {
    console.error(`❌ [ADE] Parse error: ${parseErr.message}`);
    res.status(500).json({ error: "Erreur parsing calendrier." });
  }
};

/**
 * GET /api/timetable/tree
 */
export const getTimetableTree = async (_req: Request, res: Response) => {
  try {
    const treePath = path.join(__dirname, '../data/ade_tree.json');
    const raw = await fs.readFile(treePath, 'utf-8');
    const tree = JSON.parse(raw);
    console.log(`✅ [ADE Tree] Serving: ${tree.sites?.length} sites`);
    res.json(tree);
  } catch (error: any) {
    console.error("❌ [ADE Tree]:", error.message);
    res.status(500).json({ error: "Arborescence ADE non disponible." });
  }
};

/**
 * GET /api/timetable/search?q=query
 */
export const searchTimetableResources = async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const treePath = path.join(__dirname, '../data/ade_tree.json');
    const raw = await fs.readFile(treePath, 'utf-8');
    const tree = JSON.parse(raw);
    const query = (q as string).toLowerCase();
    const results: any[] = [];

    for (const site of tree.sites || []) {
      for (const dept of site.departments || []) {
        for (const year of dept.years || []) {
          for (const group of year.groups || []) {
            if (`${site.name} ${dept.name} ${year.name} ${group.name}`.toLowerCase().includes(query)) {
              results.push({ id: group.id, name: group.name, path: `${site.name} › ${dept.name} › ${year.name}` });
            }
          }
        }
      }
    }

    res.json(results);
  } catch {
    res.status(500).json({ error: "Erreur de recherche." });
  }
};

function generateColor(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash % 360)}, 70%, 45%)`;
}
