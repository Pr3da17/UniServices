import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Permet d'utiliser __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const url = "https://moodle.univ-artois.fr/course/index.php";
  try {
    console.log("🌐 Téléchargement de " + url + "...");
    const { data } = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(data);
    
    // Moodle sépare souvent les hiérarchies par " / " dans les <option> de son menu déroulant
    const options = $('select[name="jump"] option');
    
    const establishments: any[] = [];

    options.each((i, el) => {
      const fullText = $(el).text();
      // Ex: "Arras - U.F.R. EGASS / Master Sciences Sociales / M1" -> ["Arras - U.F.R. EGASS", "Master Sciences Sociales", "M1"]
      const parts = fullText.split(" / ").map(s => s.trim()).filter(s => s.length > 0 && s !== "Catégories de cours" && !s.includes("Aller à"));
      
      if (parts.length === 0) return;

      const value = $(el).attr("value") || "";
      const idMatch = value.match(/categoryid=(\d+)/);
      const rawId = idMatch ? idMatch[1] : `rand-${Math.floor(Math.random()*10000)}`;

      // --- Niveau 1: Établissement (Ex: Arras - U.F.R. EGASS) ---
      const estabName = parts[0];
      let estab = establishments.find(e => e.name === estabName);
      if (!estab) {
        estab = { id: `est-${rawId}`, name: estabName, formations: [] };
        establishments.push(estab);
      }

      // --- Niveau 2: Formation (Ex: Master Sciences Sociales) ---
      if (parts.length >= 2) {
        const formName = parts[1];
        let form = estab.formations.find((f: any) => f.name === formName);
        if (!form) {
          form = { id: `form-${rawId}`, name: formName, years: [] };
          estab.formations.push(form);
        }

        // --- Niveau 3+: Année (Ex: M1, qu'on fusionne si la profondeur est > 3) ---
        if (parts.length >= 3) {
          const yearName = parts.slice(2).join(" - "); // Ex: "Master 1 - Groupe A"
          let year = form.years.find((y: any) => y.name === yearName);
          if (!year) {
            year = { id: `year-${rawId}`, name: yearName };
            form.years.push(year);
          }
        }
      }
    });

    // Nettoyage de l'arbre pour respecter purement le TypeScript strict (pas de tableaux vides autorisés si undefined/optionnels)
    establishments.forEach(e => {
      if (e.formations.length === 0) {
        delete e.formations;
      } else {
        e.formations.forEach((f: any) => {
          if (f.years.length === 0) {
            delete f.years;
          }
        });
      }
    });

    console.log(`📋 Total établissements trouvés : ${establishments.length}`);
    let c = 0; establishments.forEach(e => c += e.formations?.length || 0);
    console.log(`📋 Total formations trouvées  : ${c}`);

    const fileContent = `export interface Year {
  id: string;
  name: string;
}

export interface Formation {
  id: string;
  name: string;
  years?: Year[];
}

export interface Establishment {
  id: string;
  name: string;
  formations?: Formation[];
}

export interface University {
  id: string;
  name: string;
  baseUrl: string;
  establishments: Establishment[];
}

export const universities: University[] = [
  {
    id: "univ-artois",
    name: "Université d'Artois",
    baseUrl: "https://moodle.univ-artois.fr",
    establishments: ${JSON.stringify(establishments, null, 6).replace(/\]$/, '    ]')}
  }
];
`;

    const destPath = path.resolve(__dirname, "../../src/data/schools.ts");
    fs.writeFileSync(destPath, fileContent, "utf-8");
    console.log("✅ schools.ts a été regénéré avec l'arbre complet Moodle !");
  } catch (err: any) {
    console.error("❌ Erreur de scraping :", err.message);
  }
}

run();
