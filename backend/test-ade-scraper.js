const { MoodleScraper } = require('./dist/scrapers/moodleScraper');
require('dotenv').config();

async function test() {
    const scraper = new MoodleScraper('https://moodle.univ-artois.fr');
    console.log("🚀 Testing ADE Search...");
    try {
        const results = await scraper.searchResources(null, "L3 Informatique");
        console.log("✅ Search Results:", JSON.stringify(results, null, 2));
        
        if (results.length > 0) {
            const firstId = results[0].id;
            console.log(`📅 Fetching Timetable for ID: ${firstId}...`);
            // We need a session for authenticated ADE fetch, but let's test public first if possible
            // In Artois, direct_planning.jsp might need session.
            console.log("Note: Timetable fetch might require real session (SSO).");
        }
    } catch (e) {
        console.error("❌ Test failed:", e);
    }
}

test();
