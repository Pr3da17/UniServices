import { useState, lazy, Suspense } from "react";
import { Toaster } from "sonner";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LoginForm from "./components/LoginForm";
import TimetableWidget from "./components/TimetableWidget";
import TodoWidget from "./components/TodoWidget";
import LibraryWidget from "./components/LibraryWidget";
import ErrorBoundary from "./components/ErrorBoundary";
import { useMoodleData } from "./hooks/useMoodleData";
import { universities } from "./data/schools";
import MailWidget from "./components/MailWidget";
import CrousWidget from "./components/CrousWidget";
import ViewLoader from "./components/ViewLoader";
import QuickAccess from "./components/QuickAccess";
import BottomNav from "./components/BottomNav";

import { ThemeProvider } from "./context/ThemeContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";

// Lazy Loaded views for ultra-fast initial load
const CourseExplorer = lazy(() => import("./components/CourseExplorer"));
const TimetableView = lazy(() => import("./components/TimetableView"));
const HomeworkView = lazy(() => import("./components/HomeworkView"));
const SettingsView = lazy(() => import("./components/SettingsView"));

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className="w-full"
  >
    {children}
  </motion.div>
);

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const { settings } = useSettings();

  const {
    loading,
    isLoggedIn,
    username,
    universityId,
    establishmentId,
    formationId,
    yearId,
    courses,
    favoriteIds,
    hiddenIds,
    urgences,
    userTasks,
    courseContents,
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
  } = useMoodleData();

  if (loading && !isLoggedIn) {
    return <div className="min-h-screen flex items-center justify-center font-medium">Chargement de la session...</div>;
  }

  const getHeaderName = () => {
    if (!universityId) return null;
    const univ = universities.find(u => u.id === universityId);
    if (!univ) return null;

    let path = univ.name;
    const est = univ.establishments.find(e => e.id === establishmentId);
    if (est) {
      path += " • " + est.name;
      const form = est.formations?.find(f => f.id === formationId);
      if (form) {
        path += " • " + form.name;
        const year = form.years?.find(y => y.id === yearId);
        if (year) path += " " + year.name;
      }
    }
    return path;
  };
  const formationName = getHeaderName();

  return (
    <div className="min-h-screen transition-colors duration-500">
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "glass !border-zinc-500/10 !shadow-2xl overflow-hidden",
          style: {
            background: "var(--glass-bg)",
            backdropFilter: "blur(12px)",
            color: "var(--text-main)"
          },
        }}
      />
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`${sidebarOpen ? "lg:ml-64" : ""} transition-all duration-300 pb-20 lg:pb-0`}
      >
        <Header toggleSidebar={toggleSidebar} isLoggedIn={isLoggedIn} username={username} formationName={formationName} onLogout={handleLogout} sessionId={sessionId} />

        <main className="p-4 md:p-6 space-y-8">
          <ErrorBoundary>
            <Suspense fallback={<ViewLoader />}>
              <AnimatePresence mode="wait">
                {!isLoggedIn ? (
                  <PageTransition key="login">
                    <LoginForm onLoginSuccess={handleLoginSuccess} />
                  </PageTransition>
                ) : (
                  activeTab === "dashboard" ? (
                    <PageTransition key="dashboard">
                      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
                    {/* Hero Section / Welcome */}
                    <div className="flex flex-col gap-10 border-b border-border-main pb-10">
                       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                         <motion.div 
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ duration: 0.8, ease: "easeOut" }}
                         >
                           <h2 className="text-5xl font-black tracking-tighter text-main leading-tight italic uppercase">
                             Hello, {username || "Étudiant"} ! <span className="not-italic">🚀</span>
                           </h2>
                           <p className="text-muted mt-3 text-lg font-medium opacity-80">
                             Prêt pour ta journée à l'Université d'Artois ? Voici tes outils synchronisés.
                           </p>
                         </motion.div>
                         
                         <div className="hidden lg:flex items-center space-x-3 text-[10px] uppercase tracking-widest font-black text-muted/50 border-l border-border-main pl-6 h-12">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>SSO Gateway Artois Active</span>
                         </div>
                       </div>

                       <div className="animate-in fade-in slide-in-from-top-4 duration-1000 delay-300 fill-mode-both">
                         <QuickAccess sessionId={sessionId} />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                      {/* Main Timeline Column */}
                      <div className="lg:col-span-2 space-y-8">
                        {settings.showTimetable && (
                          <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                              <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Planning du jour</h3>
                            </div>
                            <TimetableWidget sessionId={sessionId || undefined} />
                          </section>
                        )}

                        {settings.showMail && (
                          <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                              <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Messagerie</h3>
                            </div>
                            <MailWidget sessionId={sessionId || undefined} />
                          </section>
                        )}
                      </div>

                      {/* Side Widgets Column */}
                      <div className="space-y-8">
                        {settings.showTodo && (
                          <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                              <h3 className="text-sm font-bold uppercase tracking-widest text-muted">À faire</h3>
                            </div>
                            <TodoWidget 
                              urgences={urgences} 
                              loading={loading} 
                              sessionId={sessionId} 
                              onManageClick={() => setActiveTab('homework')}
                            />
                          </section>
                        )}
                        
                        {settings.showLibrary && (
                          <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                              <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Services BU</h3>
                            </div>
                            <LibraryWidget />
                          </section>
                        )}

                        {settings.showCrous && (
                          <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                              <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Restauration</h3>
                            </div>
                            <CrousWidget />
                          </section>
                        )}
                      </div>
                    </div>
                  </div>
                  </PageTransition>
                ) : activeTab === "settings" ? (
                  <PageTransition key="settings">
                    <SettingsView 
                      onLogout={handleLogout} 
                      username={username || "Étudiant"} 
                      sessionId={sessionId} 
                    />
                  </PageTransition>
                ) : activeTab === "courses" ? (
                  <PageTransition key="courses">
                    <CourseExplorer 
                      courses={courses}
                      favoriteIds={favoriteIds}
                      hiddenIds={hiddenIds}
                      courseContents={courseContents}
                      fetchCourseContent={fetchCourseContent}
                      onToggleFavorite={handleToggleFavorite}
                      onReorderFavorites={handleReorderFavorites}
                      onToggleVisibility={handleToggleVisibility}
                      sessionId={sessionId || ""}
                    />
                  </PageTransition>
                ) : activeTab === "calendar" ? (
                  <PageTransition key="calendar">
                    <TimetableView sessionId={sessionId || undefined} />
                  </PageTransition>
                ) : activeTab === "homework" ? (
                  <PageTransition key="homework">
                    <HomeworkView 
                      urgences={urgences}
                      userTasks={userTasks}
                      sessionId={sessionId || ""}
                      onAddTask={handleAddTask}
                      onToggleTask={handleToggleTask}
                      onDeleteTask={handleDeleteTask}
                      onUpdateTask={handleUpdateTask}
                    />
                  </PageTransition>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <p>Cet onglet ({activeTab}) sera bientôt disponible.</p>
                  </div>
                )
              )}
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      {isLoggedIn && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
}
