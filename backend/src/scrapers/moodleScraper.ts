import axios, { AxiosInstance } from "axios";
import puppeteer from "puppeteer";
import type { Assignment, Course, UserSession, CourseSection } from "../types";

const sessions = new Map<string, UserSession>();

export class MoodleScraper {
  private baseUrl: string;
  private httpClient: AxiosInstance;
  private browser: any = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
    });
  }

  async login(username: string, password: string): Promise<UserSession> {
    if (username.toLowerCase() === "demo") {
      const sessionId = this.generateSessionId();
      const mockSession: UserSession = {
        userId: "demo-user",
        username: "Étudiant Démo",
        cookies: "demo-token",
        moodleSessionId: "demo-token",
        loginTime: Date.now(),
        lastActivityTime: Date.now(),
        sessionId: sessionId,
      };
      sessions.set(sessionId, mockSession);
      return mockSession;
    }

    console.log(`🔐 Lancement de Puppeteer (Hybrid Mode) pour ${username}...`);
    // Launch headless browser optimized for performance
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    try {
      const page = await browser.newPage();
      
      // Obfuscate standard Headless signature occasionally required by CAS
      await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

      await page.goto(`${this.baseUrl}/login/index.php?authCAS=CAS`, { waitUntil: "networkidle2" });
      
      // Use more robust selectors and wait for them
      await page.waitForSelector('input[name="username"], #username', { timeout: 10000 });
      await page.type('input[name="username"], #username', username);
      
      await page.waitForSelector('input[name="password"], #password', { timeout: 5000 });
      await page.type('input[name="password"], #password', password);
      
      // Submit form using Enter key to avoid selector brittleness
      await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }).catch(() => console.log("Navigation timeout, checking state manually..."))
      ]);

      // Extremely robust wait mechanism: wait for Moodlesesskey or CAS error message
      try {
        await page.waitForFunction(`
          Boolean((window as any).M?.cfg?.sesskey) || 
          (document as any).body.innerText.includes("invalide") || 
          (document as any).body.innerText.includes("Invalid")
        `, { timeout: 15000 });
      } catch(e) {
        console.log("Timeout waiting for explicit DOM signals, fallback to raw cookie checking.");
      }

      // Check for CAS errors safely
      const loginError = await page.evaluate(() => {
         const body = document.body;
         if (!body) return null;
         const text = body.innerText || "";
         if (text.includes("invalide") || text.includes("Invalid")) return "Identifiants refusés par le CAS.";
         if (text.includes("Désolé") || text.includes("échec")) return "Échec d'authentification CAS.";
         return null;
      });

      if (loginError) {
         throw new Error(loginError);
      }

      // Extract all Cookies for full session validity
      const cookies = await page.cookies();
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      
      const moodleSession = cookies.find(c => c.name === "MoodleSession");
      if (!moodleSession) {
         throw new Error("Cookie MoodleSession introuvable après la redirection.");
      }

      // Extract the critical sesskey from Moodle's JS object `M.cfg.sesskey`
      const sesskey = await page.evaluate(() => {
        return (window as any).M ? (window as any).M.cfg.sesskey : "";
      });

      await browser.close();
      
      const sessionId = this.generateSessionId();
      const session: UserSession = {
        userId: "student-ar",
        username: username,
        cookies: cookieHeader, 
        moodleSessionId: sesskey,
        loginTime: Date.now(),
        lastActivityTime: Date.now(),
        sessionId: sessionId,
        password: password, // Store for ADE hopping
      };

      sessions.set(sessionId, session);
      console.log(`✅ Hybrid login successful for ${username}. Sesskey: ${sesskey}`);
      
      return session;
    } catch (error) {
      await browser.close().catch(() => {});
      console.error("❌ Hybrid login error:", error);
      throw new Error(
        `Login invalide ou échec du CAS: ${error instanceof Error ? error.message : "Erreur de connexion Moodle"}`
      );
    }
  }

  /**
   * Generates a fresh CAS ticket for the user's browser for a specific service
   */
  async getSSOTicket(session: UserSession, targetService?: string): Promise<string> {
    console.log(`🎫 [SSO] Generating ticket for ${session.username}...`);
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

      const service = targetService || (this.baseUrl + "/login/index.php");
      const casLoginUrl = `https://sso.univ-artois.fr/cas/login?service=${encodeURIComponent(service)}`;
      
      await page.goto(casLoginUrl, { waitUntil: "networkidle2" });
      
      // Use the stored password (if available) to log in again and get the ticket
      // @ts-ignore
      const password = session.password;
      
      if (!password) throw new Error("Credentials not available for ticket generation");

      let ticketUrl = "";
      await page.setRequestInterception(true);
      
      page.on('request', request => {
        const url = request.url();
        if (url.includes("ticket=ST-")) {
          ticketUrl = url;
          request.abort(); // Crucial: Stop Puppeteer from consuming the ticket!
        } else {
          request.continue();
        }
      });

      await page.waitForSelector('input[name="username"], #username', { timeout: 10000 });
      await page.type('input[name="username"], #username', session.username);
      
      await page.waitForSelector('input[name="password"], #password', { timeout: 5000 });
      await page.type('input[name="password"], #password', password);
      
      await Promise.all([
        page.keyboard.press('Enter'),
        // We expect an abort, so we catch the navigation error
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {})
      ]);

      if (ticketUrl) {
         console.log(`✅ SSO Ticket captured (UNCONSUMED) for ${session.username}`);
         return ticketUrl;
      }

      throw new Error(`Failed to capture ticket. Current URL: ${page.url()}`);

    } finally {
      await browser.close().catch(() => {});
    }
  }

  /**
   * Fetches the ADE Timetable ICS using Puppeteer to handle CAS login
   */
  async fetchADETimetable(session: UserSession, resources: string): Promise<string> {
    console.log(`📅 [PUPPETEER] Fetching ADE Timetable for ${session.username} (Resources: ${resources})...`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

      const adeUrl = `https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/direct_planning.jsp?calType=ical&projectId=1&resources=${resources}`;
      
      await page.goto(adeUrl, { waitUntil: "networkidle2" });

      // If redirected to CAS
      if (page.url().includes("cas.univ-artois.fr/login")) {
        console.log("🔑 Redirection CAS détectée pour ADE. Authentification...");
        if (!session.password) throw new Error("Accès ADE impossible : mot de passe manquant dans la session.");
        
        await page.waitForSelector('input[name="username"], #username', { timeout: 10000 });
        await page.type('input[name="username"], #username', session.username);
        
        await page.waitForSelector('input[name="password"], #password', { timeout: 5000 });
        await page.type('input[name="password"], #password', session.password);
        
        await Promise.all([
          page.keyboard.press('Enter'),
          page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }).catch(() => console.log("Navigation timeout during ADE login..."))
        ]);
      }

      // Capture the text content (should be the ICS)
      const content = await page.evaluate(() => (document as any).body.innerText);

      if (!content.includes("BEGIN:VCALENDAR")) {
        console.warn("⚠️ ADE Response does not contain VCALENDAR. Content snippet:", content.substring(0, 500));
        
        // Sometimes ADE shows a page with a specific link if the query is complex
        const downloadUrl = await page.evaluate(() => {
          const link = (document as any).querySelector('a[href*=".ics"]');
          return link ? link.href : null;
        });

        if (downloadUrl) {
           console.log("🔗 Found alternative download URL:", downloadUrl);
           await page.goto(downloadUrl, { waitUntil: "networkidle2" });
           return await page.evaluate(() => (document as any).body.innerText);
        }
      }

      return content;
    } finally {
      await browser.close().catch(() => {});
    }
  }

  /**
   * Search for ADE resources (classes, groups, etc.)
   */
  async searchResources(session: UserSession | null, query: string): Promise<any[]> {
    console.log(`🔍 [PUPPETEER] Searching ADE resources for query: "${query}"`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

      // Go to ADE direct index
      await page.goto("https://ade-consult.univ-artois.fr/direct/index.jsp", { waitUntil: "networkidle2" });

      // If redirected to login
      if (page.url().includes("cas.univ-artois.fr/login") && session?.password) {
        await page.type('input[name="username"]', session.username);
        await page.type('input[name="password"]', session.password);
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: "networkidle2" });
      }

      // 1. Click on search input and type
      const searchSelector = 'input[title="Rechercher"], input.gwt-TextBox';
      await page.waitForSelector(searchSelector, { timeout: 10000 });
      await page.click(searchSelector);
      await page.keyboard.down('Meta'); await page.keyboard.press('A'); await page.keyboard.up('Meta');
      await page.keyboard.press('Backspace');
      await page.keyboard.type(query);

      // 2. Click the 'Double Arrow' (>>) or Magnifying glass to trigger search
      // The search button in ADE GWT is often an IMG or a Span next to the input
      await page.keyboard.press('Enter');
      // Fallback: click the icon explicitly if enter doesn't work
      try {
        await page.click('img[src*="search"], .gwt-Image[title="Rechercher"]');
      } catch (e) {}

      await new Promise(r => setTimeout(r, 3000)); // Wait for GWT to update the tree

      // 3. Extract results from the tree nodes
      // ADE GWT uses specific class names for tree items
      const results = await page.evaluate(() => {
        const items: any[] = [];
        // Extract from tree nodes and search result labels
        const labels = (document as any).querySelectorAll('.gwt-TreeItem, .treerow, [id^="tree_node"]');
        labels.forEach((el: any) => {
          const text = el.innerText.trim();
          const idAttr = el.getAttribute('id') || "";
          // GWT IDs often look like tree_node_1234
          const match = idAttr.match(/(\d+)/);
          if (text && match && text.length > 2) {
             // Avoid adding folder names like "Emplois du temps"
             if (!["Emplois du temps", "Recherche", "Enseignants"].includes(text)) {
               items.push({ id: match[1], name: text });
             }
          }
        });
        return items;
      });

      // Dedup results
      const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
      
      console.log(`✅ Found ${uniqueResults.length} results for "${query}"`);

      // Fallback for common Artois IDs if search fails in headless
      if (uniqueResults.length === 0) {
        return [
            { id: "8005", name: "LENS - Jean Perrin" },
            { id: "4634", name: "LENS - IUT" },
            { id: "4261", name: "L1 Informatique" },
            { id: "4262", name: "L2 Informatique" },
            { id: "4263", name: "L3 Informatique" }
        ].filter(r => r.name.toLowerCase().includes(query.toLowerCase()));
      }

      return uniqueResults;
    } catch (error) {
      console.error("❌ ADE Search error:", error);
      return [];
    } finally {
      await browser.close().catch(() => {});
    }
  }

  /**
   * Fetch Assignments via core_calendar_get_action_events_by_timesort AJAX API
   */
  async getAssignments(session: UserSession): Promise<Assignment[]> {
    if (session.userId === "demo-user") {
      return [
        {
          id: "demo-1", title: "Projet de Synthèse", course: "Ingénierie Logicielle", courseId: "il-101",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), priority: "high", submissionStatus: "not_submitted", url: "#"
        }
      ];
    }

    try {
      const sesskey = session.moodleSessionId;
      console.log(`📋 Fetching API assignments (AJAX json) for ${session.username}`);

      // The Moodle internal AJAX API expects an array of payloads
      const payload = [{
        index: 0,
        methodname: "core_calendar_get_action_events_by_timesort",
        args: {
           limitnum: 20,
           timesortfrom: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60)
        }
      }];

      const response = await this.httpClient.post(
        `/lib/ajax/service.php?sesskey=${sesskey}&info=core_calendar_get_action_events_by_timesort`,
        payload,
        {
          headers: {
             "Cookie": session.cookies,
             "Content-Type": "application/json",
             "Accept": "application/json, text/javascript, */*; q=0.01",
             "X-Requested-With": "XMLHttpRequest"
          }
        }
      );

      // response.data is an array of results for each payload index
      if (!response.data || !response.data[0] || response.data[0].error) {
         console.warn("AJAX Error payload:", response.data);
         throw new Error("Moodle AJAX returned an error");
      }

      const events = response.data[0].data.events || [];
      const assignments: Assignment[] = events.map((ev: any) => {
        const dueDate = new Date(ev.timesort * 1000);
        const daysUntilDue = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        return {
          id: ev.id.toString(),
          title: ev.name,
          course: ev.course?.fullname || "Cours",
          courseId: ev.course?.id?.toString() || "0",
          dueDate: dueDate.toISOString(),
          priority: this.calculatePriority(daysUntilDue),
          submissionStatus: "not_submitted",
          url: ev.url || (`${this.baseUrl}/mod/assign/view.php?id=` + ev.instance)
        };
      });

      return assignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } catch (error) {
      console.error("❌ API Assignment fetch error:", error);
      throw new Error("Failed to fetch assignments via API");
    }
  }

  async getCourses(session: UserSession): Promise<Course[]> {
    if (session.userId === "demo-user") {
      return [
        { id: "il-101", name: "Ingénierie Logicielle", code: "IL101", instructor: "Prof. Martin", url: "#" },
        { id: "rs-202", name: "Réseaux & Cybersécurité", code: "RS202", instructor: "Prof. Dupont", url: "#" }
      ];
    }
    
    try {
      const sesskey = session.moodleSessionId;
      console.log(`📚 Fetching API courses for ${session.username}`);

      const payload = [{
        index: 0,
        methodname: "core_course_get_enrolled_courses_by_timeline_classification",
        args: {
           offset: 0,
           limit: 0,
           classification: "all",
           sort: "fullname",
           customfieldname: "",
           customfieldvalue: ""
        }
      }];

      const response = await this.httpClient.post(
        `/lib/ajax/service.php?sesskey=${sesskey}&info=core_course_get_enrolled_courses_by_timeline_classification`,
        payload,
        {
          headers: {
             "Cookie": session.cookies,
             "Content-Type": "application/json",
             "Accept": "application/json, text/javascript, */*; q=0.01",
             "X-Requested-With": "XMLHttpRequest"
          }
        }
      );

      if (!response.data || !response.data[0] || response.data[0].error) {
         throw new Error("Moodle AJAX (courses) returned an error");
      }

      const coursesData = response.data[0].data.courses || [];
      return coursesData.map((c: any) => ({
        id: c.id.toString(),
        name: c.fullname,
        code: c.shortname || c.fullname.substring(0, 10),
        instructor: "Enseignant",
        url: c.viewurl || `${this.baseUrl}/course/view.php?id=${c.id}`
      }));
    } catch (error) {
       console.error("❌ API Courses fetch error:", error);
       return [];
    }
  }

  async getCatalog(session: UserSession, categoryId: string): Promise<Course[]> {
    if (session.userId === "demo-user") {
      return [
        { id: "cat-1", name: "Algorithmique Avancée", code: "ALGO", instructor: "Prof. Alan", url: "#" },
        { id: "cat-2", name: "Architecture des Réseaux", code: "RES", instructor: "Prof. Bob", url: "#" },
      ];
    }
    
    try {
      console.log(`📖 Fetching Catalog HTML (categoryid=${categoryId}) for ${session.username}`);
      const response = await this.httpClient.get(`/course/index.php?categoryid=${categoryId}`, {
        headers: { "Cookie": session.cookies }
      });
      
      const cheerio = require("cheerio");
      const $ = cheerio.load(response.data);
      const courses: Course[] = [];

      // Moodle standard theme uses .coursebox
      $(".coursebox").each((i: number, el: any) => {
        const titleEl = $(el).find(".coursename a");
        const fullname = titleEl.text().trim();
        const url = titleEl.attr("href") || "";
        
        let idMatch = url.match(/id=(\d+)/);
        let id = idMatch ? idMatch[1] : `c-${Math.floor(Math.random()*100000)}`;

        const teachers: string[] = [];
        $(el).find(".teachers li a").each((j: number, tel: any) => teachers.push($(tel).text().trim()));
        const instructor = teachers.length > 0 ? teachers.join(", ") : "Équipe Pédagogique";

        if (fullname) {
          courses.push({
            id,
            name: fullname,
            code: fullname.substring(0, 15) + (fullname.length > 15 ? "..." : ""),
            instructor,
            url
          });
        }
      });

      return courses;
    } catch (error) {
       console.error("❌ API Catalog fetch error:", error);
       return [];
    }
  }

  async getCourseContent(session: UserSession, courseId: string): Promise<CourseSection[]> {
    if (session.userId === "demo-user") {
      return [
        { 
          id: "s1", name: "Introduction", summary: "Les bases du cours", 
          activities: [{ id: "a1", name: "Support de cours PDF", type: "resource", url: "#" }] 
        },
        { 
          id: "s2", name: "Chapitre 1 : Algorithmes", 
          activities: [{ id: "a2", name: "Exercices", type: "assign", url: "#" }] 
        }
      ];
    }

    console.log(`🚀 [PUPPETEER] Deep Scraping course contents (id=${courseId}) for ${session.username}`);
    
    let tempBrowser;
    let page;
    try {
      tempBrowser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
      
      page = await tempBrowser.newPage();
      
      const cookieMatch = session.cookies.match(/MoodleSession=([^;]+)/);
      if (cookieMatch) {
        await page.setCookie({
          name: "MoodleSession",
          value: cookieMatch[1],
          domain: new URL(this.baseUrl).hostname,
          path: "/",
          httpOnly: true,
          secure: true
        });
      }
      
      const courseUrl = `${this.baseUrl}/course/view.php?id=${courseId}`;
      await page.goto(courseUrl, { waitUntil: "networkidle2", timeout: 30000 });
      // 3. Wait for the actual content, not just the container
      try {
        await page.waitForSelector(".section, .course-section, [id^='section-']", { timeout: 15000 });
      } catch (err) {
        console.warn("Timeout waiting for sections, proceeding with initial DOM state.");
      }

      const sections = await page.evaluate(() => {
        const results: any[] = [];
        // More specific selector for main sections
        const sectionEls = Array.from(((document as any)).querySelectorAll("li.section.main, .course-section, [id^='section-']")).filter((el: any) => {
          const parent = el.parentElement?.closest(".section, .course-section, [id^='section-']");
          return !parent;
        });
        
        const seenSignatures = new Set<string>();

        sectionEls.forEach((sectionEl: any, i) => {
          try {
            const nameEl = sectionEl.querySelector(".sectionname, .section-title, h3, [data-for='section_title']") as any;
            let name = nameEl ? nameEl.innerText.trim() : `Section ${i}`;

            // Clean name
            name = name
              .replace(/Replier/gi, "")
              .replace(/Tout replier/gi, "")
              .replace(/Déplier/gi, "")
              .replace(/Tout déplier/gi, "")
              .replace(/Sélectionner la section/gi, "")
              .trim();

            if (name) {
              const words = name.split(/\s+/);
              if (words.length >= 2 && words.length % 2 === 0) {
                const half = words.length / 2;
                if (words.slice(0, half).join(" ") === words.slice(half).join(" ")) {
                  name = words.slice(0, half).join(" ");
                }
              }
            }

            const activities: any[] = [];
            const activityEls = sectionEl.querySelectorAll(".activity");
            
            activityEls.forEach((activityEl: any, j: number) => {
              const linkEl = activityEl.querySelector("a") as any;
              if (!linkEl) return;
              
              const nameInnerEl = (activityEl.querySelector(".instancename, .activityname, span.content") || linkEl) as any;
              let actName = nameInnerEl.innerText.trim();
              actName = actName.replace(/\s(Forum|Fichier|Dossier|Devoir|URL|Page|Ressource)$/i, "").trim();
              
              let url = linkEl.href || "";
              if (!actName || !url || url.includes("#")) return;
              
              if (url.includes("mod/resource/view.php")) {
                url += url.includes("?") ? "&redirect=1" : "?redirect=1";
              }
              
              const classAttr = activityEl.className || "";
              const typeMatch = classAttr.match(/modtype_(\w+)/);
              const type = typeMatch ? typeMatch[1] : "resource";
              
              const imgEl = activityEl.querySelector("img.activityicon") || activityEl.querySelector("img");
              const iconUrl = imgEl ? (imgEl as any).src : "";

              activities.push({ id: activityEl.getAttribute("id") || `act-${i}-${j}`, name: actName, type, url, iconUrl });
            });

            if (activities.length > 0) {
              // Create a signature based on the URLs of activities
              const signature = activities.map(a => a.url).sort().join("|");
              
              // Only add if we haven't seen this exact set of content before
              if (!seenSignatures.has(signature)) {
                seenSignatures.add(signature);
                results.push({ 
                  id: sectionEl.getAttribute("id") || `sec-${i}`, 
                  name: name || (i === 0 ? "Général" : `Section ${i}`), 
                  activities 
                });
              }
            }
          } catch (err) {
            console.error(err);
          }
        });
        return results;
      });

      console.log(`✅ [PUPPETEER] Success: Extracted ${sections.length} sections for id=${courseId}`);
      return sections;
      
    } catch (error) {
       console.error("❌ Puppeteer Deep Scraping error:", error);
       return [];
    } finally {
      if (page) await page.close().catch(() => {});
      if (tempBrowser) await tempBrowser.close().catch(() => {});
    }
  }
  private calculatePriority(daysUntilDue: number): "high" | "medium" | "low" {
    if (daysUntilDue <= 3) return "high";
    if (daysUntilDue <= 7) return "medium";
    return "low";
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function getSession(sessionId: string): UserSession | null {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivityTime = Date.now();
    return session;
  }
  return null;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function getAllSessions(): Map<string, UserSession> {
  return sessions;
}
