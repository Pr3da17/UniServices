import { useState } from "react";
import { Clock, Send, AlertCircle, Calendar, ChevronDown } from "lucide-react";
import type { Assignment } from "../services/moodleService";
import { formatDate } from "../utils/date";
import { Skeleton } from "./Skeleton";

interface UrgencyListProps {
  urgences: Assignment[];
  loading: boolean;
  error: string | null;
  sessionId: string | null;
}

import { getMoodleProxyUrl } from "../utils/proxy";

export default function UrgencyList({ urgences, loading, error, sessionId }: UrgencyListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      <div 
        className="flex items-center justify-between mb-8 cursor-pointer group/title"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-danger/20 rounded-xl relative group-hover/title:scale-110 transition-transform duration-300">
            <Clock className="w-6 h-6 text-danger relative z-10" />
            <div className={`absolute inset-0 bg-danger/30 rounded-xl animate-ping opacity-75 ${!isExpanded && 'hidden'}`}></div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight group-hover:title:text-danger/90 transition-colors">
            Timeline des Devoirs
          </h2>
        </div>
        <div className={`p-2 rounded-full hover:bg-accent-bg transition-all duration-500 ${!isExpanded ? '-rotate-90' : 'rotate-0'}`}>
          <ChevronDown className="w-6 h-6 text-muted" />
        </div>
      </div>

      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
        <div className="overflow-hidden pb-4">

      {loading && (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border-main dark:before:via-zinc-800 before:to-transparent">
          {[1, 2, 3].map(i => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mt-8">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-border-main bg-accent-bg shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <Skeleton className="w-full h-full rounded-full" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-3xl glass">
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-2xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm opacity-80 leading-relaxed">{error}</p>
        </div>
      )}

      {!loading && !error && urgences.length === 0 && (
        <div className="text-center py-12 glass rounded-3xl">
          <Calendar className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-main">Aucun devoir urgent</h3>
          <p className="text-muted text-sm mt-1">Vous êtes à jour dans vos rendus !</p>
        </div>
      )}

      {/* TIMELINE ARCHITECTURE */}
      {!loading && urgences.length > 0 && (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-danger/50 before:via-border-main dark:before:via-zinc-800 before:to-transparent">
          {urgences.map((urgence) => {
            const isHigh = urgence.priority === "high";
            const isMedium = urgence.priority === "medium";
            
            return (
              <div key={urgence.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                
                {/* Timeline Dot */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-app-bg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg transition-transform duration-500 group-hover:scale-125
                  ${isHigh ? "bg-danger" : isMedium ? "bg-yellow-500" : "bg-success"}
                `}>
                  {isHigh && <div className="absolute inset-0 rounded-full border border-danger animate-ping opacity-75"></div>}
                  <Clock className="w-4 h-4 text-white" />
                </div>
                
                {/* Timeline Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass rounded-3xl p-6 hover:shadow-2xl hover:bg-card-hover hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-[10px] uppercase tracking-wider font-bold mb-2 inline-block px-2.5 py-1 rounded-md
                        ${isHigh ? "bg-danger/10 text-danger" : isMedium ? "bg-yellow-500/10 text-yellow-500" : "bg-success/10 text-success"}
                      `}>
                        {urgence.course}
                      </span>
                      <h3 className="font-semibold text-lg leading-tight mb-2 text-main">
                        {urgence.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-main">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-0.5">Échéance</span>
                      <span className={`text-sm font-medium ${isHigh ? "text-danger" : "text-muted"}`}>
                        {formatDate(urgence.dueDate)}
                      </span>
                    </div>

                    <a 
                      href={getMoodleProxyUrl(urgence.url, sessionId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 shadow-md hover:-translate-y-0.5
                      ${isHigh 
                        ? 'bg-danger hover:bg-danger/90 text-white shadow-danger/20 hover:shadow-danger/40' 
                        : 'bg-primary hover:bg-primary-hover text-white shadow-primary/20 hover:shadow-primary/40'}
                    `}>
                      <Send className="w-4 h-4 transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                      <span className="font-medium text-sm">Rendre</span>
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
        </div>
      </div>
    </section>
  );
}
