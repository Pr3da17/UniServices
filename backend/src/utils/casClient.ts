import axios from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

/**
 * Fast, headless CAS Client using pure HTTP requests.
 * This class authenticates a user and generates zero-click Service Tickets (ST)
 * targeting specific University applications instantly.
 */
export class CasClient {
  private axiosInstance;
  private jar;
  private readonly casBase = "https://sso.univ-artois.fr/cas";

  constructor() {
    this.jar = new CookieJar();
    // Wrap axios with a cookie jar so JSESSIONID and TGC are retained
    this.axiosInstance = wrapper(axios.create({ 
      jar: this.jar,
      maxRedirects: 5,
      // Treat 3xx redirects as successful resolutions so we can follow or stop as needed
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    }));
  }

  /**
   * Performs the initial login sequence to obtain the TGC cookie.
   */
  public async login(username: string, password: string): Promise<string> {
    console.log(`[CasClient] Initiating login sequence for ${username}...`);
    // Step 1: Reach the login page to get JSESSIONID and the execution token
    const initialRes = await this.axiosInstance.get(`${this.casBase}/login`);
    const $ = cheerio.load(initialRes.data);
    const execution = $('input[name="execution"]').val();

    if (!execution) {
      throw new Error("Could not extract CAS execution token. CAS structure might have changed.");
    }

    // Step 2: Post credentials to establish the global session (TGC)
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('execution', execution.toString());
    formData.append('_eventId', 'submit');

    // We block redirects during login to inspect headers primarily, but axios-cookiejar handles it nicely
    // Artois CAS usually serves a 200 OK after successful POST if no service is requested,
    // or a 302 if a service is requested. We POST to /login without service for a pure TGC fetch.
    const loginRes = await this.axiosInstance.post(`${this.casBase}/login`, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Check if login failed (CAS generally returns the login page again with an error pane)
    if (loginRes.data.includes('identifiants') || loginRes.data.includes('invalide')) {
      throw new Error("Identifiants SSO invalides ou rejetés.");
    }

    console.log(`[CasClient] Login successful. Session established.`);
    return "OK";
  }

  /**
   * Generates a Service Ticket (ST) directed at a specific target URL.
   * Note: The login() method must have been called successfully before this.
   */
  public async getServiceTicket(targetServiceUrl: string): Promise<string> {
    console.log(`[CasClient] Requesting Service Ticket for: ${targetServiceUrl}`);
    
    // Disable redirects so we can snatch the Location header that contains the ticket
    const ticketRes = await this.axiosInstance.get(`${this.casBase}/login`, {
      params: { service: targetServiceUrl },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status <= 302
    });

    if (ticketRes.status === 302 && ticketRes.headers.location) {
      // The location will look like: https://moodle.univ-artois.fr/login/index.php?ticket=ST-12345-abcde...
      console.log(`[CasClient] ST Generated! Fast Track ready.`);
      return ticketRes.headers.location;
    }

    // If it didn't redirect, the TGC cookie is missing or expired
    throw new Error("Échec de la génération du ticket. La session globale est expirée.");
  }

  /**
   * ZIMBRA SOAP AUTHENTICATION
   * Uses Zimbra's official SOAP API to authenticate directly and obtain the ZM_AUTH_TOKEN
   * in its raw form (the long 0_... string). This is 100% reliable and instantaneous.
   */
  public async getZimbraSoapToken(username: string, password: string): Promise<string> {
    console.log(`[CasClient] Forging Zimbra SOAP session for ${username}...`);
    
    // Format to standard email for Zimbra if needed (Artois uses @ens.univ-artois.fr)
    const email = username.includes('@') ? username : `${username}@ens.univ-artois.fr`;

    const requestJson = {
      "Header": {
        "context": {
          "_jsns": "urn:zimbra",
          "userAgent": { "name": "ZimbraWebClient" }
        }
      },
      "Body": {
        "AuthRequest": {
          "_jsns": "urn:zimbraAccount",
          "account": { "by": "name", "_content": email },
          "password": { "_content": password }
        }
      }
    };

    try {
      const res = await axios.post('https://wmailetu.univ-artois.fr/service/soap', requestJson, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 10000
      });

      const body = res.data?.Body;
      const token = body?.AuthResponse?.authToken?.[0]?._content;
      
      if (token) {
        console.log(`[CasClient] Zimbra SOAP Token Forged Successfully!`);
        return token;
      }
      
      throw new Error("AuthToken manquant dans la réponse SOAP.");
    } catch (err: any) {
      console.error(`[CasClient] SOAP Auth Failed: ${err.message}`);
      throw new Error("Authentification Zimbra échouée via l'API.");
    }
  }

  /**
   * MOODLE SESSION FORGER
   * Authenticates against Artois CAS and obtains the final MoodleSession cookie.
   */
  public async getMoodleSession(): Promise<{ cookieHeader: string; sesskey: string }> {
    const moodleLoginUrl = "https://moodle.univ-artois.fr/login/index.php";
    console.log(`[CasClient] Forging Moodle Session...`);

    // 1. Get the ticket URL from CAS
    const ticketUrlWithST = await this.getServiceTicket(moodleLoginUrl);

    // 2. Hit Moodle with the ticket to get the session cookies
    // Moodle will redirect to the dashboard once authenticated
    const moodleRes = await this.axiosInstance.get(ticketUrlWithST, {
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400
    });

    // 3. Extract MoodleSession and sesskey
    const cookies = await this.jar.getCookies("https://moodle.univ-artois.fr");
    const moodleSession = cookies.find(c => c.key === "MoodleSession");
    
    if (!moodleSession) {
      throw new Error("MoodleSession cookie not found after ST validation.");
    }

    const cookieHeader = cookies.map(c => `${c.key}=${c.value}`).join('; ');

    // Extract sesskey from the raw HTML structure (it's in the <head> scripts)
    const rawHtml = moodleRes.data || "";
    const sesskeyMatch = rawHtml.match(/"sesskey":"([^"]+)"/);
    const sesskey = sesskeyMatch ? sesskeyMatch[1] : "";

    console.log(`[CasClient] Moodle Session Forged! (sesskey=${sesskey})`);
    return { cookieHeader, sesskey };
  }
}

