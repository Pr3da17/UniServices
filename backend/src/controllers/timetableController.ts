import { Request, Response } from 'express';
import ical from 'node-ical';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getSession } from '../scrapers/moodleScraper.js';

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

  // ── Étape 2 : Puppeteer CAS login + interception de réponse HTTP ──
  //
  // POURQUOI : text/calendar est reconnu par Chrome comme un fichier à télécharger.
  // page.goto() avec waitUntil:'networkidle2' ou 'domcontentloaded' peut donc bloquer
  // indéfiniment. On contourne en écoutant l'événement 'response' de Puppeteer qui
  // capture le corps AVANT que Chrome ne décide quoi faire du Content-Type.
  if (!icsData && sessionId) {
    const { ADE_USERNAME, ADE_PASSWORD } = process.env;
    const session = getSession(sessionId as string);
    const username = session?.username || ADE_USERNAME;
    const password = session?.password || ADE_PASSWORD;

    if (!icsData && username && password) {
      console.log(`🚀 [ADE] Puppeteer launch for ${username} (resources=${resources})`);
      let browser: any = null;

      try {
        const puppeteer = (await import('puppeteer')).default;
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // ── Interception de réponse ──
        // Capture le corps HTTP dès qu'une réponse contient du texte calendrier
        let capturedIcs = '';
        let capturedPid = '';
        page.on('response', async (response: any) => {
          if (capturedIcs) return; // déjà capturé
          try {
            const url: string = response.url();
            const ct: string = response.headers()['content-type'] || '';
            if (ct.includes('text/calendar') || (url.includes('direct_planning') && url.includes('calType=ical'))) {
              const body: string = await response.text().catch(() => '');
              if (body.includes('BEGIN:VCALENDAR')) {
                capturedIcs = body;
                const pidMatch = url.match(/projectId=(\d+)/);
                if (pidMatch) capturedPid = pidMatch[1];
                console.log(`🎣 [ADE] iCal intercepted! pid=${capturedPid}, ${body.length} chars`);
              }
            }
          } catch { /* response.text() can throw if already consumed */ }
        });

        // ── Authentification CAS ──
        // On navigue vers le 1er projectId — CAS nous redirige pour login
        const firstUrl = `${icsUrlBase}&projectId=8`;
        console.log(`🔗 [ADE] Navigating to: ${firstUrl}`);

        let loggedIn = false;
        try {
          await page.goto(firstUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        } catch { /* timeout attendu si text/calendar → pas grave */ }

        // Login CAS si redirigé
        const urlAfter: string = page.url();
        if (urlAfter.includes('sso.univ-artois.fr') || urlAfter.includes('cas/login')) {
          console.log(`🔑 [ADE] CAS login as ${username}`);
          try {
            await page.waitForSelector('#username, input[name="username"]', { timeout: 8000 });
            await page.type('#username, input[name="username"]', username);
            await page.type('#password, input[name="password"]', password);
            await Promise.all([
              page.keyboard.press('Enter'),
              page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
            ]);
            loggedIn = true;
            await new Promise(r => setTimeout(r, 1500));
            console.log(`📍 [ADE] After CAS login: ${page.url()}`);
          } catch (e: any) {
            console.warn(`⚠️ [ADE] CAS login error: ${e.message}`);
          }
        } else {
          loggedIn = true; // Déjà connecté (rare)
        }

        // Lire le contenu actuel si l'interception n'a pas encore capturé
        if (!capturedIcs) {
          try {
            const txt: string = await page.evaluate(() => {
              const pre = (document as any).querySelector('pre');
              return pre ? pre.textContent : (document as any).body.innerText || '';
            });
            if (txt.includes('BEGIN:VCALENDAR')) {
              capturedIcs = txt;
              console.log(`✅ [ADE] iCal from page body (pid=8)`);
            } else {
              console.warn(`⚠️ [ADE] pid=8: "${txt.substring(0, 80)}"`);
            }
          } catch { /* ignore */ }
        }

        // ── Si pas encore de données → parcourir les autres projectIds ──
        if (!capturedIcs && loggedIn) {
          const otherPids = ['4', '2', '5', '6', '3', '7', '1'];
          for (const pid of otherPids) {
            if (capturedIcs) break;
            const tryUrl = `${icsUrlBase}&projectId=${pid}`;
            console.log(`🔗 [ADE] Trying pid=${pid}...`);
            try {
              await page.goto(tryUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            } catch { /* timeout → iCal intercepté ou erreur */ }
            await new Promise(r => setTimeout(r, 500));

            if (!capturedIcs) {
              try {
                const txt: string = await page.evaluate(() => {
                  const pre = (document as any).querySelector('pre');
                  return pre ? pre.textContent : (document as any).body.innerText || '';
                });
                if (txt.includes('BEGIN:VCALENDAR')) {
                  capturedIcs = txt;
                  capturedPid = pid;
                  console.log(`✅ [ADE] iCal found with pid=${pid}`);
                } else if (txt.includes('invalide') || txt.includes('Erreur')) {
                  console.warn(`⚠️ [ADE] pid=${pid}: "${txt.substring(0, 60)}"`);
                }
              } catch { /* ignore */ }
            }
          }
        }

        // ── Dernière chance : URL personnelle (login= au lieu de resources=) ──
        if (!capturedIcs && loggedIn) {
          const personalUrl = `${ADE_ICAL_BASE}?calType=ical&login=${encodeURIComponent(username)}&firstDate=${yr}-01-01&lastDate=${yr}-12-31`;
          console.log(`🔗 [ADE] Personal URL: ${personalUrl}`);
          try {
            await page.goto(personalUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
            await new Promise(r => setTimeout(r, 500));
            if (!capturedIcs) {
              const txt: string = await page.evaluate(() => {
                const pre = (document as any).querySelector('pre');
                return pre ? pre.textContent : (document as any).body.innerText || '';
              });
              if (txt.includes('BEGIN:VCALENDAR')) {
                capturedIcs = txt;
                console.log(`✅ [ADE] Personal URL worked!`);
              }
            }
          } catch { /* ignore */ }
        }

        // ── Succès : cacher les cookies ADE ──
        if (capturedIcs) {
          icsData = capturedIcs;
          const rawCookies = await page.cookies();
          if (session) {
            session.adeCookies = (rawCookies as any[]).map((c: any) => `${c.name}=${c.value}`);
            // Stocker également le pid qui a fonctionné pour les prochains appels
            if (capturedPid) session.adeCookies.push(`__ade_pid=${capturedPid}`);
          }
          console.log(`✅ [ADE] Complete! ${icsData.length} chars, ${rawCookies.length} ADE cookies cached`);
        } else {
          console.warn(`⚠️ [ADE] All attempts failed. Check projectId or resource ID validity.`);
        }

      } catch (e: any) {
        console.error(`❌ [ADE] Puppeteer fatal: ${e.message}`);
      } finally {
        if (browser) await browser.close().catch(() => {});
      }
    } else {
      console.warn(`⚠️ [ADE] No password in session`);
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
