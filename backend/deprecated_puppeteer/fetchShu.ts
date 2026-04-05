import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const ADE_URL = "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/direct_planning.jsp";
const TARGET_URL = "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/.shu";
const USERNAME = process.env.ADE_USERNAME || "";
const PASSWORD = process.env.ADE_PASSWORD || "";

async function fetchSecretLink() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log("🔑 Connexion au CAS...");
        await page.goto(ADE_URL, { waitUntil: 'networkidle2' });
        
        if (page.url().includes('cas/login')) {
            await page.type('#username', USERNAME);
            await page.type('#password', PASSWORD);
            await Promise.all([page.keyboard.press('Enter'), page.waitForNavigation({ waitUntil: 'networkidle2' })]);
        }

        console.log(`📡 Accès au lien : ${TARGET_URL}`);
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
        
        const content = await page.evaluate(() => document.body.innerText);
        console.log("--- CONTENU DU LIEN ---");
        console.log(content);
        console.log("------------------------");
        
    } catch (e) {
        console.error("❌ Erreur:", e);
    } finally {
        await browser.close();
    }
}

fetchSecretLink();
