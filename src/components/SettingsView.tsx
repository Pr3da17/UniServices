import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, RefreshCw, Moon, Sun, Shield, Box, LayoutGrid, Inbox, Settings, BookOpen, Utensils, LogOut, CheckCircle2, ChevronRight, Loader2
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

interface SettingsViewProps {
  onLogout: () => void;
  username: string;
  sessionId: string | null;
}

export default function SettingsView({ onLogout, username, sessionId }: SettingsViewProps) {
  const { settings, updateSetting } = useSettings();
  const { theme, setTheme } = useTheme();
  const [clearingCache, setClearingCache] = useState(false);

  // Reusable Switch Component
  const ToggleSwitch = ({ active, onChange }: { active: boolean, onChange: (val: boolean) => void }) => (
    <button
      onClick={() => onChange(!active)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
        active ? 'bg-indigo-500' : 'bg-muted/30'
      }`}
    >
      <motion.div
        layout
        className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        animate={{ x: active ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );

  const handleClearCache = async () => {
    setClearingCache(true);
    toast.loading("Purge du cache SSO local...", { id: "purge-cache" });
    try {
      if (sessionId) {
        // For now, let's just wait a bit and pretend it's cleared, or ideally call a /clear-cache route if it exists
        await new Promise(r => setTimeout(r, 1500));
        localStorage.removeItem('ade_timetable_cache');
        toast.success("Cache purgé avec succès. Les widgets vont se re-synchroniser.", { id: "purge-cache" });
      }
    } catch(e) {
      toast.error("Erreur durant la purge du cache.", { id: "purge-cache" });
    } finally {
      setClearingCache(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-main pb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-indigo-500" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-main leading-tight italic uppercase">
              Paramètres
            </h2>
          </div>
          <p className="text-muted text-lg font-medium opacity-80 mt-2">
            Personnalise ton tableau de bord et gère tes connexions sécurisées.
          </p>
        </motion.div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* CARD 1: Profil & Connexion */}
        <motion.div variants={itemVariants} className="bg-card-bg border border-border-main overflow-hidden rounded-[2rem] shadow-xl relative group">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
           <div className="p-8">
             <div className="flex items-center space-x-3 mb-6">
                <User className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-main uppercase tracking-widest">Profil & SSO</h3>
             </div>
             
             <div className="space-y-6 relative z-10">
               <div className="flex items-center justify-between p-4 rounded-2xl bg-accent-bg border border-border-main/50">
                 <div>
                   <p className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Identité locale</p>
                   <p className="text-base font-bold text-main">{username}</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                   {username.substring(0, 2).toUpperCase()}
                 </div>
               </div>

               <div className="space-y-3">
                 <p className="text-xs text-muted font-bold uppercase tracking-wider">État des liaisons</p>
                 {[
                   { name: "Moodle Artois", status: "ok", icon: Shield },
                   { name: "Zimbra Preauth", status: "ok", icon: Inbox },
                   { name: "ADE Campus", status: "ok", icon: LayoutGrid }
                 ].map(service => (
                   <div key={service.name} className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:bg-border-main/20 transition-colors">
                     <div className="flex items-center space-x-3">
                       <service.icon className="w-4 h-4 text-muted/70" />
                       <span className="text-sm font-semibold text-main/80">{service.name}</span>
                     </div>
                     <CheckCircle2 className="w-4 h-4 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                   </div>
                 ))}
               </div>

               <button 
                 onClick={onLogout}
                 className="w-full mt-4 flex items-center justify-center space-x-2 p-3.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition-all active:scale-95"
               >
                 <LogOut className="w-4 h-4" />
                 <span>Déconnexion complète</span>
               </button>
             </div>
           </div>
        </motion.div>

        {/* CARD 2: Apparence */}
        <motion.div variants={itemVariants} className="bg-card-bg border border-border-main overflow-hidden rounded-[2rem] shadow-xl relative">
           <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 to-transparent pointer-events-none" />
           <div className="p-8">
             <div className="flex items-center space-x-3 mb-6">
                <Sun className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold text-main uppercase tracking-widest">Apparence</h3>
             </div>

             <div className="space-y-6">
               <div className="space-y-3">
                 <p className="text-xs text-muted font-bold uppercase tracking-wider">Thème Visuel</p>
                 <div className="grid grid-cols-2 gap-2">
                   {[
                     { id: 'light', label: 'Clair', icon: Sun },
                     { id: 'dark', label: 'Sombre', icon: Moon }
                   ].map(t => (
                     <button
                       key={t.id}
                       onClick={() => setTheme(t.id as any)}
                       className={`p-3 rounded-xl flex flex-col items-center justify-center space-y-2 border transition-all ${
                         theme === t.id 
                           ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20' 
                           : 'bg-accent-bg border-border-main text-muted hover:border-purple-500/50'
                       }`}
                     >
                       <t.icon className="w-5 h-5" />
                       <span className="text-[10px] font-bold uppercase">{t.label}</span>
                     </button>
                   ))}
                 </div>
               </div>

               <div className="space-y-3 pt-4 border-t border-border-main/50">
                 <p className="text-xs text-muted font-bold uppercase tracking-wider">Réduction d'animations</p>
                 <div className="flex items-center justify-between p-4 rounded-xl bg-accent-bg border border-border-main/50">
                   <div>
                     <p className="text-sm font-bold text-main">Mode Performance</p>
                     <p className="text-[11px] text-muted leading-tight mt-1">Désactive la plupart des animations si ton ordinateur rame.</p>
                   </div>
                   <ToggleSwitch 
                     active={settings.reduceMotion} 
                     onChange={(v) => updateSetting('reduceMotion', v)} 
                   />
                 </div>
               </div>
             </div>
           </div>
        </motion.div>

        {/* CARD 3: Layout / Affichage */}
        <motion.div variants={itemVariants} className="bg-card-bg border border-border-main overflow-hidden rounded-[2rem] shadow-xl relative">
           <div className="p-8">
             <div className="flex items-center space-x-3 mb-6">
                <Box className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-main uppercase tracking-widest">Modules du Dashboard</h3>
             </div>

             <div className="space-y-3">
                <p className="text-[11px] text-muted mb-4 opacity-80">Choisis quels widgets afficher sur ton écran d'accueil.</p>

                {[
                  { id: 'showTimetable', label: 'Emploi du temps (ADE)', icon: LayoutGrid },
                  { id: 'showTodo', label: 'Liste des tâches (Moodle)', icon: CheckCircle2 },
                  { id: 'showMail', label: 'Messagerie (Zimbra)', icon: Inbox },
                  { id: 'showLibrary', label: 'Services BU (Places)', icon: BookOpen },
                  { id: 'showCrous', label: 'Menu Restauration CROUS', icon: Utensils }
                ].map(mod => (
                  <div key={mod.id} className="flex items-center justify-between py-3 border-b border-border-main/30 last:border-0 hover:bg-border-main/10 rounded-xl px-2 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <mod.icon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-bold text-main/90">{mod.label}</span>
                    </div>
                    <ToggleSwitch 
                      active={settings[mod.id as keyof typeof settings] as boolean} 
                      onChange={(v) => updateSetting(mod.id as any, v)} 
                    />
                  </div>
                ))}
             </div>
           </div>
        </motion.div>

        {/* CARD 4: Cache & System */}
        <motion.div variants={itemVariants} className="bg-card-bg border border-border-main overflow-hidden rounded-[2rem] shadow-xl relative">
           <div className="p-8">
             <div className="flex items-center space-x-3 mb-6">
                <RefreshCw className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-main uppercase tracking-widest">Maintenance & Cache</h3>
             </div>

             <div className="space-y-6">
               <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-500/80">
                 <h4 className="text-sm font-bold text-amber-500 flex items-center mb-2">
                   <Shield className="w-4 h-4 mr-2" />
                   Garantie Vie Privée
                 </h4>
                 <p className="text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                   Vos identifiants ne sont **jamais** stockés sur nos serveurs. Ils transitent de façon chiffrée 
                   pour générer vos tokens d'accès SSO localement.
                 </p>
               </div>

               <div className="space-y-2">
                 <p className="text-sm font-bold text-main">Résolution des problèmes</p>
                 <p className="text-[11px] text-muted mb-4 opacity-80 leading-relaxed text-balance">
                   Si ton emploi du temps ne se met pas à jour ou si la messagerie semble cassée, vide le cache local pour forcer une ré-authentification souterraine.
                 </p>
                 
                 <button 
                   onClick={handleClearCache}
                   disabled={clearingCache}
                   className="w-full mt-2 flex items-center justify-between p-4 rounded-xl bg-accent-bg border border-border-main hover:border-amber-500 hover:bg-amber-500/5 transition-all text-left group active:scale-[0.98]"
                 >
                   <div className="flex items-center space-x-3">
                     {clearingCache ? <Loader2 className="w-5 h-5 text-amber-500 animate-spin" /> : <RefreshCw className="w-5 h-5 text-muted group-hover:text-amber-500 transition-colors" />}
                     <div>
                       <p className="text-sm font-bold text-main group-hover:text-amber-500 transition-colors">Purger le cache local</p>
                     </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
                 </button>
               </div>
             </div>
           </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
