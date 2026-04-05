import axios, { AxiosInstance } from "axios";
import { CasClient } from "../utils/casClient";
import * as cheerio from "cheerio";
import type { Assignment, Course, UserSession, CourseSection } from "../types";

const sessions = new Map<string, UserSession>();

export class MoodleScraper {
  private baseUrl: string;
  private httpClient: AxiosInstance;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
    });
  }

  /**
   * Browserless Login using CasClient
   */
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

    console.log(`🔐 Authentification Directe (No-Puppeteer) pour ${username}...`);
    
    try {
      const cas = new CasClient();
      await cas.login(username, password);
      
      const { cookieHeader, sesskey } = await cas.getMoodleSession();
      
      const sessionId = this.generateSessionId();
      const session: UserSession = {
        userId: "student-ar",
        username: username,
        cookies: cookieHeader, 
        moodleSessionId: sesskey,
        loginTime: Date.now(),
        lastActivityTime: Date.now(),
        sessionId: sessionId,
        password: password, // Gardé pour le rebond ADE
      };

      sessions.set(sessionId, session);
      console.log(`✅ Direct login successful for ${username}. Sesskey: ${sesskey}`);
      
      return session;
    } catch (error) {
      console.error("❌ Direct login error:", error);
      throw new Error(
        `Login invalide ou échec du CAS: ${error instanceof Error ? error.message : "Erreur de connexion Moodle"}`
      );
    }
  }

  /**
   * Generates a fresh CAS ticket for the user's browser without Puppeteer
   */
  async getSSOTicket(session: UserSession, targetService?: string): Promise<string> {
    console.log(`🎫 [DIRECT] Generating ticket for ${session.username}...`);
    
    try {
      const cas = new CasClient();
      await cas.login(session.username, session.password || "");
      
      const service = targetService || (this.baseUrl + "/login/index.php");
      const ticketUrl = await cas.getServiceTicket(service);
      
      return ticketUrl;
    } catch (error) {
      console.error("❌ Direct ST generation error:", error);
      throw new Error("Impossible de générer le ticket SSO.");
    }
  }

  /**
   * Fetches the ADE Timetable ICS using pure HTTP
   */
  async fetchADETimetable(session: UserSession, resources: string): Promise<string> {
    console.log(`📅 [DIRECT] Fetching ADE Timetable for ${session.username} (Resources: ${resources})...`);
    
    try {
      const cas = new CasClient();
      await cas.login(session.username, session.password || "");
      
      const adeBase = "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/direct_planning.jsp";
      const ticketUrl = await cas.getServiceTicket(adeBase);
      
      // Hit ADE with ticket to establish JSESSIONID
      const initialRes = await axios.get(ticketUrl, { 
        maxRedirects: 5,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const cookies = initialRes.headers['set-cookie']?.join('; ') || "";

      // The Direct Planning URL for ICS
      const icsUrl = `https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/direct_planning.jsp?calType=ical&projectId=1&resources=${resources}`;
      
      const response = await axios.get(icsUrl, {
        headers: { 
          'User-Agent': 'Mozilla/5.0',
          'Cookie': cookies
        }
      });

      return response.data;
    } catch (error) {
      console.error("❌ ADE Fetch error:", error);
      throw new Error("Impossible de récupérer l'emploi du temps.");
    }
  }

  /**
   * Search for ADE resources (Dummy/Static until direct API is mapped)
   */
  async searchResources(_session: UserSession | null, query: string): Promise<any[]> {
    console.log(`🔍 [STUB] Searching ADE resources for query: "${query}"`);
    return [
        { id: "8005", name: "LENS - Jean Perrin" },
        { id: "4634", name: "LENS - IUT" },
        { id: "4261", name: "L1 Informatique" },
        { id: "4262", name: "L2 Informatique" },
        { id: "4263", name: "L3 Informatique" }
    ].filter(r => r.name.toLowerCase().includes(query.toLowerCase()));
  }

  /**
   * Fetch Assignments via Moodle AJAX API
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
      console.log(`📋 Fetching API assignments for ${session.username}`);

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
             "X-Requested-With": "XMLHttpRequest"
          }
        }
      );

      if (!response.data || !response.data[0] || response.data[0].error) {
         throw new Error("Moodle AJAX returned an error");
      }

      const events = response.data[0].data.events || [];
      return events.map((ev: any): Assignment => {
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
      }).sort((a: Assignment, b: Assignment) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } catch (error) {
      console.error("❌ API Assignment fetch error:", error);
      throw new Error("Failed to fetch assignments");
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
      const payload = [{
        index: 0,
        methodname: "core_course_get_enrolled_courses_by_timeline_classification",
        args: {
           offset: 0,
           limit: 0,
           classification: "all",
           sort: "fullname"
        }
      }];

      const response = await this.httpClient.post(
        `/lib/ajax/service.php?sesskey=${sesskey}&info=core_course_get_enrolled_courses_by_timeline_classification`,
        payload,
        {
          headers: {
             "Cookie": session.cookies,
             "Content-Type": "application/json",
             "X-Requested-With": "XMLHttpRequest"
          }
        }
      );

      if (!response.data || !response.data[0] || response.data[0].error) {
         throw new Error("Moodle AJAX (courses) returned an error");
      }

      const coursesData = response.data[0].data.courses || [];
      return coursesData.map((c: any): Course => ({
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
    try {
      const response = await this.httpClient.get(`/course/index.php?categoryid=${categoryId}`, {
        headers: { "Cookie": session.cookies }
      });
      
      const $ = cheerio.load(response.data);
      const courses: Course[] = [];

      $(".coursebox").each((i, el) => {
        const titleEl = $(el).find(".coursename a");
        const fullname = titleEl.text().trim();
        const url = titleEl.attr("href") || "";
        
        let idMatch = url.match(/id=(\d+)/);
        let id = idMatch ? idMatch[1] : `c-${Math.floor(Math.random()*100000)}`;

        const teachers: string[] = [];
        $(el).find(".teachers li a").each((j, tel) => { teachers.push($(tel).text().trim()); });
        const instructor = teachers.length > 0 ? teachers.join(", ") : "Équipe Pédagogique";

        if (fullname) {
          courses.push({ id, name: fullname, code: fullname.substring(0, 15), instructor, url });
        }
      });

      return courses;
    } catch (error) {
       console.error("❌ API Catalog fetch error:", error);
       return [];
    }
  }

  async getCourseContent(session: UserSession, courseId: string): Promise<CourseSection[]> {
    console.log(`🚀 [DIRECT] Scraping course contents (id=${courseId}) for ${session.username}`);
    
    try {
      const courseUrl = `${this.baseUrl}/course/view.php?id=${courseId}`;
      const response = await this.httpClient.get(courseUrl, {
        headers: { "Cookie": session.cookies }
      });
      
      const $ = cheerio.load(response.data);
      const results: CourseSection[] = [];
      const seenSignatures = new Set<string>();

      $("li.section.main").each((i, el) => {
        const sectionEl = $(el);
        const nameEl = sectionEl.find(".sectionname, .section-title, h3");
        let name = nameEl.text().trim();
        name = name.replace(/(Replier|Tout replier|Déplier|Tout déplier|Sélectionner la section)/gi, "").trim();

        const activities: any[] = [];
        sectionEl.find(".activity").each((j, aEl) => {
          const activityEl = $(aEl);
          const linkEl = activityEl.find("a");
          if (linkEl.length === 0) return;
          
          let actName = (activityEl.find(".instancename, .activityname").text() || linkEl.text()).trim();
          actName = actName.replace(/\s(Forum|Fichier|Dossier|Devoir|URL|Page|Ressource)$/i, "").trim();
          
          let url = linkEl.attr("href") || "";
          if (!actName || !url || url.includes("#")) return;
          
          if (url.includes("mod/resource/view.php")) {
            url += url.includes("?") ? "&redirect=1" : "?redirect=1";
          }
          
          let type = "resource";
          const classAttr = activityEl.attr("class") || "";
          const typeMatch = classAttr.match(/modtype_(\w+)/);
          if (typeMatch) type = typeMatch[1];
          
          const iconUrl = activityEl.find("img.activityicon").attr("src") || "";

          activities.push({ id: activityEl.attr("id") || `act-${i}-${j}`, name: actName, type, url, iconUrl });
        });

        if (activities.length > 0) {
          const signature = activities.map(a => a.url).sort().join("|");
          if (!seenSignatures.has(signature)) {
            seenSignatures.add(signature);
            results.push({ 
              id: sectionEl.attr("id") || `sec-${i}`, 
              name: name || (i === 0 ? "Général" : `Section ${i}`), 
              activities 
            });
          }
        }
      });
      return results;
    } catch (error) {
       console.error("❌ High-speed course scraping error:", error);
       return [];
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
