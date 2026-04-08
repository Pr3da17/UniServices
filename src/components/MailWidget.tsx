import { useEffect, useState, useCallback, useRef } from "react";
import { Mail, ExternalLink, Inbox, RotateCw, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import Widget from "./Widget";
import { Skeleton } from "./Skeleton";
import { getApiUrl } from "../utils/api";

interface ZimbraMail {
  id: string;
  subject: string;
  sender: string;
  date: string;
  unread: boolean;
  priority: string;
  preview: string;
}

interface MailWidgetProps {
  sessionId?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function MailWidget({ sessionId }: MailWidgetProps) {
  const [emails, setEmails] = useState<ZimbraMail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEmails = useCallback(async (isSilent = false) => {
    if (!sessionId) return;

    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    setError(null);

    try {
      const res = await fetch(getApiUrl(`/api/mail?sessionId=${sessionId}`));
      const data = await res.json();

      if (data.success) {
        setEmails(data.data);
      } else {
        if (data.reloginRequired) {
          setError("relogin");
        } else {
          setError(data.error || "Une erreur est survenue");
          setErrorDetails(data.details || null);
        }
        setEmails([]);
      }
    } catch (error) {
      console.error("Failed to fetch Zimbra emails:", error);
      setError("network");
      setEmails([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchEmails();

    // Auto-refresh every 5 minutes for performance
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(() => {
      fetchEmails(true);
    }, 5 * 60 * 1000);

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchEmails]);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
  };

  const handleZimbraAccess = () => {
    const zimbraService = "https://wmailetu.univ-artois.fr/";
    const jumpUrl = getApiUrl(`/api/auth/sso/jump?service=${encodeURIComponent(zimbraService)}&sessionId=${sessionId}`);
    window.open(jumpUrl, '_blank');
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || "??";
  };

  const unreadCount = emails.filter(e => e.unread).length;

  return (
    <Widget
      title="Emails"
      icon={Inbox}
      iconColor="text-indigo-400"
      headerAction={
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-bold text-indigo-400"
            >
              {unreadCount} nouveaux
            </motion.div>
          )}
          <button
            onClick={() => fetchEmails(true)}
            disabled={loading || refreshing}
            className={`p-1.5 rounded-xl hover:bg-accent-bg text-muted hover:text-primary transition-all duration-300 ${refreshing ? 'animate-spin' : ''}`}
            title="Rafraîchir"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="h-full flex flex-col min-h-[300px]">
        {loading ? (
          <div className="space-y-4 pt-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center space-x-4 px-1">
                <Skeleton className="w-10 h-10 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-1/3 rounded-full" />
                    <Skeleton className="h-2 w-8 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-3/4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error || emails.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-4"
          >
            <div className={`w-16 h-16 ${error === 'relogin' ? 'bg-amber-500/10' : 'bg-rose-500/10'} rounded-3xl flex items-center justify-center`}>
              {error === 'relogin' ? (
                <RefreshCw className="w-8 h-8 text-amber-500 animate-pulse" />
              ) : error ? (
                <AlertCircle className="w-8 h-8 text-rose-500" />
              ) : (
                <Mail className="w-8 h-8 text-indigo-400/50" />
              )}
            </div>

            <div className="px-6">
              <h4 className="text-sm font-bold text-main">
                {error === 'relogin' ? "Session expirée" : "Erreur de synchro"}
              </h4>
              <p className="text-[11px] text-muted mt-1.5 leading-relaxed max-w-[200px] mx-auto text-balance">
                {error === 'relogin'
                  ? "Votre accès Zimbra nécessite une nouvelle synchronisation via le dashboard."
                  : error === 'network'
                    ? "Impossible de contacter le serveur. Vérifiez votre connexion."
                    : (errorDetails || error || "Zimbra ne répond pas correctement.")}
              </p>
            </div>

            <button
              onClick={() => fetchEmails()}
              className="px-5 py-2.5 bg-accent-bg hover:bg-accent-border text-xs font-bold text-main rounded-2xl transition-all active:scale-95 border border-transparent hover:border-accent-border"
            >
              {error ? "Réessayer" : "Actualiser"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex-1 flex flex-col space-y-1"
          >
            {emails.slice(0, 5).map((mail) => (
              <motion.a
                key={mail.id}
                variants={itemVariants}
                href={getApiUrl(`/api/auth/sso/jump?service=${encodeURIComponent("https://wmailetu.univ-artois.fr/zimbra/mail#" + mail.id)}&sessionId=${sessionId}`)}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex items-center p-3 rounded-2xl transition-all duration-300 border ${mail.unread
                    ? 'bg-indigo-500/5 border-indigo-500/10 hover:bg-indigo-500/10 hover:border-indigo-500/20'
                    : 'bg-transparent border-transparent hover:bg-accent-bg'
                  }`}
              >
                <div className={`relative flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-[11px] font-black tracking-tighter ${mail.unread
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-muted/10 text-muted group-hover:bg-muted/20'
                  } transition-all duration-300 group-hover:rotate-3`}>
                  {getInitials(mail.sender)}
                  {mail.unread && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 border-2 border-card-bg rounded-full animate-pulse" />
                  )}
                </div>

                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] truncate uppercase tracking-wider ${mail.unread ? 'font-black text-indigo-400' : 'font-semibold text-muted'}`}>
                      {mail.sender}
                    </span>
                    <span className="text-[10px] text-muted/60 font-medium whitespace-nowrap">
                      {formatRelativeTime(mail.date)}
                    </span>
                  </div>
                  <h5 className={`text-xs truncate mt-0.5 leading-tight ${mail.unread ? 'text-main font-bold' : 'text-main/70 font-medium'}`}>
                    {mail.subject}
                  </h5>
                </div>

                <div className="ml-2 w-8 flex justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                </div>

                {mail.unread && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                )}
              </motion.a>
            ))}

            <div className="mt-auto pt-6 flex items-center justify-between border-t border-border-main/30">
              <div className="flex items-center space-x-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-medium text-muted/70 italic">
                  Synchro Artois OK
                </span>
              </div>
              <button
                onClick={handleZimbraAccess}
                className="group flex items-center px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[11px] font-bold transition-all duration-300 active:scale-95"
              >
                Accéder à Zimbra
                <ExternalLink className="w-3.5 h-3.5 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </Widget>
  );
}
