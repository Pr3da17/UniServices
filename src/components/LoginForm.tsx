import { useState, useEffect } from "react";
import { loginMoodle } from "../services/moodleService";
import { universities } from "../data/schools";
import { User, Lock, School, GraduationCap, Loader2, CheckCircle2, ChevronRight, Building2, CalendarDays } from "lucide-react";

interface LoginFormProps {
  onLoginSuccess: (data: { 
    sessionId: string; 
    username: string; 
    universityId?: string; 
    establishmentId?: string; 
    formationId?: string; 
    yearId?: string;
    favoriteCourses?: string[];
    hiddenCourses?: string[];
  }) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [universityId, setUniversityId] = useState(() => localStorage.getItem("moodle_pref_univ") || "");
  const [establishmentId, setEstablishmentId] = useState(() => localStorage.getItem("moodle_pref_estab") || "");
  const [formationId, setFormationId] = useState(() => localStorage.getItem("moodle_pref_form") || "");
  const [yearId, setYearId] = useState(() => localStorage.getItem("moodle_pref_year") || "");
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const selectedUniv = universities.find((u) => u.id === universityId);
  const selectedEstab = selectedUniv?.establishments.find((e) => e.id === establishmentId);
  const selectedForm = selectedEstab?.formations?.find((f) => f.id === formationId);

  // Persistence effect
  useEffect(() => {
    if (universityId) localStorage.setItem("moodle_pref_univ", universityId);
    if (establishmentId) localStorage.setItem("moodle_pref_estab", establishmentId);
    if (formationId) localStorage.setItem("moodle_pref_form", formationId);
    if (yearId) localStorage.setItem("moodle_pref_year", yearId);
  }, [universityId, establishmentId, formationId, yearId]);

  // Auto-selection cascade (only if CURRENT selection is invalid for the new parent)
  useEffect(() => {
    if (selectedUniv) {
      // If current establishment was not in this university, reset it
      const isValid = selectedUniv.establishments.some(e => e.id === establishmentId);
      if (!isValid && selectedUniv.establishments.length > 0) {
        setEstablishmentId(selectedUniv.establishments[0].id);
      } else if (selectedUniv.establishments.length === 0) {
        setEstablishmentId("");
      }
    }
  }, [universityId, selectedUniv]);

  useEffect(() => {
    if (selectedEstab && selectedEstab.formations) {
      const isValid = selectedEstab.formations.some(f => f.id === formationId);
      if (!isValid && selectedEstab.formations.length > 0) {
        setFormationId(selectedEstab.formations[0].id);
      } else if (selectedEstab.formations.length === 0) {
        setFormationId("");
      }
    }
  }, [establishmentId, selectedEstab]);

  useEffect(() => {
    if (selectedForm && selectedForm.years) {
      const isValid = selectedForm.years.some(y => y.id === yearId);
      if (!isValid && selectedForm.years.length > 0) {
        setYearId(selectedForm.years[0].id);
      } else if (selectedForm.years.length === 0) {
        setYearId("");
      }
    }
  }, [formationId, selectedForm]);

  const hasYears = !!(selectedForm && selectedForm.years && selectedForm.years.length > 0);
  const isFormComplete = universityId && establishmentId && (!selectedEstab?.formations?.length || formationId) && (!hasYears || yearId) && username && password;

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (lockedUntil && Date.now() < lockedUntil) {
      setErrorMsg("Trop de tentatives. Réessayez plus tard.");
      setStatus('error');
      return;
    }

    if (!isFormComplete) {
      setErrorMsg("Veuillez remplir tous les champs.");
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      const loginResult = await loginMoodle(username.trim(), password);
      
      setStatus('success');
      
      // Add the session data to localStorage so it's there after the redirect
      localStorage.setItem("moodle_session_id", loginResult.sessionId);
      localStorage.setItem("moodle_username", loginResult.username);
      localStorage.setItem("moodle_pref_univ", universityId);
      localStorage.setItem("moodle_pref_estab", establishmentId);
      localStorage.setItem("moodle_pref_form", formationId || "");
      localStorage.setItem("moodle_pref_year", yearId || "");
      localStorage.setItem("moodle_pref_fav_courses", JSON.stringify(loginResult.favoriteCourses || []));
      localStorage.setItem("moodle_pref_hidden_courses", JSON.stringify(loginResult.hiddenCourses || []));

      onLoginSuccess({
        sessionId: loginResult.sessionId,
        username: loginResult.username,
        universityId: universityId,
        establishmentId: establishmentId,
        formationId: formationId,
        yearId: yearId,
        favoriteCourses: loginResult.favoriteCourses || [],
        hiddenCourses: loginResult.hiddenCourses || []
      });

    } catch (err: any) {
      setLoginAttempts((prev) => prev + 1);
      if (loginAttempts >= 4) {
        setLockedUntil(Date.now() + 300000);
        setErrorMsg("Compte verrouillé pour 5 min.");
      } else {
        setErrorMsg(err?.message || "Identifiants incorrects.");
      }
      setStatus('error');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative group mt-8 mb-12">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-success/30 rounded-3xl blur-xl opacity-50 transition duration-1000 group-hover:opacity-80"></div>

      <div className="relative glass rounded-3xl p-8 overflow-hidden z-10 transition-transform duration-500 hover:scale-[1.01]">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary mb-4 shadow-inner">
            <School size={28} />
          </div>
          <h2 className="text-3xl font-bold text-main tracking-tight">
            Espace Étudiant
          </h2>
          <p className="text-muted text-sm mt-2">Connectez-vous à votre plateforme</p>
        </div>
        
        <form onSubmit={login} className="space-y-4">
          
          {/* Université */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Université</label>
            <div className="relative group/select">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <School size={18} className="text-muted group-focus-within/select:text-primary transition-colors" />
              </div>
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-input-bg border border-border-main rounded-xl appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-main placeholder:text-muted hover:border-accent-border cursor-pointer transition-all"
                required
              >
                <option value="" disabled>-- Choisir votre université --</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Établissement (UFR / Faculté) */}
          <div className={`space-y-1.5 transition-all duration-500 ease-out overflow-hidden origin-top ${universityId ? "opacity-100 scale-y-100 max-h-24" : "opacity-0 scale-y-0 max-h-0"}`}>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Établissement (UFR / Faculté)</label>
            <div className="relative group/select">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Building2 size={18} className="text-muted group-focus-within/select:text-primary transition-colors" />
              </div>
              <select
                value={establishmentId}
                onChange={(e) => setEstablishmentId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-input-bg border border-border-main rounded-xl appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-main hover:border-accent-border cursor-pointer transition-all"
                required={!!selectedUniv?.establishments.length}
              >
                {selectedUniv?.establishments.map((est) => (
                  <option key={est.id} value={est.id}>{est.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Formation (Département) */}
          <div className={`space-y-1.5 transition-all duration-500 ease-out overflow-hidden origin-top ${establishmentId && selectedEstab?.formations && selectedEstab.formations.length > 0 ? "opacity-100 scale-y-100 max-h-24" : "opacity-0 scale-y-0 max-h-0"}`}>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Formation (Département)</label>
            <div className="relative group/select">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <GraduationCap size={18} className="text-muted group-focus-within/select:text-primary transition-colors" />
              </div>
              <select
                value={formationId}
                onChange={(e) => setFormationId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-input-bg border border-border-main rounded-xl appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-main hover:border-accent-border cursor-pointer transition-all"
                required={!!(selectedEstab?.formations && selectedEstab.formations.length > 0)}
              >
                {selectedEstab?.formations?.map((form) => (
                  <option key={form.id} value={form.id}>{form.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Année / Niveau */}
          <div className={`space-y-1.5 transition-all duration-500 ease-out overflow-hidden origin-top ${hasYears ? "opacity-100 scale-y-100 max-h-24" : "opacity-0 scale-y-0 max-h-0"}`}>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Année / Niveau</label>
            <div className="relative group/select">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <CalendarDays size={18} className="text-muted group-focus-within/select:text-primary transition-colors" />
              </div>
              <select
                value={yearId}
                onChange={(e) => setYearId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-input-bg border border-border-main rounded-xl appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-main hover:border-accent-border cursor-pointer transition-all"
                required={hasYears}
              >
                {selectedForm?.years?.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-border-main my-4" />

          {/* Identifiants */}
          <div className="space-y-1.5 flex gap-3">
            <div className="flex-1 relative group/input">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User size={18} className="text-muted group-focus-within/input:text-primary transition-colors" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Identifiant"
                className="w-full pl-11 pr-4 py-3 bg-input-bg border border-border-main rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-main placeholder:text-muted hover:border-accent-border transition-all"
                autoComplete="username"
                required
              />
            </div>

            <div className="flex-1 relative group/input">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock size={18} className="text-muted group-focus-within/input:text-primary transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full pl-11 pr-4 py-3 bg-input-bg border border-border-main rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-main placeholder:text-muted hover:border-accent-border transition-all"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success' || !isFormComplete}
              className={`relative w-full overflow-hidden flex items-center justify-center py-3.5 rounded-xl font-medium transition-all duration-500 
              ${status === 'success' 
                  ? 'bg-success text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-[1.03]' 
                  : status === 'error'
                  ? 'bg-danger text-white shadow-lg shadow-danger/30'
                  : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1'
              } disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed`}
            >
              {status === 'loading' && <Loader2 className="animate-spin mr-2" size={20} />}
              {status === 'success' && <CheckCircle2 className="animate-pulse mr-2" size={20} />}
              
              <span className="relative z-10 flex items-center">
                {status === 'loading' ? "Connexion..." 
                : status === 'success' ? "Connecté !" 
                : "Se connecter"}
                {status === 'idle' && <ChevronRight size={18} className="ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="animate-in slide-in-from-bottom-2 fade-in p-3 bg-danger/10 border border-danger/30 rounded-xl flex items-center text-sm">
              <span className="text-danger font-medium">{errorMsg}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
