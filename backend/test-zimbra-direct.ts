import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import dotenv from 'dotenv';
dotenv.config();

async function testZimbraDirectLogin() {
  const username = process.env.ADE_USERNAME; 
  const password = process.env.ADE_PASSWORD;

  if (!username || !password) {
    console.error("Missing credentials in .env");
    return;
  }

  const jar = new CookieJar();
  const client = wrapper(axios.create({ 
    jar,
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  }));

  try {
    console.log("--- Step 1: POST to Zimbra Login ---");
    const formData = new URLSearchParams();
    formData.append('loginOp', 'login');
    formData.append('username', username);
    formData.append('password', password);
    formData.append('client', 'standard'); // or 'advanced'? usually standard for headless

    const loginRes = await client.post('https://wmailetu.univ-artois.fr/', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log("Login Status:", loginRes.status);
    console.log("Login Response URL:", loginRes.config.url);

    const cookies = await jar.getCookies("https://wmailetu.univ-artois.fr");
    console.log("Cookies captured:", cookies.map(c => c.key));

    const zimbraAuthToken = cookies.find(c => c.key === "ZM_AUTH_TOKEN");
    if (zimbraAuthToken) {
      console.log("✅ SUCCESS: ZM_AUTH_TOKEN captured via Direct Login!");
      
      console.log("--- Step 2: Test Inbox JSON ---");
      const resp = await client.get('https://wmailetu.univ-artois.fr/home/~/inbox.json?limit=5');
      console.log("Inbox Status:", resp.status);
      if (resp.status === 200) {
        console.log("Inbox Data Sample:", JSON.stringify(resp.data).substring(0, 100));
      }
    } else {
      console.error("❌ FAILED: ZM_AUTH_TOKEN not found in cookies.");
      console.log("Response HTML Preview:", loginRes.data.substring(0, 500));
    }

  } catch (err: any) {
    console.error("Test failed:", err.message);
  }
}

testZimbraDirectLogin();
