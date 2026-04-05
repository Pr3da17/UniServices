import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MapPin, GraduationCap, BookOpen, Users, ChevronRight, Loader2, CheckCircle2, LayoutGrid } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

interface Group   { id: string; name: string; }
interface Year    { id: string; name: string; groups: Group[]; }
interface Dept    { id: string; name: string; years: Year[]; }
interface Site    { id: string; name: string; departments: Dept[]; }
interface ADETree { lastUpdated: string; sites: Site[]; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string, name: string, fullPath: string) => void;
}

export default function TimetableConfigModal({ isOpen, onClose, onSelect }: Props) {
  const [tree, setTree]                 = useState<ADETree | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedDept, setSelectedDept] = useState<Dept | null>(null);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);

  // Charger l'arborescence au montage
  useEffect(() => {
    if (!isOpen) return;
    if (tree) return; // déjà chargé
    
    setLoading(true);
    setError(null);
    axios.get(`${BACKEND_URL}/api/timetable/tree`)
      .then(r => setTree(r.data))
      .catch(() => setError("Impossible de charger l'arborescence ADE."))
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Reset sélections quand on ferme
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedSite(null);
      setSelectedDept(null);
      setSelectedYear(null);
    }
  }, [isOpen]);

  // Résultats de recherche globale (filtre dans tous les groupes)
  const searchResults = useMemo(() => {
    if (!tree || search.trim().length < 2) return null;
    const q = search.toLowerCase();
    const results: Array<{ group: Group; year: Year; dept: Dept; site: Site }> = [];
    for (const site of tree.sites) {
      for (const dept of site.departments) {
        for (const year of dept.years) {
          for (const group of year.groups) {
            const text = `${site.name} ${dept.name} ${year.name} ${group.name}`.toLowerCase();
            if (text.includes(q)) results.push({ group, year, dept, site });
          }
        }
      }
    }
    return results;
  }, [search, tree]);

  const handleSelect = (group: Group, year: Year, dept: Dept, site: Site) => {
    const fullPath = `${site.name} › ${dept.name} › ${year.name} › ${group.name}`;
    onSelect(group.id, group.name, fullPath);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-4xl bg-card-bg border border-border-main rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border-main bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 rounded-xl">
              <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-main">Sélectionner mon groupe</h2>
              <p className="text-xs text-muted">Université d'Artois — ADE Planning</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent-bg rounded-xl transition-colors text-muted hover:text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-8 py-4 border-b border-border-main">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Rechercher un groupe, département, site... (ex: BUT1 Info, Arras, GEA)"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedSite(null); setSelectedDept(null); setSelectedYear(null); }}
              className="w-full bg-accent-bg/50 border border-border-main rounded-2xl py-3 pl-11 pr-4 text-sm text-main placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted animate-pulse">Chargement de l'arborescence ADE...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-8">
              <p className="text-sm text-red-400 font-medium">{error}</p>
              <button onClick={() => { setError(null); setLoading(true); axios.get(`${BACKEND_URL}/api/timetable/tree`).then(r => setTree(r.data)).catch(() => setError("Erreur de chargement")).finally(() => setLoading(false)); }} className="text-xs text-primary underline">Réessayer</button>
            </div>
          ) : searchResults !== null ? (
            /* Mode recherche */
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(88vh - 200px)' }}>
              {searchResults.length === 0 ? (
                <p className="text-center text-muted text-sm py-12 italic">Aucun résultat pour « {search} »</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted mb-4 px-1">{searchResults.length} groupe(s) trouvé(s)</p>
                  {searchResults.map(({ group, year, dept, site }) => (
                    <motion.button
                      key={group.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => handleSelect(group, year, dept, site)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                    >
                      <div>
                        <p className="font-semibold text-sm text-main group-hover:text-primary transition-colors">{group.name}</p>
                        <p className="text-xs text-muted mt-0.5">{site.name} › {dept.name} › {year.name}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Mode arborescence en colonnes */
            <div className="flex h-full overflow-hidden" style={{ minHeight: 0 }}>
              {/* Colonne 1 — Sites */}
              <Column
                title="Établissement"
                icon={<MapPin className="w-3.5 h-3.5" />}
                items={tree?.sites || []}
                selectedId={selectedSite?.id}
                onSelect={(item: Site) => { setSelectedSite(item); setSelectedDept(null); setSelectedYear(null); }}
              />

              {/* Colonne 2 — Départements */}
              <Column
                title="Département"
                icon={<GraduationCap className="w-3.5 h-3.5" />}
                items={selectedSite?.departments || []}
                selectedId={selectedDept?.id}
                onSelect={(item: Dept) => { setSelectedDept(item); setSelectedYear(null); }}
                empty={!selectedSite ? "← Choisissez un site" : "Aucun département"}
              />

              {/* Colonne 3 — Années */}
              <Column
                title="Année"
                icon={<BookOpen className="w-3.5 h-3.5" />}
                items={selectedDept?.years || []}
                selectedId={selectedYear?.id}
                onSelect={(item: Year) => setSelectedYear(item)}
                empty={!selectedDept ? "← Choisissez un département" : "Aucune année"}
              />

              {/* Colonne 4 — Groupes (sélection finale) */}
              <div className="flex-1 border-l border-border-main flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-border-main flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted">Groupe</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {!selectedYear ? (
                    <p className="text-xs text-muted/50 italic text-center mt-8 px-4">← Choisissez une année</p>
                  ) : selectedYear.groups.length === 0 ? (
                    <p className="text-xs text-muted/50 italic text-center mt-8">Aucun groupe</p>
                  ) : (
                    <AnimatePresence>
                      <div className="space-y-1.5">
                        {selectedYear.groups.map((group, i) => (
                          <motion.button
                            key={group.id}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => handleSelect(group, selectedYear, selectedDept!, selectedSite!)}
                            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-transparent hover:border-primary/30 hover:bg-primary/10 transition-all text-left group"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-main group-hover:text-primary transition-colors truncate">{group.name}</p>
                              <p className="text-[10px] text-muted font-mono mt-0.5">ID: {group.id}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </motion.button>
                        ))}
                      </div>
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border-main bg-accent-bg/20 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-primary/50 flex-shrink-0" />
          <p className="text-[11px] text-muted">
            Votre choix est mémorisé localement. L'emploi du temps est synchronisé en direct depuis l'ADE.
            {tree && <span className="ml-2 opacity-50">Màj: {tree.lastUpdated}</span>}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Composant colonne générique
function Column<T extends { id: string; name: string }>({
  title, icon, items, selectedId, onSelect, empty
}: {
  title: string;
  icon: React.ReactNode;
  items: T[];
  selectedId?: string;
  onSelect: (item: T) => void;
  empty?: string;
}) {
  return (
    <div className="w-56 border-r border-border-main flex flex-col overflow-hidden flex-shrink-0">
      <div className="px-4 py-3 border-b border-border-main flex items-center gap-2">
        <span className="text-muted">{icon}</span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-muted">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="text-xs text-muted/50 italic text-center mt-8 px-2">{empty || 'Aucun élément'}</p>
        ) : (
          <div className="space-y-1">
            {items.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onSelect(item)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                  selectedId === item.id
                    ? 'bg-primary text-white font-semibold'
                    : 'hover:bg-accent-bg text-main'
                }`}
              >
                <span className="truncate">{item.name}</span>
                <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${selectedId === item.id ? 'text-white/70' : 'text-muted'}`} />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
