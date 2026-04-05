import { useState, useMemo } from 'react';
import { 
  Search, BookOpen, ExternalLink, Loader2, Star, Eye, EyeOff
} from 'lucide-react';
import type { Course } from '../services/moodleService';
import { getMoodleProxyUrl } from '../utils/proxy';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { getActivityStyle } from '../utils/courseUtils';
import { SortableCourseItem } from './SortableCourseItem';

interface CourseExplorerProps {
  courses: Course[];
  favoriteIds: string[];
  hiddenIds: string[];
  courseContents: Record<string, any>;
  fetchCourseContent: (courseId: string, force?: boolean) => Promise<void>;
  onToggleFavorite?: (id: string) => void;
  onReorderFavorites?: (newOrder: string[]) => void;
  onToggleVisibility?: (id: string) => void;
  sessionId: string | null;
}

export default function CourseExplorer({
  courses,
  favoriteIds,
  hiddenIds,
  courseContents,
  fetchCourseContent,
  onToggleFavorite,
  onReorderFavorites,
  onToggleVisibility,
  sessionId
}: CourseExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    courses.length > 0 ? courses[0].id : null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedCourses = useMemo(() => {
    const filtered = courses.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const isVisible = showHidden || !hiddenIds.includes(c.id);
      return matchesSearch && isVisible;
    });

    const favorited = favoriteIds
      .map(id => filtered.find(c => c.id === id))
      .filter((c): c is Course => !!c);
    
    const remaining = filtered.filter(c => !favoriteIds.includes(c.id));
    return [...favorited, ...remaining];
  }, [courses, favoriteIds, hiddenIds, searchQuery, showHidden]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const sections = selectedCourseId ? courseContents[selectedCourseId] : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      if (favoriteIds.includes(active.id.toString()) && favoriteIds.includes(over.id.toString())) {
        const oldIndex = favoriteIds.indexOf(active.id.toString());
        const newIndex = favoriteIds.indexOf(over.id.toString());
        const newOrder = arrayMove(favoriteIds, oldIndex, newIndex);
        onReorderFavorites?.(newOrder);
      }
    }
  };

  const handleSelectCourse = (id: string) => {
    setSelectedCourseId(id);
    if (!courseContents[id] || courseContents[id].length === 0) {
      fetchCourseContent(id);
    }
  };

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-main">Mes Cours</h2>
          <p className="text-muted mt-1">Exploration détaillée de vos matières et supports.</p>
        </div>
        
        <div className="flex items-center gap-3 relative w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text"
              placeholder="Rechercher une matière..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-accent-bg border border-border-main rounded-xl py-2.5 pl-10 pr-4 text-sm text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
          </div>
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`p-2.5 rounded-xl transition-all ${showHidden ? 'bg-primary text-white shadow-lg' : 'bg-accent-bg text-muted hover:text-primary'}`}
            title={showHidden ? "Masquer les archivés" : "Afficher les archivés"}
          >
            {showHidden ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={favoriteIds} strategy={verticalListSortingStrategy}>
              {sortedCourses.map((course: Course) => (
                <SortableCourseItem
                  key={course.id}
                  course={course}
                  isSelected={selectedCourseId === course.id}
                  isFavorite={favoriteIds.includes(course.id)}
                  isHidden={hiddenIds.includes(course.id)}
                  onSelect={handleSelectCourse}
                  onToggleFavorite={onToggleFavorite || (() => {})}
                  onToggleVisibility={onToggleVisibility || (() => {})}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="lg:col-span-2 min-h-[60vh] glass rounded-3xl overflow-hidden flex flex-col border border-border-main shadow-2xl">
          {!selectedCourseId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shadow-inner">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-main">Sélectionnez une matière</h3>
                <p className="text-muted max-w-xs mt-2 font-medium">Cliquez sur un cours à gauche pour explorer ses documents et chapitres.</p>
              </div>
              {favoriteIds.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted mt-8">
                  <Star fill="currentColor" size={12} className="text-yellow-500" />
                  <span>Vos favoris apparaissent en haut et sont déplaçables.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 border-b border-border-main bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-xs font-black uppercase tracking-widest text-primary px-2.5 py-1 bg-primary/10 rounded-lg">
                          {selectedCourse?.code}
                       </span>
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-main">{selectedCourse?.name}</h3>
                    <p className="text-muted mt-2 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {selectedCourse?.instructor}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => selectedCourseId && fetchCourseContent(selectedCourseId, true)}
                      className="p-3 bg-accent-bg hover:bg-primary/20 rounded-2xl transition-all text-muted hover:text-primary border border-border-main"
                      title="Rafraîchir le contenu"
                    >
                      <Loader2 className={`w-5 h-5 ${!sections ? "animate-spin" : ""}`} />
                    </button>
                    <a 
                      href={selectedCourse?.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-accent-bg hover:bg-primary/20 rounded-2xl transition-all text-muted hover:text-primary border border-border-main"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-10">
                {sections && sections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-accent-bg rounded-[2.5rem] border-2 border-dashed border-border-main">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                       <BookOpen className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p className="text-xl font-bold">Contenu vide</p>
                    <p className="text-zinc-500 text-sm mt-1">Aucun document n'a pu être extrait automatiquement.</p>
                    <button
                      onClick={() => selectedCourseId && fetchCourseContent(selectedCourseId, true)}
                      className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                      Forcer l'Analyse Profonde
                    </button>
                  </div>
                ) : sections ? (
                  sections.map((section: any) => (
                    <div key={section.id} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-primary rounded-full"></div>
                        <h4 className="text-xl font-black tracking-tight text-main">{section.name}</h4>
                      </div>
                      
                      {section.activities && section.activities.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {section.activities.map((activity: any) => {
                            const style = getActivityStyle(activity.type || 'resource', activity.name);
                            const ActivityIcon = style.Icon;
                            
                            return (
                              <a
                                key={activity.id}
                                href={getMoodleProxyUrl(activity.url, sessionId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-4 rounded-2xl bg-card-bg border border-border-main hover:bg-card-hover hover:border-primary/20 transition-all duration-500 group relative overflow-hidden shadow-sm"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className={`w-12 h-12 rounded-xl ${style.bg} border border-border-main/50 flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-lg relative z-10`}>
                                  <ActivityIcon className={`w-6 h-6 ${style.color}`} />
                                </div>
                                <div className="flex-1 min-w-0 relative z-10">
                                  <p className="text-[15px] font-extrabold truncate group-hover:text-primary text-main transition-colors duration-300">
                                    {activity.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-muted font-black uppercase tracking-wider">{activity.type}</span>
                                    {activity.name.includes('.') && (
                                       <span className="text-[10px] text-primary/80 font-bold px-2 py-0.5 bg-primary/10 rounded-md">
                                         {activity.name.split('.').pop()?.toUpperCase()}
                                       </span>
                                    )}
                                  </div>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 bg-accent-bg rounded-2xl border border-dashed border-border-main">
                           <p className="text-xs text-muted font-medium italic">Aucune activité disponible dans cette section.</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="relative">
                       <Loader2 className="w-12 h-12 text-primary animate-spin" />
                       <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                    </div>
                    <p className="text-lg font-bold animate-pulse">Synchronisation Moodle...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
