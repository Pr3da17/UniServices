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
   * ZIMBRA MAGIC LINK (The Ultimate Backdoor)
   * Consumes a CAS ticket server-side to steal the `ZM_AUTH_TOKEN` cookie,
   * then crafts a direct preauth URL that Zimbra natively accepts to log the user in instantly.
   */
  public async getZimbraMagicLink(): Promise<string> {
    const zimbraService = "https://wmailetu.univ-artois.fr/zimbra/?loginOp=cas";
    console.log(`[CasClient] Forging Zimbra Magic Link...`);
    
    // 1. Get the ticket URL
    const ticketUrl = await this.getServiceTicket(zimbraService);
    
    // 2. Visit the ticket URL so Zimbra validates it and issues the ZM_AUTH_TOKEN cookie
    await this.axiosInstance.get(ticketUrl, { 
      maxRedirects: 5,
      validateStatus: () => true 
    });

    // 3. Extract the ZM_AUTH_TOKEN from our Tough-Cookie Jar
    const cookies = await this.jar.getCookies("https://wmailetu.univ-artois.fr");
    const authTokenCookie = cookies.find(c => c.key === "ZM_AUTH_TOKEN");
    
    if (!authTokenCookie || !authTokenCookie.value) {
      throw new Error("Impossible d'extraire le ZM_AUTH_TOKEN. Zimbra a peut-être rejeté le ticket.");
    }

    const authToken = authTokenCookie.value;
    console.log(`[CasClient] Magic Token Extracted! (${authToken.substring(0, 10)}...)`);

    // 4. Return the golden preauth URL
    return `https://wmailetu.univ-artois.fr/service/preauth?isredirect=1&authtoken=${authToken}`;
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

    // Extract sesskey from Moodle's frontend config (JavaScript M object)
    const $ = cheerio.load(moodleRes.data);
    const bodyText = $('body').html() || "";
    const sesskeyMatch = bodyText.match(/"sesskey":"([^"]+)"/);
    const sesskey = sesskeyMatch ? sesskeyMatch[1] : "";

    console.log(`[CasClient] Moodle Session Forged! (sesskey=${sesskey})`);
    return { cookieHeader, sesskey };
  }
}

