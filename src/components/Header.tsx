import { Menu, Search, LogOut, Code, Sun, Moon, ExternalLink } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  toggleSidebar: () => void;
  isLoggedIn: boolean;
  username?: string | null;
  formationName?: string | null;
  sessionId?: string | null;
  onLogout?: () => void;
}

export default function Header({ toggleSidebar, isLoggedIn, username, formationName, onLogout, sessionId }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass border-b border-border-main p-4 sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-xl transition-colors text-muted hover:text-primary group"
          >
            <Menu className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-xl font-semibold tracking-tight text-main">Dashboard</h1>
            <p className="text-xs text-muted">Vue d'ensemble de vos activités</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative group/search hidden md:block">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted transition-colors group-focus-within/search:text-primary" />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              className="pl-10 pr-4 py-2 w-64 bg-input-bg border border-border-main rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm placeholder:text-muted/60 text-main hover:border-accent-border"
            />
          </div>

          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-accent-bg rounded-xl transition-all duration-500 text-muted hover:text-primary group border border-transparent hover:border-accent-border"
            title={theme === "dark" ? "Passer au mode clair" : "Passer au mode sombre"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 transition-transform duration-500 rotate-0 scale-100 group-hover:rotate-90" />
            ) : (
              <Moon className="w-5 h-5 transition-transform duration-500 rotate-0 scale-100 group-hover:-rotate-12" />
            )}
          </button>

          <div className="flex items-center space-x-4 border-l border-border-main pl-4 ml-2">
            {isLoggedIn && sessionId && (
              <a 
                href={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/auth/sso/jump?sessionId=${sessionId}&url=https://moodle.univ-artois.fr/`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center px-4 py-2.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-orange-500/20 hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"
                title="Accéder directement à Moodle"
              >
                Moodle <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </a>
            )}

            <div className="flex flex-col items-end mr-1">
              <p className="font-medium text-sm text-main">
                {isLoggedIn ? (username || "Étudiant") : "Invité"}
              </p>
              {formationName && isLoggedIn && (
                <span className="text-[10px] px-2 py-0.5 mt-1 bg-primary/10 text-primary font-semibold rounded border border-primary/20 uppercase tracking-widest leading-none">
                  {formationName}
                </span>
              )}
            </div>
            
            {isLoggedIn && onLogout ? (
              <button 
                onClick={onLogout} 
                className="p-2.5 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-danger/25 group border border-danger/20" 
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-accent-bg border border-border-main flex items-center justify-center">
                <Code className="w-5 h-5 text-muted" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
