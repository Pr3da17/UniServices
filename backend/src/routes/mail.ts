import { Router } from "express";
import axios from "axios";
import puppeteer from "puppeteer";
import { getSession } from "../scrapers/moodleScraper";
import { scrapers } from "../controllers/authController";
import { UserSession } from "../types";

const router = Router();

const ZIMBRA_AUTH_TIMEOUT = 30 * 60 * 1000; // 30 minutes cache

/**
 * Robustly fetch Zimbra cookies using Puppeteer to handle CAS SSO
 */
export async function refreshZimbraSession(session: UserSession): Promise<string[]> {
    console.log(`📡 [Zimbra] Refreshing session via Puppeteer for ${session.username}...`);
    
    if (!session.password) {
        throw new Error("Credentials missing in session. Please relogin.");
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        const zimbraBase = "https://wmailetu.univ-artois.fr";
        
        console.log(`📡 [Zimbra] Navigating directly to local login: ${zimbraBase}`);
        await page.goto(zimbraBase, { waitUntil: "networkidle2", timeout: 45000 });

        // Handle the local Zimbra login form (NOT CAS)
        if (await page.$('#username')) {
            console.log(`🔑 [Zimbra] Local login form detected for ${session.username}...`);
            
            await page.waitForSelector('#username', { timeout: 10000 });
            await page.type('#username', session.username);
            
            await page.waitForSelector('#password', { timeout: 10000 });
            await page.type('#password', session.password!);
            
            // Click the actual login button to be safer than just 'Enter'
            const loginButton = await page.$('.ZLoginButton, input[type="submit"], button[type="submit"]');
            
            await Promise.all([
                loginButton ? loginButton.click() : page.keyboard.press('Enter'),
                page.waitForNavigation({ waitUntil: "networkidle2", timeout: 35000 }).catch(() => console.warn("⚠️ Navigation possiblement terminée (Zimbra AJAX load)."))
            ]);
        }

        // Wait for landing on Zimbra or any authenticated Artois URL
        try {
            await page.waitForFunction(() => 
                window.location.href.includes("univ-artois.fr") && 
                !window.location.href.includes("cas/login"), 
                { timeout: 15000 }
            );
        } catch (e) {
            const currentUrl = page.url();
            console.error(`❌ [Zimbra] Navigation failed. Current URL: ${currentUrl}`);
            if (currentUrl.includes("login")) {
                throw new Error("Identifiants incorrects ou échec de session CAS.");
            }
            throw new Error(`Redirection Zimbra échouée. URL actuelle: ${currentUrl}`);
        }

        const cookies = await page.cookies();
        const cookieStrings = cookies.map(c => `${c.name}=${c.value}`);
        
        if (cookieStrings.length === 0) {
            throw new Error("Aucun cookie récupéré depuis Zimbra.");
        }

        // Update session
        session.zimbraCookies = cookieStrings;
        session.zimbraLastAuth = Date.now();
        
        console.log(`✅ [Zimbra] Cookies refreshed for ${session.username}`);
        return cookieStrings;
    } finally {
        await browser.close().catch(() => {});
    }
}

/**
 * Zimbra Mail route: returns the latest emails from Zimbra
 */
router.get("/", async (req, res) => {
    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
    }

    const session = getSession(sessionId.toString());
    if (!session) {
        return res.status(401).json({ error: "Invalid or expired session" });
    }

    try {
        const zimbraBase = "https://wmailetu.univ-artois.fr";
        
        // Cache management
        const now = Date.now();
        const needsAuth = !session.zimbraCookies || 
                         session.zimbraCookies.length === 0 || 
                         !session.zimbraLastAuth || 
                         (now - session.zimbraLastAuth > ZIMBRA_AUTH_TIMEOUT);

        let zimbraCookies = session.zimbraCookies || [];

        if (needsAuth) {
            try {
                zimbraCookies = await refreshZimbraSession(session);
            } catch (authError: any) {
                return res.status(401).json({
                    success: false,
                    error: "Session Zimbra expirée",
                    details: authError.message,
                    reloginRequired: authError.message.includes("Credentials missing")
                });
            }
        }

        // Fetch Inbox JSON
        const potentialPaths = [
            "/home/~/inbox.json?limit=15",
            "/service/home/~/inbox.json?limit=15",
            "/home/~/Inbox?fmt=json&limit=15"
        ];
        
        let inboxData: any = null;
        let lastError = "";

        for (const path of potentialPaths) {
            try {
                const response = await axios.get(`${zimbraBase}${path}`, {
                    headers: {
                        "Cookie": zimbraCookies.join('; '),
                        "User-Agent": "Mozilla/5.0",
                        "Accept": "application/json"
                    },
                    timeout: 8000
                });

                if (response.data && (response.data.m || response.data.message)) {
                    inboxData = response.data;
                    break;
                }
            } catch (err: any) {
                lastError = err.message;
                // If 401/403, our cookies might be stale even if within 30min
                if (err.response?.status === 401 || err.response?.status === 403) {
                    session.zimbraCookies = []; // Invalidate for next try
                }
            }
        }

        if (!inboxData) {
            throw new Error(`Impossible de récupérer les mails: ${lastError}`);
        }

        const rawMessages = inboxData.m || inboxData.message || [];
        const messages = rawMessages.map((m: any) => {
            // Zimbra REST API mapping
            // su: subject, fr: from (display name <email>), d: date (ms timestamp)
            const fromRaw = m.fr || m.from || "Inconnu";
            const senderName = fromRaw.split('<')[0].trim() || fromRaw;
            
            return {
                id: m.id,
                subject: m.su || m.subject || "(Sans objet)",
                sender: senderName,
                date: new Date(m.d || m.date).toISOString(),
                unread: (m.f?.includes("u")) || (m.flags?.includes("u")) || false,
                priority: (m.f?.includes("!") || m.flags?.includes("!")) ? "high" : "normal",
                preview: senderName
            };
        });

        res.json({
            success: true,
            data: messages
        });

    } catch (error: any) {
        console.error("❌ [Zimbra] Error:", error.message);
        res.status(500).json({ 
            success: false, 
            error: "Erreur de synchronisation Zimbra", 
            details: error.message 
        });
    }
});

/**
 * Zimbra Mail Detail route: Fetches full content of a specific email
 */
router.get("/:id", async (req, res) => {
    const { sessionId } = req.query;
    const mailId = req.params.id;

    if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
    }

    const session = getSession(sessionId.toString());
    if (!session || !session.zimbraCookies || session.zimbraCookies.length === 0) {
        return res.status(401).json({ error: "Session Zimbra non initialisée" });
    }

    try {
        const soapApiUrl = "https://wmailetu.univ-artois.fr/service/soap";

        const soapRequest = {
            "Header": {
                "context": {
                    "_jsns": "urn:zimbra"
                }
            },
            "Body": {
                "GetMsgRequest": {
                    "_jsns": "urn:zimbraMail",
                    "m": {
                        "id": mailId,
                        "html": 1
                    }
                }
            }
        };

        const csrfCookie = session.zimbraCookies.find(c => c.startsWith("ZM_LOGIN_CSRF="));
        const csrfToken = csrfCookie ? csrfCookie.split(";")[0].replace("ZM_LOGIN_CSRF=", "") : "";

        const response = await axios.post(soapApiUrl, soapRequest, {
            headers: {
                "Cookie": session.zimbraCookies.join('; '),
                "User-Agent": "Mozilla/5.0",
                "Content-Type": "application/json",
                ...(csrfToken ? { "X-Zimbra-Csrf-Token": csrfToken } : {})
            },
            timeout: 10000
        });

        const body = response.data;
        if (body?.Body?.Fault) {
            throw new Error(body.Body.Fault.Reason.Text || "Soap Fault");
        }

        const msgData = body?.Body?.GetMsgResponse?.m?.[0];
        if (!msgData) {
            throw new Error("Message introuvable ou illisible.");
        }

        let htmlContent = "";
        let textContent = "";

        // Zimbra multiplex recursively nests multiparts if there are attachments
        const parseMultiparts = (parts: any[]) => {
            if (!parts) return;
            for (const p of parts) {
                if (p.ct === "text/html" && p.content) htmlContent = p.content;
                else if (p.ct === "text/plain" && p.content) textContent = p.content;
                else if (p.mp) parseMultiparts(p.mp); // Recurse
            }
        };

        if (msgData.mp) {
            parseMultiparts(msgData.mp);
        }

        // Some emails don't use multipart and just have raw 'fr' property
        if (!htmlContent && !textContent && msgData.fr) {
            textContent = msgData.fr;
        }

        const fromNode = Array.isArray(msgData.e) ? msgData.e.find((e: any) => e.t === "f") : null;
        const sender = fromNode ? (fromNode.d || fromNode.a || "Inconnu") : "Inconnu";

        res.json({
            success: true,
            data: {
                id: msgData.id,
                subject: msgData.su || "(Sans objet)",
                sender: sender,
                date: new Date(msgData.d).toISOString(),
                content: htmlContent || textContent,
                type: htmlContent ? 'html' : 'text'
            }
        });

    } catch (error: any) {
        const errorDetail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error("❌ [Zimbra] Email Detail Fetch Error:", errorDetail);
        res.status(500).json({ 
            success: false, 
            error: "Impossible de charger le contenu de l'e-mail",
            details: errorDetail
        });
    }
});

export default router;
