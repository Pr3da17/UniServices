
import axios from 'axios';
import { getSession } from './scrapers/moodleScraper';

async function testProxy(sessionId: string, targetUrl: string) {
    const session = getSession(sessionId) as any;
    if (!session) {
        console.error("Session not found");
        return;
    }

    console.log(`Testing URL: ${targetUrl}`);
    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            headers: {
                'Cookie': session.cookies,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            maxRedirects: 0, // Don't follow to see what's happening
            validateStatus: () => true
        });

        console.log(`Status: ${response.status}`);
        console.log(`Headers:`, response.headers);
        
        if (response.status === 302 || response.status === 303) {
            console.log(`Redirecting to: ${response.headers.location}`);
        } else {
            const body = response.data;
            console.log(`Body snippet: ${body.toString().substring(0, 500)}`);
        }
    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

// I need a valid sessionId and URL to test this... 
// Since I don't have one right now, I'll look at the MoodleScraper code to see if I can find clues.
