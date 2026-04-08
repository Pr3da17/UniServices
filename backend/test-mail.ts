import { refreshZimbraSession } from './src/routes/mail.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testFullZimbra() {
  const session = {
    username: process.env.ADE_USERNAME,
    password: process.env.ADE_PASSWORD,
    zimbraCookies: [],
    zimbraLastAuth: 0
  };

  try {
    // @ts-ignore
    const cookies = await refreshZimbraSession(session);
    console.log("Session cookies:", cookies);

    const zimbraBase = "https://wmailetu.univ-artois.fr";
    console.log("Fetching Inbox...");
    const res = await axios.get(`${zimbraBase}/home/~/inbox.json?limit=5`, {
      headers: {
        "Cookie": cookies.join('; '),
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    console.log("Inbox Status:", res.status);
    if (res.data && (res.data.m || res.data.message)) {
      console.log("Extracted messages:", res.data.m ? res.data.m.length : 0);
      const rawMessages = res.data.m || res.data.message || [];
      if (rawMessages.length > 0) {
        console.log("First message subject:", rawMessages[0].su || rawMessages[0].subject);
      }
    } else {
      console.log("Response body did not contain messages.");
      console.log(res.data);
    }
  } catch (err: any) {
    console.error("Test failed:", err.message);
  }
}

testFullZimbra();
