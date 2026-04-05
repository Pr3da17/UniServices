import { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Calendar,
  BookOpen,
  Search,
  Check,
  Clock,
  Edit2,
  ChevronDown,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isBefore, startOfToday, addDays } from 'date-fns';
import type { TaskDocument } from '../database/db';
import { formatDate } from '../utils/date';
import { getMoodleProxyUrl } from '../utils/proxy';

interface HomeworkViewProps {
  urgences: TaskDocument[];
  userTasks: TaskDocument[];
  sessionId: string | null;
  onAddTask: (title: string, dueDate: string, course?: string, notes?: string) => void;
  onToggleTask: (id: string, completed: boolean) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<TaskDocument>) => void;
}

export default function HomeworkView({ 
  urgences, 
  userTasks, 
  sessionId, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask,
  onUpdateTask
}: HomeworkViewProps) {
  const [filter, setFilter] = useState<'all' | 'moodle' | 'manual'>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDocument | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [newCourse, setNewCourse] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const allTasks = useMemo(() => {
    const moodleTasks: TaskDocument[] = urgences.filter(u => u.type === 'moodle');
    const combined = [...moodleTasks, ...userTasks];
    
    return combined.filter(task => {
      const matchesFilter = filter === 'all' || task.type === filter;
      const matchesStatus = statusFilter === 'completed' ? task.completed : !task.completed;
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (task.course && task.course.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesFilter && matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [urgences, userTasks, filter, statusFilter, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingTask) {
      onUpdateTask(editingTask.id, {
        title: newTitle,
        dueDate: newDate,
        course: newCourse || undefined,
        notes: newNotes || undefined
      });
    } else {
      onAddTask(newTitle, newDate, newCourse || undefined, newNotes || undefined);
    }

    resetForm();
  };

  const resetForm = () => {
    setNewTitle("");
    setNewCourse("");
    setNewNotes("");
    setNewDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    setShowAddForm(false);
    setEditingTask(null);
  };

  const handleEditClick = (task: TaskDocument) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDate(format(new Date(task.dueDate), 'yyyy-MM-dd'));
    setNewCourse(task.course || "");
    setNewNotes(task.notes || "");
    setShowAddForm(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-main">Mes Devoirs</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            {allTasks.length} {statusFilter === 'pending' ? 'devoirs à finaliser' : 'devoirs terminés'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all w-full md:w-64"
            />
          </div>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" /> Ajouter
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'pending' ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            À faire
          </button>
          <button 
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'completed' ? 'bg-green-500/10 text-green-500' : 'text-zinc-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            Terminé
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          {(['all', 'moodle', 'manual'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-white dark:bg-white/10 shadow-sm text-primary' : 'text-zinc-500'}`}
            >
              {f === 'all' ? 'Tous' : f === 'moodle' ? 'Moodle' : 'Perso'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {allTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-white/10"
            >
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Aucun devoir trouvé</h3>
              <p className="text-zinc-500 mt-1">Détendez-vous ou essayez d'autres filtres !</p>
            </motion.div>
          ) : (
            allTasks.map((task) => {
              const isMoodle = task.type === 'moodle';
              const dueDate = new Date(task.dueDate);
              const isOverdue = !task.completed && isBefore(dueDate, startOfToday());
              const isExpanded = expandedTaskId === task.id;
              
              return (
                <motion.div
                  layout
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`group p-5 rounded-3xl border transition-all duration-300 ${
                    task.completed 
                      ? 'bg-slate-50/50 dark:bg-white/2 border-zinc-100 dark:border-white/5' 
                      : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button 
                      onClick={() => onToggleTask(task.id, !task.completed)}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : isOverdue ? 'border-red-500 text-red-500' : 'border-zinc-300 dark:border-white/20 hover:border-primary'
                      }`}
                    >
                      {task.completed && <Check className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div 
                          className="cursor-pointer"
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        >
                          <h4 className={`text-lg font-bold transition-all ${task.completed ? 'text-zinc-500 line-through' : 'text-main'}`}>
                            {task.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                              <BookOpen className="w-3.5 h-3.5" />
                              {task.course || 'Personnel'}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className={`flex items-center gap-1.5 text-xs font-bold ${
                              isOverdue ? 'text-red-500' : 'text-zinc-500'
                            }`}>
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(task.dueDate)}
                            </span>
                            {task.notes && (
                              <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-bold">
                                <MessageSquare className="w-3 h-3" /> Note
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isMoodle && task.url && (
                            <a 
                              href={getMoodleProxyUrl(task.url, sessionId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 bg-slate-100 dark:bg-white/10 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-primary hover:text-white transition-all"
                              title="Voir sur Moodle"
                            >
                              <Clock className="w-4 h-4" />
                            </a>
                          )}
                          {!isMoodle && (
                            <button 
                              onClick={() => handleEditClick(task)}
                              className="p-2.5 bg-slate-100 dark:bg-white/10 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-primary hover:text-white transition-all"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {!isMoodle && (
                            <button 
                              onClick={() => onDeleteTask(task.id)}
                              className="p-2.5 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                            className={`p-2.5 bg-slate-100 dark:bg-white/10 rounded-xl text-zinc-500 transition-all ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Instructions / Notes</p>
                              <div className="p-4 bg-slate-50 dark:bg-white/2 rounded-2xl text-sm text-zinc-600 dark:text-zinc-400 italic">
                                {task.notes || "Aucune instruction supplémentaire."}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Task Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/10 p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-6">{editingTask ? 'Modifier le devoir' : 'Ajouter un devoir'}</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Titre de la tâche</label>
                  <input 
                    autoFocus
                    type="text"
                    required
                    placeholder="Ex: Réviser l'examen d'algorithmique"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Date d'échéance</label>
                    <input 
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Matière (facultatif)</label>
                    <input 
                      type="text"
                      placeholder="Ex: Mathématiques"
                      value={newCourse}
                      onChange={(e) => setNewCourse(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Notes / Instructions du prof</label>
                  <textarea 
                    placeholder="Notez ici les consignes spécifiques, le matériel à apporter, etc."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 px-6 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {editingTask ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
