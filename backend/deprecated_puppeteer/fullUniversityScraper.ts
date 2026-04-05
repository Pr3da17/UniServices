import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADE_URL = "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/direct_planning.jsp";
const USERNAME = process.env.ADE_USERNAME || "";
const PASSWORD = process.env.ADE_PASSWORD || "";

async function scrapeEverything() {
    console.log("🚀 Initialisation du Scraper Universalis (Artois)...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Interception des réponses RPC
    let treePayload = null;
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('gwtdirectplanning/rpc')) {
            try {
                const text = await response.text();
                // On cherche le gros bloc de l'arborescence (généralement le plus volumineux)
                if (text.includes('com.ade.planning.client.shared.Resource') && text.length > 50000) {
                    console.log("💎 Arborescence massive détectée (Flux RPC) !");
                    treePayload = text;
                }
            } catch {}
        }
    });

    try {
        console.log("🔑 Connexion au CAS...");
        await page.goto(ADE_URL, { waitUntil: 'networkidle2' });
        
        if (page.url().includes('cas/login')) {
            await page.type('#username', USERNAME);
            await page.type('#password', PASSWORD);
            await Promise.all([page.keyboard.press('Enter'), page.waitForNavigation({ waitUntil: 'networkidle2' })]);
        }

        console.log("📂 Page ADE chargée. Extraction massive Multi-Frame...");
        
        await new Promise(r => setTimeout(r, 20000)); // Attente longue pour GWT/Iframe

        let fullTree = null;
        const frames = page.frames();

        for (const frame of frames) {
            try {
                const data = await frame.evaluate(`(() => {
                    const Ext = window.Ext;
                    const tree = Ext && Ext.getCmp && Ext.getCmp('Direct Planning Tree');
                    if (!tree) return null;

                    const store = tree.getStore();
                    // On force le chargement du store si besoin
                    const allNodes = store.getRange ? store.getRange() : [];
                    
                    return allNodes.map((node: any) => ({
                        id: node.get('id') || node.get('ID'),
                        name: node.get('name') || node.get('NAME'),
                        type: node.get('type') || node.get('TYPE'),
                        path: node.get('path') || ""
                    }));
                })()`);

                if (data && (data as any).length > 0) {
                    fullTree = data;
                    console.log(`💎 GXT Store trouvé dans la frame: ${frame.url()} (${ (data as any).length } ressources)`);
                    break;
                }
            } catch (e) {}
        }

        if (fullTree && (fullTree as any).length > 0) {
            console.log(`✅ Extraction réussie ! ${ (fullTree as any).length } ressources trouvées.`);
            await fs.writeFile(
                path.join(__dirname, '../data/ade_full_tree_raw.json'), 
                JSON.stringify(fullTree, null, 2)
            );
            console.log("💾 Données universelles sauvegardées dans data/ade_full_tree_raw.json");
        } else {
            console.warn("⚠️ Impossible d'accéder au Store GXT. Vérification visuelle...");
            await page.screenshot({ path: path.join(__dirname, '../logs/failed_gxt_store.png') });
        }

    } catch (e) {
        console.error("❌ Erreur critique pendant l'extraction:", e);
    } finally {
        await browser.close();
    }
}

scrapeEverything();
