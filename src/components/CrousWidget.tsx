import { useEffect, useState, useCallback } from "react";
import { 
  Utensils, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Settings, 
  ChefHat,
  RotateCw,
  AlertCircle,
  Coffee
} from "lucide-react";
import Widget from "./Widget";
import { Skeleton } from "./Skeleton";

interface Region {
  code: string;
  libelle: string;
}

interface Restaurant {
  code: string;
  nom: string;
  type: {
    code: number;
    libelle: string;
  };
  adresse?: string;
}

interface MenuCategory {
  categorie: string;
  plats: string[];
}

interface MenuData {
  midi?: MenuCategory[];
  soir?: MenuCategory[];
}

export default function CrousWidget() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>(() => localStorage.getItem("crous_region") || "16");
  const [selectedResto, setSelectedResto] = useState<string>(() => localStorage.getItem("crous_resto") || "");
  const [restoDetails, setRestoDetails] = useState<any>(null);
  const [menu, setMenu] = useState<MenuData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
        const res = await fetch(`${baseUrl}/api/crous/regions`);
        const json = await res.json();
        if (json.success) setRegions(json.data);
      } catch (err) {
        console.error("Failed to fetch regions", err);
      }
    };
    fetchRegions();
  }, []);

  // 2. Fetch restaurants when region changes
  useEffect(() => {
    if (!selectedRegion) return;
    const fetchRestos = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
        const res = await fetch(`${baseUrl}/api/crous/regions/${selectedRegion}/restaurants`);
        const json = await res.json();
        if (json.success) {
          setRestaurants(json.data);
          // If no resto selected, or current resto not in this region, select first
          if (!selectedResto || !json.data.find((r: any) => r.code === selectedResto)) {
            // Try to find a default one or just first
          }
        }
      } catch (err) {
        console.error("Failed to fetch restaurants", err);
      }
    };
    fetchRestos();
  }, [selectedRegion]);

  // 3. Fetch details and menu when resto changes
  const fetchRestoData = useCallback(async () => {
    if (!selectedResto) {
      setLoading(false);
      return;
    }
    setLoadingMenu(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const [detailsRes, menuRes] = await Promise.all([
        fetch(`${baseUrl}/api/crous/restaurants/${selectedResto}`),
        fetch(`${baseUrl}/api/crous/restaurants/${selectedResto}/menu`)
      ]);
      
      const detailsJson = await detailsRes.json();
      const menuJson = await menuRes.json();

      if (detailsJson.success) setRestoDetails(detailsJson.data);
      if (menuJson.success) setMenu(menuJson.data);
      else setMenu(null);
    } catch (err) {
      setError("Erreur de connexion");
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMenu(false);
    }
  }, [selectedResto]);

  useEffect(() => {
    fetchRestoData();
  }, [fetchRestoData]);

  const handleSelectResto = (code: string) => {
    setSelectedResto(code);
    localStorage.setItem("crous_resto", code);
    setShowSettings(false);
  };

  const handleSelectRegion = (code: string) => {
    setSelectedRegion(code);
    localStorage.setItem("crous_region", code);
  };

  if (showSettings || !selectedResto) {
    return (
      <Widget 
        title="Configurer le CROUS" 
        icon={Settings} 
        iconColor="text-orange-400"
        headerAction={
          selectedResto && (
            <button onClick={() => setShowSettings(false)} className="text-xs text-muted hover:text-primary transition-colors">
              Retour
            </button>
          )
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted tracking-widest px-1">Région</label>
            <select 
              value={selectedRegion}
              onChange={(e) => handleSelectRegion(e.target.value)}
              className="w-full bg-card-bg border border-border-main rounded-xl p-3 text-sm text-main outline-none focus:border-orange-500/50"
            >
              {regions.map(r => (
                <option key={r.code} value={r.code}>{r.libelle}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted tracking-widest px-1">Restaurant / Cafétéria</label>
            <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {restaurants.map((r) => (
                <button
                  key={r.code}
                  onClick={() => handleSelectResto(r.code)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                    selectedResto === r.code 
                      ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' 
                      : 'bg-card-bg border-border-main hover:bg-card-hover text-muted hover:text-main'
                  }`}
                >
                  <div className="text-left overflow-hidden">
                    <p className="font-semibold text-sm truncate">{r.nom}</p>
                    <p className="text-[9px] opacity-50 uppercase">{r.type.libelle}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${selectedResto === r.code ? 'opacity-100' : 'opacity-20'}`} />
                </button>
              ))}
              {restaurants.length === 0 && <p className="text-xs text-center text-muted py-4">Aucun restaurant trouvé.</p>}
            </div>
          </div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget 
      title={restoDetails?.nom || "Mon CROUS"} 
      icon={Utensils} 
      iconColor="text-orange-400"
      headerAction={
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => fetchRestoData()}
            className={`p-1.5 rounded-lg hover:bg-accent-bg text-muted hover:text-primary transition-all ${loadingMenu ? 'animate-spin text-primary' : ''}`}
            title="Rafraîchir"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg hover:bg-accent-bg text-muted hover:text-primary transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2 opacity-50" />
          <p className="text-sm font-semibold text-main">{error}</p>
          <button onClick={() => fetchRestoData()} className="mt-4 text-xs font-bold text-primary hover:underline">Réessayer</button>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-700">
          {/* Status & Info */}
          <div className="flex flex-col space-y-2">
             <div className="flex items-center text-xs text-muted">
                <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                <span className="truncate">{restoDetails?.adresse || 'Adresse non disponible'}</span>
             </div>
             <div className="flex items-center text-xs text-muted">
                <Clock className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                <span>{restoDetails?.horaires || 'Horaires non disponibles'}</span>
             </div>
          </div>

          {/* Menu Today */}
          <div className="space-y-3">
            <h4 className="flex items-center text-[10px] uppercase font-bold text-muted tracking-widest">
              <ChefHat className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
              Menu du jour
            </h4>
            
            <div className="bg-card-bg/50 border border-border-main rounded-2xl p-4 overflow-hidden">
              {!menu ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted">
                  <Coffee className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">Pas de menu publié pour aujourd'hui.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {menu.midi && (
                    <div className="space-y-3">
                      <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-bold uppercase">Midi</span>
                      {menu.midi.map((cat, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">{cat.categorie}</p>
                          <ul className="space-y-1">
                            {cat.plats.map((plat, j) => (
                              <li key={j} className="text-sm text-main leading-snug pl-2 border-l-2 border-orange-500/20">{plat}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {menu.soir && (
                    <div className="space-y-3 pt-4 border-t border-border-main/50">
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">Soir</span>
                      {menu.soir.map((cat, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">{cat.categorie}</p>
                          <ul className="space-y-1">
                            {cat.plats.map((plat, j) => (
                              <li key={j} className="text-sm text-main leading-snug pl-2 border-l-2 border-indigo-500/20">{plat}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Widget>
  );
}
