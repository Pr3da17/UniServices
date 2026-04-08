import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  LayoutGrid, 
  CalendarDays,
  Loader2,
  PanelLeftOpen,
  PanelLeftClose,
  MapPinIcon,
  GraduationCap,
  BookOpen,
  Users,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { fetchTimetable } from '../services/timetableService';
import type { TimetableEvent } from '../services/timetableService';
import { 
  format, 
  startOfWeek, 
  addDays, 
  eachDayOfInterval, 
  isSameDay, 
  startOfToday,
  addWeeks
} from 'date-fns';
import { fr } from 'date-fns/locale';

import { getApiUrl } from '../utils/api';

interface Group   { id: string; name: string; }
interface Year    { id: string; name: string; groups: Group[]; }
interface Dept    { id: string; name: string; years: Year[]; }
interface Site    { id: string; name: string; departments: Dept[]; }
interface ADETree { lastUpdated: string; sites: Site[]; }

interface TimetableViewProps {
  sessionId?: string;
}

export default function TimetableView({ sessionId }: TimetableViewProps) {
  const [view, setView] = useState<'day' | 'week'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceId, setResourceId] = useState(() => localStorage.getItem("ade_resource_id") || "4633");
  const [groupName, setGroupName] = useState(() => localStorage.getItem("ade_group_name") || "Groupe non configuré");
  const [now, setNow] = useState(new Date());

  // Mise à jour du temps chaque minute pour le countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Prochain cours
  const nextEvent = useMemo(() => {
    if (!events.length) return null;
    const sortedFuture = events
      .map(e => ({ ...e, startDate: new Date(e.start) }))
      .filter(e => e.startDate > now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return sortedFuture.length > 0 ? sortedFuture[0] : null;
  }, [events, now]);

  const countdownText = useMemo(() => {
    if (!nextEvent) return null;
    const diff = nextEvent.startDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    
    if (hours > 24) return `Prochain cours ${format(nextEvent.startDate, 'EEEE', { locale: fr })}`;
    if (hours > 0) return `Prochain cours dans ${hours}h ${minutes}m`;
    return `Prochain cours dans ${minutes}m`;
  }, [nextEvent, now]);

  // Arborescence
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tree, setTree] = useState<ADETree | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedDept, setSelectedDept] = useState<Dept | null>(null);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [search, setSearch] = useState('');

  // Charger l'emploi du temps
  useEffect(() => {
    setLoading(true);
    fetchTimetable(resourceId, sessionId)
      .then(data => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [resourceId, sessionId]);

  // Charger l'arborescence quand on ouvre le panneau
  useEffect(() => {
    if (!sidebarOpen || tree) return;
    setTreeLoading(true);
    axios.get(getApiUrl("/api/timetable/tree"))
      .then(r => setTree(r.data))
      .catch(console.error)
      .finally(() => setTreeLoading(false));
  }, [sidebarOpen]);

  // Raccourci clavier (Ctrl+K ou /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSidebarOpen(true);
      }
      if (e.key === '/' && !sidebarOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSidebarOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const selectGroup = (group: Group, year: Year, dept: Dept, site: Site) => {
    const fullPath = `${site.name} › ${dept.name} › ${year.name} › ${group.name}`;
    localStorage.setItem("ade_resource_id", group.id);
    localStorage.setItem("ade_group_name", fullPath);
    setResourceId(group.id);
    setGroupName(fullPath);
    setSidebarOpen(false);
    setSearch('');
  };

  // Résultats de recherche dans l'arbre
  const searchResults = useMemo(() => {
    if (!tree || search.trim().length < 2) return null;
    const q = search.toLowerCase();
    const results: Array<{ group: Group; year: Year; dept: Dept; site: Site }> = [];
    for (const site of tree.sites) {
      for (const dept of site.departments) {
        for (const year of dept.years) {
          for (const group of year.groups) {
            if (`${site.name} ${dept.name} ${year.name} ${group.name}`.toLowerCase().includes(q)) {
              results.push({ group, year, dept, site });
            }
          }
        }
      }
    }
    return results;
  }, [search, tree]);

  const daysToShow = useMemo(() => {
    if (view === 'day') return [currentDate];
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 5) });
  }, [view, currentDate]);

  const navigate = (direction: number) => {
    if (view === 'day') setCurrentDate(prev => addDays(prev, direction));
    else setCurrentDate(prev => addWeeks(prev, direction));
  };

  return (
    <div className="flex gap-6 animate-in fade-in duration-700" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* ── Panneau arborescence (sidebar) ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="flex-shrink-0 glass border border-border-main rounded-3xl overflow-hidden flex flex-col"
            style={{ maxHeight: 'calc(100vh - 120px)', position: 'sticky', top: 24 }}
          >
            {/* Header panneau */}
            <div className="p-5 border-b border-border-main flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
              <div>
                <h3 className="font-bold text-main text-sm">Choisir mon groupe</h3>
                <p className="text-[10px] text-muted mt-0.5">ADE — Université d'Artois</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-accent-bg rounded-lg text-muted hover:text-main transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barre de recherche dans le panneau */}
            <div className="px-4 py-3 border-b border-border-main bg-accent-bg/10">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Rechercher (ex: L1, M1, Arras...)"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSelectedSite(null); setSelectedDept(null); setSelectedYear(null); }}
                  className="w-full text-xs bg-accent-bg/60 border border-border-main rounded-xl py-2.5 pl-9 pr-8 text-main placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  autoFocus
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent-bg rounded-md text-muted hover:text-main transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {treeLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-xs text-muted">Chargement ADE...</p>
                </div>
              ) : searchResults !== null ? (
                /* Mode recherche */
                <div className="flex-1 overflow-y-auto p-3">
                  {searchResults.length === 0 ? (
                    <p className="text-xs text-muted italic text-center py-8">Aucun résultat</p>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted px-1 mb-2">{searchResults.length} résultat(s)</p>
                      {searchResults.map(({ group, year, dept, site }) => (
                        <button
                          key={group.id}
                          onClick={() => selectGroup(group, year, dept, site)}
                          className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/20 text-left transition-all group"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary mt-1.5 transition-colors" />
                          <div>
                            <p className="text-xs font-semibold text-main group-hover:text-primary transition-colors">{group.name}</p>
                            <p className="text-[10px] text-muted mt-0.5">{site.name} › {dept.name} › {year.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Mode arborescence en colonnes verticales */
                <div className="flex flex-1 overflow-hidden">
                  {/* Colonne Sites */}
                  <TreeColumn
                    title="Site"
                    icon={<MapPinIcon className="w-3 h-3" />}
                    items={tree?.sites || []}
                    selectedId={selectedSite?.id}
                    onSelect={(site) => { setSelectedSite(site as Site); setSelectedDept(null); setSelectedYear(null); }}
                    emptyMsg="(aucun site)"
                  />
                  {/* Colonne Départements */}
                  <TreeColumn
                    title="Département"
                    icon={<GraduationCap className="w-3 h-3" />}
                    items={selectedSite?.departments || []}
                    selectedId={selectedDept?.id}
                    onSelect={(dept) => { setSelectedDept(dept as Dept); setSelectedYear(null); }}
                    emptyMsg={!selectedSite ? "← site" : "(aucun)"}
                  />
                  {/* Colonne Années + Groupes */}
                  <div className="flex-1 border-l border-border-main overflow-y-auto">
                    {selectedDept?.years.map(year => (
                      <div key={year.id}>
                        <button
                          onClick={() => setSelectedYear(selectedYear?.id === year.id ? null : year)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold border-b border-border-main transition-colors ${
                            selectedYear?.id === year.id ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-accent-bg hover:text-main'
                          }`}
                        >
                          <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" />{year.name}</span>
                          <ChevronRight className={`w-3 h-3 transition-transform ${selectedYear?.id === year.id ? 'rotate-90' : ''}`} />
                        </button>
                        {selectedYear?.id === year.id && (
                          <div className="bg-accent-bg/20">
                            {year.groups.map(group => (
                              <button
                                key={group.id}
                                onClick={() => selectGroup(group, year, selectedDept, selectedSite!)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-primary/10 hover:text-primary text-main transition-colors border-b border-border-main/30 last:border-0 text-left group"
                              >
                                <Users className="w-3 h-3 text-muted group-hover:text-primary" />
                                <span className="truncate">{group.name}</span>
                                <CheckCircle2 className="w-3 h-3 ml-auto text-muted/0 group-hover:text-primary/50 transition-colors" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {!selectedDept && (
                      <p className="text-[10px] text-muted/40 italic text-center py-8">← département</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Groupe actuel */}
            <div className="p-3 border-t border-border-main bg-accent-bg/20">
              <p className="text-[10px] text-muted mb-0.5">Groupe actuel</p>
              <p className="text-xs font-semibold text-primary truncate">{groupName}</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Contenu principal ── */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-main">Emploi du Temps</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-muted truncate max-w-[200px] md:max-w-md">{groupName}</p>
              {countdownText && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-lg animate-pulse-subtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{countdownText}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-accent-bg rounded-xl p-1 border border-border-main">
              <button 
                onClick={() => setView('day')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'day' ? 'bg-card-bg shadow text-primary' : 'text-muted'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Jour
              </button>
              <button 
                onClick={() => setView('week')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'week' ? 'bg-card-bg shadow text-primary' : 'text-muted'}`}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Semaine
              </button>
            </div>
            
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Changer de groupe"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${sidebarOpen ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-accent-bg border-border-main text-muted hover:text-primary hover:border-primary/30'}`}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              {sidebarOpen ? 'Fermer' : 'Groupes'}
            </button>
          </div>
        </div>

        {/* Navigation semaine/jour */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 md:p-2 hover:bg-accent-bg rounded-full transition-colors text-muted hover:text-primary active:scale-90">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm md:text-lg font-bold min-w-[140px] md:min-w-[220px] text-center text-main">
              {view === 'day' 
                ? format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })
                : `Semaine du ${format(daysToShow[0], 'd MMMM', { locale: fr })}`
              }
            </span>
            <button onClick={() => navigate(1)} className="p-1.5 md:p-2 hover:bg-accent-bg rounded-full transition-colors text-muted hover:text-primary active:scale-90">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setCurrentDate(startOfToday())}
            className="px-3 md:px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] md:text-xs font-bold hover:bg-primary/20 transition-all border border-primary/20 whitespace-nowrap"
          >
            Aujourd'hui
          </button>
        </div>

        {/* Grille jours / Mobile Pager / Horizontal Scroll */}
        <div className="relative">
          <motion.div 
             className="flex overflow-x-auto snap-x snap-mandatory pb-8 pt-2 scroll-smooth custom-scrollbar-horizontal gap-4 md:gap-6"
             layout
             style={{ 
               scrollbarWidth: 'thin',
               scrollbarColor: 'var(--accent-border) transparent'
             }}
          >
            {daysToShow.map((day, idx) => {
              const dayEvents = events.filter(e => isSameDay(new Date(e.start), day));
              const isToday = isSameDay(day, startOfToday());
              
              return (
                <div 
                  key={idx} 
                  className="flex-shrink-0 w-[85vw] md:w-[320px] lg:w-[350px] snap-center space-y-5"
                >
                  {/* CampusConnect Styled Day Header */}
                  <div className={`relative p-4 rounded-3xl overflow-hidden transition-all duration-500 border group ${
                    isToday 
                      ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/5' 
                      : 'bg-card-bg/40 border-border-main hover:border-primary/20 hover:bg-card-bg/60'
                  }`}>
                    {isToday && (
                      <div className="absolute top-0 right-0 p-2">
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isToday ? 'text-primary' : 'text-muted'}`}>
                          {format(day, 'EEEE', { locale: fr })}
                        </span>
                        <span className={`text-2xl font-black ${isToday ? 'text-main' : 'text-main/90'}`}>
                          {format(day, 'd MMMM', { locale: fr })}
                        </span>
                      </div>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                        isToday ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-accent-bg border-border-main text-muted'
                      }`}>
                        <CalendarDays className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Events List */}
                  <div className="space-y-4">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 glass rounded-3xl border-border-main/50">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Récupération...</p>
                      </div>
                    ) : dayEvents.length === 0 ? (
                      <div className="text-center py-16 glass rounded-[2.5rem] border-dashed border-border-main/40 flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-accent-bg flex items-center justify-center text-muted/30">
                           <CalendarDays className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-main">Journée vide</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Aucun cours à l'horizon</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5 px-1">
                        {dayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).map((event, idx, array) => {
                          const start = new Date(event.start);
                          const end = new Date(event.end);
                          const isNow = now >= start && now <= end;
                          const isPast = now > end;
                          
                          const nextEvt = array[idx + 1];
                          let pauseElement = null;
                          
                          if (nextEvt) {
                            const nextStart = new Date(nextEvt.start);
                            const diffMs = nextStart.getTime() - end.getTime();
                            const diffMins = Math.floor(diffMs / (1000 * 60));
                            
                            if (diffMins >= 10) {
                              const hours = Math.floor(diffMins / 60);
                              const mins = diffMins % 60;
                              const pauseLabel = hours > 0 ? `${hours}H ${mins > 0 ? mins + ' MIN' : ''}` : `${mins} MIN`;
                              
                              pauseElement = (
                                <div key={`pause-${event.id}`} className="relative py-1 flex items-center justify-center">
                                  <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-border-main/50 to-transparent"></div>
                                  <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 bg-app-bg/80 backdrop-blur-md rounded-full border border-border-main text-[9px] font-black uppercase tracking-tighter text-muted group-hover:text-primary transition-colors">
                                     <span className="w-1 h-1 rounded-full bg-primary/40 mr-1" />
                                     Pause • {pauseLabel}
                                  </div>
                                </div>
                              );
                            }
                          }

                          return (
                            <motion.div 
                              key={event.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <EventCard event={event} isNow={isNow} isPast={isPast} now={now} />
                              {pauseElement}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
          
          {/* Subtle Fade effect on edges */}
          <div className="absolute left-0 top-0 bottom-8 w-12 bg-gradient-to-r from-app-bg to-transparent pointer-events-none z-10 opacity-40 md:hidden" />
          <div className="absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-app-bg to-transparent pointer-events-none z-10 opacity-40 md:hidden" />
        </div>
      </div>
    </div>
  );
}

// Extraction du rendu de la carte d'événement avec gestion état
function EventCard({ event, isNow, isPast, now }: { event: TimetableEvent; isNow: boolean; isPast: boolean; now: Date }) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  
  return (
    <div 
      className={`group relative p-3 md:p-4 rounded-3xl transition-all duration-500 border ring-1 ring-border-main/10 overflow-hidden ${
        isNow 
          ? 'bg-primary/10 border-primary/40 ring-primary/20 shadow-lg shadow-primary/10' 
          : isPast 
            ? 'opacity-40 grayscale-[0.8] hover:opacity-70 bg-accent-bg/30 border-transparent ring-0' 
            : 'glass border-border-main hover:border-primary/30 hover:bg-primary/5 shadow-sm'
      }`}
      style={{ borderLeftWidth: '5px', borderLeftColor: event.color || 'var(--color-primary)' }}
    >
      {/* Background Glow for current class */}
      {isNow && (
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse" />
      )}

      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <span className={`text-[10px] md:text-[11px] font-black font-mono tracking-tight ${isNow ? 'text-primary' : 'text-muted'}`}>
                {format(start, 'HH:mm')} — {format(end, 'HH:mm')}
             </span>
             {isNow && (
               <motion.span 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="px-1.5 py-0.5 rounded-md bg-primary text-white text-[8px] font-black uppercase tracking-widest"
               >
                 En cours
               </motion.span>
             )}
          </div>
          <h4 className={`text-xs md:text-sm font-black line-clamp-2 leading-tight transition-colors ${isNow ? 'text-primary' : 'text-main'}`}>
            {event.title}
          </h4>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        {event.location && (
          <div className="flex items-center gap-1 opacity-80">
            <MapPin className="w-3 h-3 text-muted" />
            <span className="text-[10px] text-muted font-bold truncate tracking-tight">{event.location}</span>
          </div>
        )}
      </div>
      
      {/* Progress bar pour cours en cours */}
      {isNow && (
        <div className="mt-3 h-1 bg-primary/20 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100))}%` }}
            className="h-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            transition={{ duration: 1 }}
          />
        </div>
      )}
    </div>
  );
}

// Composant colonne générique pour l'arborescence
function TreeColumn<T extends { id: string; name: string }>({
  title, icon, items, selectedId, onSelect, emptyMsg
}: {
  title: string;
  icon: React.ReactNode;
  items: T[];
  selectedId?: string;
  onSelect: (item: T) => void;
  emptyMsg?: string;
}) {
  return (
    <div className="w-32 border-r border-border-main flex flex-col overflow-hidden flex-shrink-0">
      <div className="px-2 py-1.5 border-b border-border-main flex items-center gap-1 bg-accent-bg/30">
        <span className="text-muted">{icon}</span>
        <span className="text-[9px] uppercase tracking-wider font-bold text-muted/70 truncate">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-[10px] text-muted/40 italic text-center py-6 px-2">{emptyMsg}</p>
        ) : (
          items.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`w-full text-left px-2 py-2 text-[10px] transition-colors border-b border-border-main/30 last:border-0 leading-tight ${
                selectedId === item.id
                  ? 'bg-primary text-white font-bold'
                  : 'hover:bg-accent-bg text-main hover:text-primary'
              }`}
            >
              {item.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
