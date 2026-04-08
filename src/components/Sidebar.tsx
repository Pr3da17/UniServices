import { Home, BookOpen, Calendar, Settings, X, ChevronRight, CheckCircle2 } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ isOpen, toggleSidebar, activeTab, onTabChange }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "calendar", icon: Calendar, label: "Emploi du Temps" },
    { id: "courses", icon: BookOpen, label: "Mes Cours" },
    { id: "homework", icon: CheckCircle2, label: "Mes Devoirs" },
    { id: "settings", icon: Settings, label: "Paramètres" },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 glass shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent tracking-tight">
          UniServices
        </h1>
        <button
          onClick={toggleSidebar}
          className="p-2 lg:hidden hover:bg-accent-bg rounded-xl transition-colors text-muted hover:text-primary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="px-4 py-2 mt-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 px-2">Menu Principal</p>
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                  ? "bg-accent-bg text-primary font-medium border border-accent-border shadow-sm" 
                  : "text-muted hover:bg-accent-bg hover:text-main border border-transparent"
                }`}
              >
                <div className="flex items-center">
                  <item.icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  {item.label}
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Carte promotionnelle Premium en bas de Sidebar */}
      <div className="absolute bottom-8 left-0 w-full px-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 relative overflow-hidden group cursor-pointer transition-all hover:border-primary/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <h3 className="text-sm font-semibold text-main relative z-10 flex items-center">
            Mode Premium <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
          </h3>
          <p className="text-xs text-muted mt-1 relative z-10">Débloquez plus de statistiques détaillées.</p>
        </div>
      </div>
    </aside>
  );
}
