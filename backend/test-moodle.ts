import { CasClient } from './src/utils/casClient.js';
import { MoodleScraper } from './src/scrapers/moodleScraper.js';
import dotenv from 'dotenv';
dotenv.config();

async function testMoodleCourses() {
  const username = process.env.ADE_USERNAME;
  const password = process.env.ADE_PASSWORD;

  console.log(`[Test] Logging into Moodle using CasClient...`);
  const scraper = new MoodleScraper("https://moodle.univ-artois.fr");

  try {
    const session = await scraper.login(username!, password!);
    console.log("Session obtained! Sesskey:", session.moodleSessionId);
    
    console.log("[Test] Fetching courses...");
    const courses = await scraper.getCourses(session);
    console.log(`Found ${courses.length} courses!`);
    if (courses.length > 0) {
        console.log("Sample Course:", courses[0].name);
    } else {
        console.log("No courses found. This might be the issue!");
    }
  } catch (err: any) {
    console.error("❌ Moodle test failed:", err.message);
    if (err.stack) console.error(err.stack);
  }
}

testMoodleCourses();
