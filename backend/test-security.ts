import { MoodleScraper, getSession } from './src/scrapers/moodleScraper.js';
import { decrypt } from './src/utils/security.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSecurity() {
  const username = process.env.ADE_USERNAME;
  const password = process.env.ADE_PASSWORD;

  console.log(`[Test] Logging into Moodle to test AES encryption...`);
  const scraper = new MoodleScraper("https://moodle.univ-artois.fr");

  try {
    const session = await scraper.login(username!, password!);
    console.log("✅ Session obtained!");
    
    if (!session.encryptedPassword) {
      console.error("❌ Session does NOT contain an encrypted Password!");
      process.exit(1);
    }
    
    console.log("🔒 Encrypted payload:", session.encryptedPassword);
    
    const decrypted = decrypt(session.encryptedPassword);
    if (decrypted === password) {
      console.log("✅ Decryption successful & matches original password!");
    } else {
      console.error("❌ Decryption mismatch!");
      process.exit(1);
    }
    
    // Testing the SSO Jump route capability
    console.log("[Test] Testing ADE ticket generation...");
    const ticketUrl = await scraper.getSSOTicket(session, "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/direct_planning.jsp");
    console.log("✅ Ticket URL generated:", ticketUrl);
    
  } catch (err: any) {
    console.error("❌ Security test failed:", err.message);
    if (err.stack) console.error(err.stack);
  }
}

testSecurity();
