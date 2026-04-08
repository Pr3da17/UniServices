import { Home, Calendar, BookOpen, GraduationCap, Settings } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "dashboard", icon: Home, label: "Accueil" },
    { id: "calendar", icon: Calendar, label: "EDT" },
    { id: "courses", icon: BookOpen, label: "Cours" },
    { id: "homework", icon: GraduationCap, label: "Devoirs" },
    { id: "settings", icon: Settings, label: "Réglages" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="mx-4 mb-4 glass rounded-3xl p-2 flex items-center justify-around shadow-2xl relative overflow-hidden">
        {/* Active Background Glow */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/20 blur-xl px-12" />
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative py-2 px-1 flex flex-col items-center justify-center min-w-[64px] transition-all active:scale-90"
            >
              <div className={`relative p-1.5 rounded-2xl transition-all duration-300 ${
                isActive ? 'bg-primary/20 text-primary' : 'text-muted hover:text-main'
              }`}>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavGlow"
                    className="absolute inset-0 bg-primary/20 rounded-2xl blur-md"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
              </div>
              <span className={`text-[10px] font-bold mt-1 uppercase tracking-widest transition-opacity duration-300 ${
                isActive ? 'opacity-100 text-primary' : 'opacity-40'
              }`}>
                {tab.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="bottomIndicator"
                  className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
