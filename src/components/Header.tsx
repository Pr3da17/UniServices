import { Menu, Search, LogOut, Code, Sun, Moon, ExternalLink } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { getApiUrl } from "../utils/api";

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
    <header className="glass border-b border-border-main p-3 md:p-4 sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/10 dark:hover:bg-white/5 rounded-xl transition-colors text-muted hover:text-primary group lg:hidden"
          >
            <Menu className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-main">Dashboard</h1>
            <p className="text-[10px] md:text-xs text-muted">Vue d'ensemble de vos activités</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="relative group/search hidden lg:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted transition-colors group-focus-within/search:text-primary" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-2 w-48 xl:w-64 bg-input-bg border border-border-main rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs md:text-sm placeholder:text-muted/60 text-main hover:border-accent-border"
            />
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 md:p-2.5 hover:bg-accent-bg rounded-xl transition-all duration-500 text-muted hover:text-primary group border border-transparent hover:border-accent-border"
            title={theme === "dark" ? "Passer au mode clair" : "Passer au mode sombre"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 transition-transform duration-500 rotate-0 scale-100 group-hover:rotate-90" />
            ) : (
              <Moon className="w-5 h-5 transition-transform duration-500 rotate-0 scale-100 group-hover:-rotate-12" />
            )}
          </button>

          <div className="flex items-center space-x-2 md:space-x-4 border-l border-border-main pl-2 md:pl-4 ml-1 md:ml-2">
            {isLoggedIn && sessionId && (
              <a 
                href={getApiUrl(`/api/auth/sso/jump?sessionId=${sessionId}&service=${encodeURIComponent("https://moodle.univ-artois.fr/login/index.php?authCAS=CAS")}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center px-4 py-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl text-[10px] md:text-[11px] font-bold transition-all border border-orange-500/20 hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"
                title="Accéder directement à Moodle"
              >
                Moodle <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </a>
            )}

            <div className="flex flex-col items-end mr-1 max-w-[120px] md:max-w-none">
              <p className="font-bold text-xs md:text-sm text-main truncate w-full text-right">
                {isLoggedIn ? (username || "Étudiant") : "Invité"}
              </p>
              {formationName && isLoggedIn && (
                <span className="hidden sm:inline-block text-[8px] md:text-[10px] px-2 py-0.5 mt-0.5 md:mt-1 bg-primary/10 text-primary font-bold rounded border border-primary/20 uppercase tracking-widest leading-none truncate max-w-full">
                  {formationName}
                </span>
              )}
            </div>
            
            {isLoggedIn && onLogout ? (
              <button 
                onClick={onLogout} 
                className="p-2 md:p-2.5 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-danger/25 group border border-danger/20" 
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5 transform group-hover:-translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-accent-bg border border-border-main flex items-center justify-center">
                <Code className="w-4 h-4 md:w-5 md:h-5 text-muted" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
