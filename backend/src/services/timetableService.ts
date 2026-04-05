import axios from 'axios';

const ADE_RPC_URL = "https://ade-consult.univ-artois.fr/direct/gwtdirectplanning/DirectPlanningServiceProxy";
const ADE_BASE_URL = "https://ade-consult.univ-artois.fr/direct/gwtdirectplanning/";

// Permutation exact capturé sur l'ADE de l'Artois
const GWT_PERMUTATION = "96E99B169493A5C7B22942CA13C81855";

/**
 * Service pour communiquer avec les serveurs ADE de l'Université d'Artois via GWT-RPC.
 */
export class TimetableService {
  /**
   * Récupère les enfants d'un noeud dans l'arborescence ADE.
   * @param parentId ID du noeud parent (ex: 7 pour la racine des emplois du temps)
   */
  static async getChildren(parentId: string): Promise<any[]> {
    console.log(`📡 [ADE RPC] Fetching children for ${parentId} with permutation ${GWT_PERMUTATION}`);
    
    // Si parentId est vide ou "0", on commence à la racine "Emplois du temps" (souvent catégorie 7)
    const targetId = (parentId === '0' || !parentId) ? '7' : parentId;

    // Payload GWT-RPC ultra-précis (formaté pour Artois 2024-2025)
    // Ce payload inclut la structure TreeResourceConfig nécessaire pour que le serveur réponde
    const payload = `7|0|20|${ADE_BASE_URL}|067818807965393FC5DCF6AECC2CA8EC|com.adesoft.gwt.directplan.client.rpc.DirectPlanningServiceProxy|method4getChildren|J|java.lang.String/2004016611|com.adesoft.gwt.directplan.client.ui.tree.TreeResourceConfig/2234901663|{"-7""true""0""-1""0""0""0""false"[1]{"StringField""NAME""LabelName""Emplois du temps""false""false""""category${targetId}""${targetId}""0"[0][0]|[I/2970817851|java.util.LinkedHashMap/3008245022|COLOR|com.adesoft.gwt.core.client.rpc.config.OutputField/870745015|LabelColor||com.adesoft.gwt.core.client.rpc.config.FieldType/1797283245|NAME|LabelName|java.util.ArrayList/4159755760|com.extjs.gxt.ui.client.data.SortInfo/1143517771|com.extjs.gxt.ui.client.Style$SortDir/3873584144|1|2|3|4|3|5|6|7|Z1C0Ytm|8|${targetId}|0|9|2|-1|-1|10|0|2|6|11|12|0|13|11|14|15|11|0|0|6|16|12|0|17|16|14|15|4|0|0|18|0|18|0|19|20|1|16|18|0|`;

    try {
      const response = await axios.post(ADE_RPC_URL, payload, {
        headers: {
          'Content-Type': 'text/x-gwt-rpc; charset=UTF-8',
          'X-GWT-Module-Base': ADE_BASE_URL,
          'X-GWT-Permutation': GWT_PERMUTATION,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      return this.parseGWTResponse(response.data);
    } catch (error: any) {
      console.error("❌ ADE RPC Error:", error.message);
      throw new Error(`Erreur ADE Gateway: ${error.message}`);
    }
  }

  /**
   * Parseur amélioré pour extraire les paires ID/Nom de la réponse GWT-RPC binaire
   */
  private static parseGWTResponse(data: string): any[] {
    if (!data.startsWith("//OK")) {
        console.warn("⚠️ ADE RPC Response Not OK:", data.substring(0, 500));
        return [];
    }
    
    // On extrait le tableau de chaînes à la fin de la réponse GWT
    const rawMatch = data.match(/\[(.*)\]/);
    if (!rawMatch) return [];

    // Nettoyage et découpage
    const strings = rawMatch[1].split(',').map(s => s.replace(/"/g, ''));
    const results: any[] = [];

    // ADE stocke les noms et les IDs dans le tableau. 
    // On cherche les motifs : [..., "NOM", ..., "ID", ...]
    // Les IDs sont souvent des entiers > 100
    for (let i = 0; i < strings.length; i++) {
        const item = strings[i];
        
        // Si on détecte un ID numérique
        if (/^\d{3,6}$/.test(item)) {
            // Le nom associé est généralement à proximité (juste avant ou après dans la structure GWT)
            // On cherche le premier champ texte raisonnable autour de l'ID
            for (let offset of [-1, 1, -2, 2, -3, 3]) {
                const candidate = strings[i + offset];
                if (candidate && 
                    candidate.length > 2 && 
                    !/^\d+$/.test(candidate) && 
                    candidate.length < 100 &&
                    !['NAME', 'category', 'true', 'false', 'DirectPlanning'].includes(candidate)) {
                    
                    results.push({
                        id: item,
                        name: this.cleanGWTString(candidate)
                    });
                    break;
                }
            }
        }
    }

    // Déduplication par ID
    const unique = Array.from(new Map(results.map(r => [r.id, r])).values());
    
    // Tri alphabétique pour l'interface
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  }

  private static cleanGWTString(str: string): string {
    return str
      .replace(/\\u00E9/g, 'é')
      .replace(/\\u00E0/g, 'à')
      .replace(/\\u00E8/g, 'è')
      .replace(/\\u00EA/g, 'ê')
      .replace(/\\u00EE/g, 'î')
      .replace(/\\u00EB/g, 'ë')
      .replace(/\\u00F4/g, 'ô')
      .replace(/\\u00E2/g, 'â')
      .replace(/\\u00FB/g, 'û')
      .replace(/\\u00F9/g, 'ù')
      .replace(/\\/g, '');
  }
}
