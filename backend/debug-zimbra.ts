import { CasClient } from './src/utils/casClient.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function debugZimbraURLs() {
  const username = process.env.ADE_USERNAME;
  const password = process.env.ADE_PASSWORD;

  const cas = new CasClient();
  await cas.login(username!, password!);

  const urlsToTest = [
    "https://wmailetu.univ-artois.fr/",
    "https://wmailetu.univ-artois.fr/mail",
    "https://wmailetu.univ-artois.fr/zimbra/",
    "https://wmailetu.univ-artois.fr/zimbra/mail"
  ];

  for (const service of urlsToTest) {
    try {
      console.log(`\n\n--- Testing Service: ${service} ---`);
      // Clear cookies for fresh test
      // @ts-ignore
      cas.jar.removeAllCookiesSync();
      await cas.login(username!, password!); // Ensure TGC is fresh just in case

      const ticketUrl = await cas.getServiceTicket(service);
      console.log("Ticket URL:", ticketUrl);
      
      // @ts-ignore
      const res = await cas.axiosInstance.get(ticketUrl, { 
        maxRedirects: 10,
        validateStatus: () => true 
      });
      
      console.log("Landed on:", res.config.url);
      console.log("Status:", res.status);
      
      // @ts-ignore
      const cookies = await cas.jar.getCookies("https://wmailetu.univ-artois.fr");
      console.log("Cookies found:", cookies.map((c: any) => c.key));
      
      if (cookies.some((c: any) => c.key === "ZM_AUTH_TOKEN")) {
         console.log("🚀 ZM_AUTH_TOKEN FOUND FOR:", service);
      }
    } catch (e: any) {
      console.error("Test failed for", service, e.message);
    }
  }
}

debugZimbraURLs();
