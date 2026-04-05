import ical from 'node-ical';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MASTER_LINKS = [
    { site: "ARRAS", url: "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/qnqxM4YJ.shu" },
    { site: "DOUAI", url: "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/o35wmLnR.shu" },
    { site: "LENS (Jean Perrin)", url: "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/Xn0DV2n7.shu" },
    { site: "LENS (IUT)", url: "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/9n9wpN3P.shu" },
    { site: "LIÉVIN (Staps)", url: "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/1348LJ3k.shu" },
    { site: "SUAPS (Sport)", url: "https://ade-consult.univ-artois.fr/jsp/custom/modules/plannings/ZYjy1B3B.shu" }
];

function isTeacherName(name: string): boolean {
    const words = name.trim().split(/\s+/);
    if (words.length < 2 || words.length > 5) return false;
    
    // Si ça contient des chiffres, ce n'est probablement pas un nom pur de prof dans ADE
    if (/\d/.test(name)) return false;
    
    const upper = name.toUpperCase();
    const commonGroupCodes = ['L1', 'L2', 'L3', 'M1', 'M2', 'BUT', 'MMI', 'INFO', 'GEA', 'TC', 'FCA', 'DAEU', 'LP', 'GEA', 'GESTA', 'GR', 'TD', 'TP', 'AMPHI'];
    if (commonGroupCodes.some(code => upper.includes(code))) return false;
    
    // Pattern: Mots commençant par une majuscule
    return words.every(w => {
        // Accepte "D'HOINE" ou "DE" ou "LE"
        if (w.length <= 2) return true;
        return /^[A-Z\xC0-\xDF]/.test(w);
    });
}

async function generateTree() {
    console.log("🚀 Génération de l'arborescence DEEP ADE avec Filtre Enseignants...");
    
    const tree: any = {
        lastUpdated: new Date().toISOString().split('T')[0],
        sites: []
    };

    for (const master of MASTER_LINKS) {
        console.log(`📡 Scan du Master [${master.site}]...`);
        let success = false;
        let retries = 3;
        
        while (retries > 0 && !success) {
            try {
                const resp = await axios.get(master.url, { responseType: 'text', timeout: 30000 });
                const data = ical.parseICS(resp.data);
                success = true;
                
                // Dept -> Year -> Set<GroupName>
                const hierarchy = new Map<string, Map<string, Set<string>>>();
                
                Object.values(data).forEach((event: any) => {
                    if (event.type === 'VEVENT' && event.description) {
                        const lines = event.description.split('\n').map((l: string) => l.trim());
                        
                        lines.forEach((line: string) => {
                            if (line.length < 3 || line.length > 50) return;
                            const lower = line.toLowerCase();
                            const upper = line.toUpperCase();
                            
                            const noise = [
                                'exporté', 'transféré', 'modifié', 'salles', 'durée', 'étudiant', 
                                'convoqués', 'attester', 'parking', 'usine', 'visite', 'salle',
                                'amphi', 'bâtiment', 'entrée', 'accueil', 'secretaire', 'claire',
                                'richir', 'fabian', ' ware', 'ok', 'visio', 'examen', 'écrit', 
                                'septembre', 'janvier', 'février', 'juin', 'session', 'rattrapage',
                                'stage', 'copies', 'élection', 'vice-président', 'adh', 'adh1', 'adh2',
                                'adresse :', 'convocation'
                            ];
                            if (noise.some(word => lower.includes(word))) return;
                            if (/\d{2}\/\d{2}/.test(line)) return; 
                            if (/^[0-9]+[Hh][0-9]*$/.test(line)) return; 

                            let dept = "Formations Générales";
                            let year = "Divers / Autres";

                            if (isTeacherName(line)) {
                                dept = "Enseignants";
                                year = line.charAt(0).toUpperCase(); // Groupe par Initiale
                            } else {
                                // --- 1. Détection du Département (Dossier Principal) ---
                                if (master.site.includes('IUT')) {
                                    if (upper.includes('MMI')) dept = "MMI";
                                    else if (upper.includes('INFO') || upper.includes('INF')) dept = "INFO";
                                    else if (upper.includes('GEA')) dept = "GEA";
                                    else if (upper.includes('TC')) dept = "TC";
                                    else if (upper.includes('FCA')) dept = "FCA";
                                    else if (upper.includes('GIM')) dept = "GIM";
                                    else if (upper.includes('GMP')) dept = "GMP";
                                    else if (upper.includes('GCCD')) dept = "GCCD";
                                } else if (master.site.includes('ARRAS')) {
                                    if (upper.includes('HIST') || upper.includes('GEO') || upper.includes('PATRIM')) dept = "Hist. Géo. & Patrimoine";
                                    else if (upper.includes('ANG') || upper.includes('ESP') || upper.includes('ALL') || upper.includes('LANG')) dept = "Langues Étrangères";
                                    else if (upper.includes('LETTRE') || upper.includes('ART') || upper.includes('THEATRE')) dept = "Lettres & Arts";
                                    else if (upper.includes('ECO') || upper.includes('GESTA') || upper.includes('FEGASS')) dept = "Économie & Gestion (FEGASS)";
                                    else if (upper.includes('FCU')) dept = "FCU";
                                } else if (master.site.includes('SUAPS')) {
                                    dept = "Activités Sportives";
                                }

                                // --- 2. Détection de l'Année / Filière (Sous-Dossier) ---
                                if (line.includes('L1') || line.includes('Licence 1')) year = "Licence 1";
                                else if (line.includes('L2') || line.includes('Licence 2')) year = "Licence 2";
                                else if (line.includes('L3') || line.includes('Licence 3')) year = "Licence 3";
                                else if (line.includes('M1') || line.includes('Master 1')) year = "Master 1";
                                else if (line.includes('M2') || line.includes('Master 2')) year = "Master 2";
                                else if (line.includes('DAEU')) year = "DAEU";
                                else if (lower.includes('lp ') || lower.includes('licence pro')) year = "Licence Pro";
                                else if (line.includes('B1') || line.includes('BUT1') || /B1[A-Z]/.test(upper)) year = "BUT 1";
                                else if (line.includes('B2') || line.includes('BUT2') || /B2[A-Z]/.test(upper)) year = "BUT 2";
                                else if (line.includes('B3') || line.includes('BUT3') || /B3[A-Z]/.test(upper)) year = "BUT 3";
                                else if (line.startsWith('Planning')) year = "Plannings Généraux";
                            }

                            if (dept !== "Enseignants" && year === "Divers / Autres" && (!/[A-Z]/.test(line) || line.length < 6)) return;

                            if (!hierarchy.has(dept)) hierarchy.set(dept, new Map());
                            const deptMap = hierarchy.get(dept)!;
                            if (!deptMap.has(year)) deptMap.set(year, new Set());
                            deptMap.get(year)!.add(line);
                        });
                    }
                });

                console.log(`✅ ${hierarchy.size} départements détectés pour ${master.site}`);

                const site: any = {
                    id: `site-${master.site.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    name: master.site,
                    departments: Array.from(hierarchy.entries()).sort().map(([deptName, deptMap]) => ({
                        id: `dept-${deptName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${master.site.split(' ')[0].toLowerCase()}`,
                        name: deptName,
                        years: Array.from(deptMap.entries()).sort().map(([yearName, groupsSet]) => ({
                            id: `year-${yearName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${deptName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                            name: deptName === "Enseignants" ? `Initiale ${yearName}` : yearName,
                            groups: Array.from(groupsSet).sort().map(groupName => ({
                                id: `${master.site.split(' ')[0]}_${groupName.replace(/[^a-zA-Z0-9]/g, '_')}`,
                                name: groupName,
                                directUrl: master.url,
                                filter: groupName
                            }))
                        }))
                    }))
                };

                tree.sites.push(site);

            } catch (e: any) {
                retries--;
                if (retries === 0) {
                    console.error(`❌ Échec définitif pour [${master.site}]: ${e.message}`);
                } else {
                    console.warn(`⚠️ Erreur pour [${master.site}] (${e.message}). Nouvel essai...`);
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }
    }

    const treePath = path.join(__dirname, '../data/ade_tree.json');
    await fs.writeFile(treePath, JSON.stringify(tree, null, 2));
    console.log(`💾 Arborescence Hiérarchique avec Enseignants sauvegardée dans ${treePath}`);
}

generateTree();
