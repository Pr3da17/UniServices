import { Router } from "express";
import axios from "axios";
import { CasClient } from "../utils/casClient";
import { getSession } from "../scrapers/moodleScraper";
import { scrapers } from "../controllers/authController";
import { UserSession } from "../types";

const router = Router();

const ZIMBRA_AUTH_TIMEOUT = 30 * 60 * 1000; // 30 minutes cache

export async function refreshZimbraSession(session: UserSession): Promise<string[]> {
    console.log(`📡 [Zimbra] Refreshing session (No-Puppeteer) for ${session.username}...`);
    
    if (!session.password) {
        throw new Error("Credentials missing in session. Please relogin.");
    }

    try {
        const cas = new CasClient();
        await cas.login(session.username, session.password);
        
        // Use the magic link logic but we just need the cookies it sets
        const magicLink = await cas.getZimbraMagicLink();
        
        // The Magic Link logic already populated the cookie jar in cas.axiosInstance
        // We just need to extract them from the CasClient or hit the magic link
        const response = await axios.get(magicLink, {
            maxRedirects: 0, // We just want the cookies from the first hop
            validateStatus: () => true,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const setCookieHeaders = response.headers['set-cookie'] || [];
        if (setCookieHeaders.length === 0) {
            // Fallback: try to hit it with a proper jar if needed, 
            // but usually Preauth sets ZM_AUTH_TOKEN immediately
            console.warn("⚠️ No cookies in magic link first hop, continuing with preauth sequence...");
        }

        const cookieStrings = setCookieHeaders;
        
        // Update session
        session.zimbraCookies = cookieStrings;
        session.zimbraLastAuth = Date.now();
        
        console.log(`✅ [Zimbra] Cookies refreshed browserlessly for ${session.username}`);
        return cookieStrings;
    } catch (e: any) {
        console.error(`❌ [Zimbra] Direct refresh failed: ${e.message}`);
        throw e;
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
