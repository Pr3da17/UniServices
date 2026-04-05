import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ADE_URL = 'https://ade-consult.univ-artois.fr/direct/myplanning.jsp';
const USERNAME = process.env.ADE_USERNAME || process.env.MOODLE_USERNAME;
const PASSWORD = process.env.ADE_PASSWORD || process.env.MOODLE_PASSWORD;

async function extractTree() {
  if (!USERNAME || !PASSWORD) {
    console.error("❌ Erreur: ADE_USERNAME et ADE_PASSWORD doivent être définis dans le .env");
    process.exit(1);
  }

  console.log("🚀 Lancement du scraper ADE (Extraction Complète)...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  try {
    // 1. Connexion CAS
    console.log("🔑 Connexion au CAS Artois...");
    await page.goto(ADE_URL, { waitUntil: 'networkidle2' });

    if (page.url().includes('sso.univ-artois.fr') || page.url().includes('cas/login')) {
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.type('#username', USERNAME);
      await page.type('#password', PASSWORD);
      console.log("⌨️ Formulaire rempli, validation...");
      await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {})
      ]);
      await new Promise(r => setTimeout(r, 5000));
    }

    if (page.url().includes('cas/login')) {
        console.error("❌ Échec de la connexion CAS. Vérifiez vos identifiants dans .env");
        return;
    }

    console.log("✅ Authentifié. Accès au planning...");
    await page.waitForSelector('body', { timeout: 20000 });
    // Attente supplémentaire pour que GWT charge les ressources
    await new Promise(r => setTimeout(r, 6000));

    console.log("📂 Extraction ciblée des sous-groupes Informatique...");

    const deepExpand = async (labels: string[]) => {
        for (const label of labels) {
            console.log(`🔍 Expansion de : ${label}`);
            await page.evaluate((text) => {
                const items = Array.from(document.querySelectorAll('.x-tree3-node-text, .gwt-TreeItem'));
                const target = items.find(el => (el as any).textContent?.includes(text));
                if (target) {
                    const parent = (target as any).closest('.x-tree3-node, .gwt-TreeItem');
                    const expander = parent?.querySelector('.x-tree3-node-joint, img[src*="plus"]');
                    if (expander) (expander as any).click();
                }
            }, label);
            await new Promise(r => setTimeout(r, 2000));
        }
    };

    try {
        await deepExpand(["LENS", "Informatique", "BUT Info", "INFO 1", "INFO 2", "INFO 3"]);
    } catch (e) {}

    // Extraction finale
    const treeDataResult = await page.evaluate(`(function() {
        const findStore = () => {
            return window.GXT?.Ext?.ComponentMgr?.all?.items.find(c => c.getStore && c.el?.dom?.innerText?.includes('LENS'))?.getStore();
        };
        const store = findStore();
        if (!store) return null;
        
        // On récupère TOUS les modèles du store (même ceux dépliés)
        return store.getModels().map(m => ({
            id: m.get('id'),
            name: m.get('name'),
            path: m.get('path') || ""
        }));
    })()`);

    if (treeDataResult && (treeDataResult as any).length > 0) {
        const nodes = treeDataResult as any[];
        const siteMap: any = {};

        nodes.forEach((raw) => {
            const id = raw.id;
            const itemLabel = raw.name;
            const path = raw.path || "";
            const parts = path.split('/').filter((p: string) => p);
            
            if (parts.length >= 1) {
                const siteName = parts[0];
                if (!siteMap[siteName]) siteMap[siteName] = { id: 'site-' + siteName.toLowerCase(), name: siteName, departments: {} };
                
                if (parts.length >= 2) {
                    const deptName = parts[1];
                    if (!siteMap[siteName].departments[deptName]) siteMap[siteName].departments[deptName] = { id: 'dept-' + deptName.toLowerCase(), name: deptName, years: {} };
                    
                    if (parts.length >= 3) {
                        const yearName = parts[2];
                        if (!siteMap[siteName].departments[deptName].years[yearName]) siteMap[siteName].departments[deptName].years[yearName] = { id: 'year-' + yearName.toLowerCase().replace(/\\s/g, '-'), name: yearName, groups: [] };
                        
                        const group: any = { id: id, name: (parts.length > 3 ? parts.slice(3).join(' > ') + ' - ' : '') + itemLabel };
                        
                        // Fallback : Si c'est le groupe 1-B-2, on a le lien direct !
                        if (itemLabel.includes('1-B-2')) {
                            group.directUrl = "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/53wb26Wy.shu";
                        }
                        
                        siteMap[siteName].departments[deptName].years[yearName].groups.push(group);
                    }
                }
            }
        });

        const finalTree = {
            lastUpdated: new Date().toISOString().split('T')[0],
            sites: Object.values(siteMap).map((s: any) => ({
                ...s,
                departments: Object.values(s.departments).map((d: any) => ({
                    ...d,
                    years: Object.values(d.years)
                }))
            }))
        };

        const treeFilePath = path.join(__dirname, '../data/ade_tree.json');
        await fs.writeFile(treeFilePath, JSON.stringify(finalTree, null, 2));
        console.log(`✅ Succès ! ${nodes.length} groupes importés.`);
    }

  } catch (error: any) {
    console.error("❌ Erreur pendant l'extraction:", error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

extractTree();
