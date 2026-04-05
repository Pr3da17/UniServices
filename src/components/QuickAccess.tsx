import { ExternalLink, Mail, GraduationCap, Calendar, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import axios from "axios";

interface QuickAccessProps {
  sessionId?: string | null;
}

const services = [
  {
    name: "Moodle",
    icon: GraduationCap,
    color: "from-orange-500/20 to-orange-600/20",
    textColor: "text-orange-500",
    borderColor: "border-orange-500/30",
    hoverBg: "hover:bg-orange-500/30",
    url: "https://moodle.univ-artois.fr/login/index.php?authCAS=CAS",
    description: "Cours & Devoirs"
  },
  {
    name: "Zimbra",
    icon: Mail,
    color: "from-blue-500/20 to-blue-600/20",
    textColor: "text-blue-500",
    borderColor: "border-blue-500/30",
    hoverBg: "hover:bg-blue-500/30",
    url: "https://wmailetu.univ-artois.fr/",
    description: "Messagerie étudiante"
  },
  {
    name: "ENT Artois",
    icon: Monitor,
    color: "from-emerald-500/20 to-emerald-600/20",
    textColor: "text-emerald-500",
    borderColor: "border-emerald-500/30",
    hoverBg: "hover:bg-emerald-500/30",
    url: "https://ent.univ-artois.fr/uPortal/Login",
    description: "Portail Services"
  },
  {
    name: "ADE Planning",
    icon: Calendar,
    color: "from-purple-500/20 to-purple-600/20",
    textColor: "text-purple-500",
    borderColor: "border-purple-500/30",
    hoverBg: "hover:bg-purple-500/30",
    url: "https://ade-consult.univ-artois.fr/direct/index.jsp",
    description: "Emploi du temps"
  }
];

export default function QuickAccess({ sessionId }: QuickAccessProps) {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  useEffect(() => {
    if (!sessionId) return;
    // Warm up the high-speed CAS cache in the backend
    // This logs into CAS and stores the TGC cookie on the server.
    axios.get(`${baseUrl}/api/auth/sso/warm-cache?sessionId=${sessionId}`)
      .catch(err => console.error("SSO Warmup failed:", err));
  }, [sessionId, baseUrl]);

  if (!sessionId) return null;

  const handleSsoJump = (serviceUrl: string) => {
    // We use the ultra-fast jump gate. It assumes the cache is warm and
    // responds with a direct ST redirect in ~50ms.
    const jumpUrl = `${baseUrl}/api/auth/sso/jump?service=${encodeURIComponent(serviceUrl)}&sessionId=${sessionId}`;
    window.open(jumpUrl, '_blank');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {services.map((service, index) => (
        <motion.button
          key={service.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          onClick={() => handleSsoJump(service.url)}
          className={`group relative text-left overflow-hidden p-5 rounded-2xl border ${service.borderColor} bg-gradient-to-br ${service.color} ${service.hoverBg} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm`}
        >
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl bg-white/10 dark:bg-black/20 ${service.textColor} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
              <service.icon className="w-6 h-6" />
            </div>
            <ExternalLink className={`w-4 h-4 ${service.textColor} opacity-20 group-hover:opacity-100 transition-all duration-300 -translate-y-1 translate-x-1`} />
          </div>
          
          <div className="mt-4">
            <h4 className={`text-sm font-black tracking-tight ${service.textColor} uppercase`}>
              {service.name}
            </h4>
            <p className="text-[11px] text-muted-foreground/80 mt-1 font-medium leading-tight">
              {service.description}
            </p>
          </div>

          {/* Decorative glow */}
          <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-current ${service.textColor}`} />
        </motion.button>
      ))}
    </div>
  );
}
