import { CasClient } from './src/utils/casClient.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
dotenv.config();

async function traceEntWebmailLink() {
  const username = process.env.ADE_USERNAME;
  const password = process.env.ADE_PASSWORD;

  const cas = new CasClient();
  await cas.login(username!, password!);

  try {
    const entUrl = "https://ent.univ-artois.fr/uPortal/Login";
    const ticketUrl = await cas.getServiceTicket(entUrl);
    
    // @ts-ignore
    const entRes = await cas.axiosInstance.get(ticketUrl, { maxRedirects: 5, validateStatus: () => true });
    console.log("Logged into ENT. Landed on:", entRes.config.url);
    
    const html = entRes.data;
    const $ = cheerio.load(html);
    
    // Try to find the webmail link.
    // It might be an 'a' tag with text 'Zimbra' or 'webmail'
    const links: any[] = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().toLowerCase();
      if (href && (href.includes('zimbra') || href.includes('mail') || text.includes('mail'))) {
        links.push({ text, href });
      }
    });

    console.log("\nFound Potential Mail Links in ENT HTML:");
    console.log(links);

    // If nothing useful, maybe it's loaded via XHR/JSON in uPortal 5
    // Let's dump some portlet data
    const scriptText = $('script').text();
    if (scriptText.includes('wmailetu')) {
      console.log("\nFound 'wmailetu' inside a script block!");
    } else {
        console.log("\n'wmailetu' not found in scripts. Let's dump body snippet.", html.substring(0, 300));
    }

    // A common uPortal trick is to fetch portlets dynamically.
    // Let's see if there's a specific portlet url.
    console.log("\nSearching for portlets...");
    $('[id^="portlet_"]').each((i, el) => {
        console.log("Portlet ID:", $(el).attr('id'));
    });

  } catch (e: any) {
    console.error("Test failed:", e.message);
  }
}

traceEntWebmailLink();
