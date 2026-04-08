import { CasClient } from './src/utils/casClient.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testZimbra() {
  const username = process.env.ADE_USERNAME; // Using this as a proxy for any test user
  const password = process.env.ADE_PASSWORD;

  if (!username || !password) {
    console.error("Missing credentials in .env");
    return;
  }

  try {
    const cas = new CasClient();
    console.log("--- Step 1: Forge Zimbra Cookies ---");
    const cookies = await cas.getZimbraAuthCookies(username, password);
    console.log("Cookies captured:", cookies);

    const tokenCookie = cookies.find(c => c.startsWith("ZM_AUTH_TOKEN="));
    console.log("Found Token Cookie:", tokenCookie);

    console.log("--- Step 2: Try fetching Inbox JSON ---");
    const zimbraBase = "https://wmailetu.univ-artois.fr/zimbra";
    const inboxUrl = `${zimbraBase}/home/~/inbox.json?limit=5`;
    
    const resp = await axios.get(inboxUrl, {
      headers: {
        'Cookie': cookies.join('; '),
        'User-Agent': 'Mozilla/5.0'
      },
      validateStatus: () => true
    });

    console.log("Inbox Status:", resp.status);
    if (resp.status === 200) {
      console.log("Inbox Data Sample:", JSON.stringify(resp.data).substring(0, 200));
    } else {
      console.warn("Inox Fetch Failed. Response body:", resp.data);
    }

    console.log("--- Step 3: Test Magic Link ---");
    const magicLink = await cas.getZimbraMagicLink();
    console.log("Generated Magic Link:", magicLink);
    
    const magicResp = await axios.get(magicLink, {
        maxRedirects: 0,
        validateStatus: () => true
    });
    console.log("Magic Link Status (1st hop):", magicResp.status);
    console.log("Magic Link Location:", magicResp.headers.location);
    console.log("Magic Link Cookies:", magicResp.headers['set-cookie']);

  } catch (err: any) {
    console.error("Test failed:", err.message);
  }
}

testZimbra();
