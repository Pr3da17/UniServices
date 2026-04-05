import { useEffect, useState, useMemo } from "react";
import { Calendar, Info, Settings, RefreshCcw } from "lucide-react";
import { fetchTimetable } from "../services/timetableService";
import type { TimetableEvent } from "../services/timetableService";
import { format, isSameDay, isAfter, startOfToday } from "date-fns";
import { fr } from "date-fns/locale";

import TimelineVertical from "./TimelineVertical";
import TimetableConfigModal from "./TimetableConfigModal";

const DEFAULT_RESOURCE = "9130"; // LENS - L1 INFO TD3
const DEFAULT_GROUP_NAME = "L1 INFO TD3 (TP3-1/TP3-2)";

interface TimetableWidgetProps {
  sessionId?: string;
}

export default function TimetableWidget({ sessionId }: TimetableWidgetProps) {
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const [resourceId, setResourceId] = useState(localStorage.getItem("ade_resource_id") || DEFAULT_RESOURCE);
  const [groupName, setGroupName] = useState(localStorage.getItem("ade_group_name") || DEFAULT_GROUP_NAME);

  const loadTimetable = (force = false) => {
    setLoading(true);
    fetchTimetable(resourceId, sessionId, force)
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTimetable();
  }, [resourceId, sessionId]);

  const handleGroupSelect = (id: string, name: string, fullPath?: string) => {
    localStorage.setItem("ade_resource_id", id);
    localStorage.setItem("ade_group_name", fullPath || name);
    setResourceId(id);
    setGroupName(fullPath || name);
  };

  // Filtrer pour aujourd'hui ou le prochain jour de cours
  const displayData = useMemo(() => {
    if (events.length === 0) return { title: "Emploi du Temps", dayEvents: [] };

    const today = startOfToday();
    
    // Trouver les événements d'aujourd'hui
    const todayEvents = events.filter(e => isSameDay(new Date(e.start), today));
    
    if (todayEvents.length > 0) {
      return { title: "Aujourd'hui", dayEvents: todayEvents };
    }

    // Sinon, trouver le prochain jour avec des cours
    const futureEvents = events.filter(e => isAfter(new Date(e.start), today));
    if (futureEvents.length > 0) {
      const nextDay = new Date(futureEvents[0].start);
      const nextDayEvents = events.filter(e => isSameDay(new Date(e.start), nextDay));
      return { 
        title: `Prochain cours (${format(nextDay, 'EEEE d MMMM', { locale: fr })})`, 
        dayEvents: nextDayEvents 
      };
    }

    return { title: "Emploi du Temps", dayEvents: [] };
  }, [events]);

  return (
    <div className="group glass rounded-3xl p-6 hover:bg-card-hover transition-all duration-500 relative overflow-hidden flex flex-col h-full border border-border-main hover:border-primary/30">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-colors duration-500"></div>
      
      <div className="relative z-10 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-main">{displayData.title}</h3>
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold opacity-70">{groupName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => loadTimetable(true)}
                className="p-2 hover:bg-accent-bg rounded-xl transition-all text-muted hover:text-primary active:rotate-180"
                title="Actualiser"
            >
               <RefreshCcw className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setIsConfigOpen(true)}
                className="p-2 hover:bg-accent-bg rounded-xl transition-all text-muted hover:text-primary"
                title="Changer de groupe"
            >
               <Settings className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        {loading ? (
          <div className="space-y-6 px-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-1.5 h-12 bg-accent-bg rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-accent-bg rounded w-1/2"></div>
                  <div className="h-3 bg-accent-bg rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayData.dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-40">
            <Info className="w-8 h-8" />
            <p className="text-sm font-medium">Aucun cours disponible</p>
            <p className="text-[10px]">Vérifiez la configuration de votre groupe</p>
          </div>
        ) : (
          <TimelineVertical events={displayData.dayEvents} />
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-border-main relative z-10">
        <button 
            onClick={() => window.open('https://ent.univ-artois.fr/', '_blank')}
            className="w-full py-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-2xl text-xs font-bold transition-all border border-primary/20"
        >
          Accéder à l'ADE complet
        </button>
      </div>

      <TimetableConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        onSelect={handleGroupSelect}
      />
    </div>
  );
}
