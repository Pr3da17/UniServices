import { useEffect, useState, useCallback, useRef } from "react";
import { 
  Library as LibraryIcon, 
  Users, 
  Clock, 
  ExternalLink, 
  Settings, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RotateCw
} from "lucide-react";
import Widget from "./Widget";
import { Skeleton } from "./Skeleton";
import { artoisLibraries, type Library } from "../data/libraries";

interface Forecast {
  time: string;
  occupancy: number;
  evolution: "INCREASE" | "DECREASE" | "STABLE";
}

interface LibraryData {
  name: string;
  occupancy: number;
  capacity: number;
  occupiedSeats: number;
  hours: string;
  status: string;
  reservationUrl: string;
  forecasts: Forecast[];
}

export default function LibraryWidget() {
  const [selectedBU, setSelectedBU] = useState<Library>(() => {
    const saved = localStorage.getItem("selected_bu_id");
    return artoisLibraries.find(l => l.id === saved) || artoisLibraries[0];
  });
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLibraryData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${baseUrl}/api/library?token=${selectedBU.token}`);
      const data = await res.json();
      
      if (data.success) {
        setLibrary(data.data);
        setLastUpdated(new Date());
      } else {
        setLibrary(null);
      }
    } catch (error) {
      console.error("Failed to fetch library data:", error);
      setLibrary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBU]);

  useEffect(() => {
    fetchLibraryData();

    // Auto-refresh every 5 minutes
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(() => {
      fetchLibraryData(true);
    }, 5 * 60 * 1000);

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchLibraryData]);

  const handleSelectBU = (bu: Library) => {
    setSelectedBU(bu);
    localStorage.setItem("selected_bu_id", bu.id);
    setShowSelector(false);
  };

  const getEvolutionIcon = (evolution: string) => {
    switch (evolution) {
      case "INCREASE": return <TrendingUp className="w-3 h-3 text-rose-400" />;
      case "DECREASE": return <TrendingDown className="w-3 h-3 text-emerald-400" />;
      default: return <Minus className="w-3 h-3 text-muted" />;
    }
  };

  if (showSelector) {
    return (
      <Widget 
        title="Choisir ma BU" 
        icon={Settings} 
        iconColor="text-muted"
        headerAction={
          <button onClick={() => setShowSelector(false)} className="text-xs text-muted hover:text-primary transition-colors">
            Retour
          </button>
        }
      >
        <div className="space-y-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
          {artoisLibraries.map((bu) => (
            <button
              key={bu.id}
              onClick={() => handleSelectBU(bu)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                selectedBU.id === bu.id 
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                  : 'bg-card-bg border-border-main hover:bg-card-hover text-muted hover:text-main'
              }`}
            >
              <div className="text-left">
                <p className="font-semibold text-sm">{bu.name}</p>
                <p className="text-[10px] opacity-50 uppercase tracking-wider">{bu.city}</p>
              </div>
              <ChevronRight className={`w-4 h-4 ${selectedBU.id === bu.id ? 'opacity-100' : 'opacity-20'}`} />
            </button>
          ))}
        </div>
      </Widget>
    );
  }

  return (
    <Widget 
      title={selectedBU.name.split(' (')[0]} 
      icon={LibraryIcon} 
      iconColor="text-emerald-400"
      headerAction={
        <div className="flex items-center space-x-2">
          {library && (
            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full transition-all duration-500 ${library.status === 'ouvert' ? 'bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5' : 'bg-rose-500/10 text-rose-400'}`}>
              {library.status}
            </span>
          )}
          <button 
            onClick={() => fetchLibraryData(true)}
            className={`p-1.5 rounded-lg hover:bg-accent-bg text-muted hover:text-primary transition-all ${refreshing ? 'animate-spin text-primary' : ''}`}
            title="Rafraîchir"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowSelector(true)}
            className="p-1.5 rounded-lg hover:bg-accent-bg text-muted hover:text-primary transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1 ml-6 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      ) : library ? (
        <div className="flex flex-col h-full space-y-5 animate-in fade-in duration-700">
          {/* Main Info */}
          <div className="flex items-center justify-between">
            <div className="relative w-24 h-24 group">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-border-main"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - (library.occupancy || 0) / 100)}
                  className={`transition-all duration-1000 ease-out ${library.status === 'fermé' ? 'text-muted grayscale' : 'text-emerald-500'}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform group-hover:scale-110 duration-300">
                <span className="text-2xl font-bold text-main tracking-tighter">{library.occupancy}%</span>
                <span className="text-[8px] text-muted uppercase font-bold tracking-widest">Live</span>
              </div>
            </div>
            
            <div className="flex-1 ml-6 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                  Horaires
                </span>
                <span className="font-semibold text-main">{library.hours}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                  Capacité
                </span>
                <span className="font-semibold text-main">{library.occupiedSeats || '?'}/{library.capacity || '?'}</span>
              </div>
              <div className="text-[9px] text-right text-muted opacity-40 italic">
                MÀJ {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Forecasts Section */}
          {library.forecasts && library.forecasts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted tracking-widest px-1">Prévisions</p>
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {library.forecasts.slice(0, 4).map((f, i) => (
                  <div 
                    key={i} 
                    className="flex-shrink-0 w-20 p-2.5 rounded-xl bg-card-bg border border-border-main flex flex-col items-center justify-center space-y-1 hover:border-emerald-500/30 transition-colors"
                  >
                    <span className="text-[10px] text-muted font-medium">{f.time}</span>
                    <span className="text-xs font-bold text-main">{f.occupancy}%</span>
                    {getEvolutionIcon(f.evolution)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <a 
            href={library.reservationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-[0_8px_30px_rgb(16,185,129,0.2)]"
          >
            <span>Réserver une salle</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full py-8 text-center animate-in zoom-in-95 duration-500">
          <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
            <LibraryIcon className="w-6 h-6 text-rose-500" />
          </div>
          <p className="text-danger text-sm font-semibold tracking-tight">Erreur de connexion</p>
          <p className="text-muted text-[11px] mt-1 px-4 leading-relaxed">Les données de la BU sont temporairement indisponibles.</p>
          <button 
            onClick={() => fetchLibraryData()}
            className="mt-6 px-4 py-2 bg-accent-bg hover:bg-border-main text-xs font-bold text-main rounded-xl transition-all"
          >
            Réessayer
          </button>
        </div>
      )}
    </Widget>
  );
}
