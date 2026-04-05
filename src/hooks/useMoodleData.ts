import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import type { Assignment, Course } from "../services/moodleService";
import { getUpcomingAssignments, getCourses, getCatalog, getCourseContent } from "../services/moodleService";
import { saveSession, getStoredSession, clearSession, updateFavorites, updateHiddenStatus, saveCourseContent, getCachedCourseContent, saveTask, getTasks, deleteTask, toggleTask, updateTask } from "../database/db";
import type { TaskDocument } from "../database/db";
import { v4 as uuidv4 } from 'uuid';

export function useMoodleData() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [formationId, setFormationId] = useState<string | null>(null);
  const [yearId, setYearId] = useState<string | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [catalog, setCatalog] = useState<Course[]>([]);
  const [courseContents, setCourseContents] = useState<Record<string, any>>({});
  const [userTasks, setUserTasks] = useState<TaskDocument[]>([]);
  const [loading, setLoading] = useState(true); // default to true while checking db
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const isLoggedIn = Boolean(sessionId);

  // Restore session from RxDB or LocalStorage (after SSO redirect) on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // 1. Check if we just returned from an SSO login (temp storage in localStorage)
        const tempSid = localStorage.getItem("moodle_session_id");
        if (tempSid) {
          const tempUser = localStorage.getItem("moodle_username");
          const tempUniv = localStorage.getItem("moodle_pref_univ");
          const tempEstab = localStorage.getItem("moodle_pref_estab");
          const tempForm = localStorage.getItem("moodle_pref_form");
          const tempYear = localStorage.getItem("moodle_pref_year");
          const tempFavs = JSON.parse(localStorage.getItem("moodle_pref_fav_courses") || "[]");
          const tempHidden = JSON.parse(localStorage.getItem("moodle_pref_hidden_courses") || "[]");

          setSessionId(tempSid);
          setUsername(tempUser);
          setUniversityId(tempUniv);
          setEstablishmentId(tempEstab);
          setFormationId(tempForm || null);
          setYearId(tempYear || null);
          setFavoriteIds(tempFavs);
          setHiddenIds(tempHidden);

          // Clear temp storage immediately
          localStorage.removeItem("moodle_session_id");
          localStorage.removeItem("moodle_username");
          localStorage.removeItem("moodle_pref_fav_courses");
          localStorage.removeItem("moodle_pref_hidden_courses");
          
          // Perspective: Save to permanent RxDB
          await saveSession({
            token: tempSid,
            username: tempUser || "Étudiant",
            universityId: tempUniv || undefined,
            establishmentId: tempEstab || undefined,
            formationId: tempForm || undefined,
            yearId: tempYear || undefined,
            favoriteCourses: tempFavs,
            hiddenCourses: tempHidden
          });
        } 
        // 2. Otherwise restore from permanent DB
        else {
          const stored = await getStoredSession();
          if (stored && stored.token) {
            setSessionId(stored.token);
            setUsername(stored.username);
            setUniversityId(stored.universityId || null);
            setEstablishmentId(stored.establishmentId || null);
            setFormationId(stored.formationId || null);
            setYearId(stored.yearId || null);
            setFavoriteIds(stored.favoriteCourses || []);
            setHiddenIds(stored.hiddenCourses || []);
          }
        }

        const taskList = await getTasks();
        setUserTasks(taskList || []);
      } catch (err) {
        console.warn("Could not restore session/tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const fetchDashboardData = useCallback(async (sid: string, catId?: string | null) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const [assignData, courseData, catalogData] = await Promise.all([
        getUpcomingAssignments(sid),
        getCourses(sid),
        catId ? getCatalog(sid, catId) : Promise.resolve([])
      ]);
      setAssignments(assignData);
      setCourses(courseData);
      setCatalog(catalogData);
    } catch (err: any) {
      const msg = err.message || "Impossible de charger le dashboard.";
      setError(msg);
      toast.error("Erreur de synchronisation", {
        description: msg,
        duration: 5000,
      });
      if (err?.response?.status === 401 || String(msg).includes("session")) {
        setSessionId(null);
        await clearSession().catch(() => { });
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      const bestId = yearId || formationId || establishmentId || null;
      const catId = bestId ? bestId.replace(/^(year|form|est)-/, '') : null;
      fetchDashboardData(sessionId, catId);
    }
  }, [sessionId, yearId, formationId, establishmentId, fetchDashboardData]);

  const handleLoginSuccess = async (data: any) => {
    setSessionId(data.sessionId);
    setUsername(data.username);
    setUniversityId(data.universityId || null);
    setEstablishmentId(data.establishmentId || null);
    setFormationId(data.formationId || null);
    setYearId(data.yearId || null);
    setFavoriteIds(data.favoriteCourses || []);
    setHiddenIds(data.hiddenCourses || []);
    
    toast.success("Connexion réussie", {
      description: `Bon retour, ${data.username} !`,
      duration: 3500,
    });

    await saveSession({
      token: data.sessionId,
      username: data.username,
      universityId: data.universityId,
      establishmentId: data.establishmentId,
      formationId: data.formationId,
      yearId: data.yearId,
      favoriteCourses: data.favoriteCourses || [],
      hiddenCourses: data.hiddenCourses || []
    }).catch(err => console.error("Erreur RxDB :", err));
  };

  const handleLogout = async () => {
    setSessionId(null);
    setUsername(null);
    await clearSession().catch(() => { });
  };

  const urgences = useMemo(() => {
    // Merge Moodle assignments and user tasks
    const moodleTasks: TaskDocument[] = assignments.map(a => ({
      id: a.id,
      title: a.title,
      course: a.course,
      dueDate: a.dueDate,
      completed: false, // Moodle assignments are usually implicitly pending
      type: 'moodle',
      url: a.url,
      createdAt: 0
    }));

    const all = [...moodleTasks, ...userTasks.filter(t => !t.completed)];
    
    return all
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
  }, [assignments, userTasks]);

  const handleAddTask = useCallback(async (title: string, dueDate: string, course?: string, notes?: string) => {
    const newTask: TaskDocument = {
      id: uuidv4(),
      title,
      dueDate,
      course,
      notes,
      completed: false,
      type: 'manual',
      createdAt: Date.now()
    };
    await saveTask(newTask);
    setUserTasks(prev => [...prev, newTask]);
    toast.success("Tâche ajoutée !");
  }, []);

  const handleUpdateTask = useCallback(async (id: string, updates: Partial<TaskDocument>) => {
    if (userTasks.some(t => t.id === id)) {
      await updateTask(id, updates);
      setUserTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success("Tâche mise à jour");
    }
  }, [userTasks]);

  const handleToggleTask = useCallback(async (id: string, completed: boolean) => {
    // Check if it's a manual task (Moodle tasks can't be toggled in DB yet)
    if (userTasks.some(t => t.id === id)) {
      await toggleTask(id, completed);
      setUserTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t));
    } else {
      // Local toggle for Moodle tasks (not persisted yet)
      // This could be enhanced by storing 'overrides' in DB
      toast.info("Le statut des devoirs Moodle est géré automatiquement.");
    }
  }, [userTasks]);

  const handleDeleteTask = useCallback(async (id: string) => {
    if (userTasks.some(t => t.id === id)) {
      await deleteTask(id);
      setUserTasks(prev => prev.filter(t => t.id === id ? false : true));
      toast.success("Tâche supprimée");
    }
  }, [userTasks]);

  const handleToggleFavorite = useCallback((courseId: string) => {
    setFavoriteIds(prev => {
      const newFavs = prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId];
      updateFavorites(newFavs).catch(console.error);
      return newFavs;
    });
  }, []);

  const handleReorderFavorites = useCallback((newOrder: string[]) => {
    setFavoriteIds(newOrder);
    updateFavorites(newOrder).catch(console.error);
  }, []);

  const handleToggleVisibility = useCallback((courseId: string) => {
    setHiddenIds(prev => {
      const isHidden = prev.includes(courseId);
      const newHidden = isHidden
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId];
      updateHiddenStatus(newHidden).catch(console.error);
      return newHidden;
    });
  }, []);

  const fetchCourseContent = useCallback(async (courseId: string, force: boolean = false) => {
    if (!sessionId) return;
    
    // Try cache first if not forcing
    if (!force) {
      const cached = await getCachedCourseContent(courseId);
      // Only use cache if it actually contains sections
      if (cached && cached.length > 0) {
        setCourseContents(prev => ({ ...prev, [courseId]: cached }));
        return; 
      }
    }

    try {
      if (force) toast.loading("Actualisation approfondie depuis Moodle...", { id: "scraping" });
      
      const res = await getCourseContent(sessionId, courseId, force);
      if (res.success && res.data) {
        setCourseContents(prev => ({ ...prev, [courseId]: res.data }));
        await saveCourseContent(courseId, res.data);
        if (force) toast.success("Contenu mis à jour !", { id: "scraping" });
      } else if (force) {
        toast.error("Échec de la mise à jour", { id: "scraping" });
      }
    } catch (err) {
      console.error("Error fetching course content:", err);
      if (force) toast.error("Erreur de connexion", { id: "scraping" });
    }
  }, [sessionId]);

  return {
    isLoggedIn,
    username,
    universityId,
    establishmentId,
    formationId,
    yearId,
    loading,
    error,
    assignments,
    courses,
    catalog,
    favoriteIds,
    hiddenIds,
    courseContents,
    urgences,
    userTasks,
    sessionId,
    handleLoginSuccess,
    handleLogout,
    handleToggleFavorite,
    handleReorderFavorites,
    handleToggleVisibility,
    fetchCourseContent,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleUpdateTask
  };
}
