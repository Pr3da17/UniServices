import { CheckCircle2, Circle, Clock, ChevronRight } from "lucide-react";
import type { TaskDocument } from "../database/db";
import { formatDate } from "../utils/date";
import { getMoodleProxyUrl } from "../utils/proxy";

interface TodoWidgetProps {
  urgences: TaskDocument[];
  loading: boolean;
  sessionId: string | null;
  onManageClick?: () => void;
}

export default function TodoWidget({ urgences, loading, sessionId, onManageClick }: TodoWidgetProps) {
  const tasks = urgences.slice(0, 4);

  return (
    <div className="group glass rounded-3xl p-6 hover:bg-card-hover transition-all duration-500 relative overflow-hidden flex flex-col h-full border border-border-main hover:border-danger/30">
      <div className="absolute top-0 right-0 w-32 h-32 bg-danger/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-danger/20 transition-colors duration-500"></div>
      
      <div className="relative z-10 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-danger/20 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-main">À Rendre</h3>
            <p className="text-xs text-muted">{urgences.length} devoirs en attente</p>
          </div>
        </div>
        <button 
          onClick={onManageClick}
          className="p-2 hover:bg-accent-bg rounded-xl transition-colors text-muted"
        >
           <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 relative z-10 space-y-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-5 h-5 rounded-full bg-white/5"></div>
              <div className="flex-1 h-4 bg-white/5 rounded w-3/4"></div>
            </div>
          ))
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <p className="text-sm font-medium mt-2">Tout est à jour !</p>
          </div>
        ) : (
          tasks.map((task) => {
            const isMoodle = task.type === 'moodle';
            const href = isMoodle ? getMoodleProxyUrl(task.url || '', sessionId) : '#';
            
            return (
              <a 
                key={task.id}
                href={href}
                target={isMoodle ? "_blank" : "_self"}
                rel={isMoodle ? "noopener noreferrer" : ""}
                onClick={(e) => {
                  if (!isMoodle && onManageClick) {
                    e.preventDefault();
                    onManageClick();
                  }
                }}
                className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group/item"
              >
                <div className="pt-0.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isMoodle ? 'border-danger/40 text-danger' : 'border-primary/40 text-primary'
                  }`}>
                    <Circle className="w-2.5 h-2.5 fill-current" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold truncate transition-colors ${
                    isMoodle ? 'group-hover/item:text-danger text-main' : 'group-hover/item:text-primary text-main'
                  }`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted font-medium truncate">{task.course || 'Personnel'}</span>
                    <span className="text-muted/40">•</span>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${
                      isMoodle ? 'text-danger' : 'text-primary'
                    }`}>
                      <Clock className="w-3 h-3" /> {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-border-main relative z-10">
        <button 
          onClick={onManageClick}
          className="w-full py-3 bg-danger/10 text-danger hover:bg-danger/20 rounded-2xl text-xs font-bold transition-all border border-danger/20"
        >
          Gérer tous les devoirs
        </button>
      </div>
    </div>
  );
}
