import { format, isWithinInterval, isPast as isPastDate } from "date-fns";
import { MapPin, Clock } from "lucide-react";

interface TimelineEvent {
  id: string;
  title: string;
  location: string;
  start: string;
  end: string;
  color: string;
}

interface TimelineVerticalProps {
  events: TimelineEvent[];
}

export default function TimelineVertical({ events }: TimelineVerticalProps) {
  const now = new Date();

  if (events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="relative pl-8 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border-main">
      {sortedEvents.map((event, idx) => {
        const end = new Date(event.end);
        
        const nextEvent = sortedEvents[idx + 1];
        let pauseElement = null;
        
        if (nextEvent) {
          const nextStart = new Date(nextEvent.start);
          const diffMs = nextStart.getTime() - end.getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          
          if (diffMins >= 10) {
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            const pauseLabel = hours > 0 ? `${hours}H ${mins > 0 ? mins : ''}` : `${mins} MIN`;
            
            pauseElement = (
              <div key={`pause-${event.id}`} className="relative py-2 -ml-8 flex items-center gap-4 group/pause animate-in fade-in duration-700">
                 <div className="absolute left-[27px] top-0 bottom-0 w-[2px] border-l-2 border-dashed border-border-main/30 group-hover/pause:border-primary/20 transition-colors"></div>
                 <div className="relative z-10 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-dashed border-border-main/50 bg-app-bg flex items-center justify-center group-hover/pause:border-primary/30 transition-colors">
                       <div className="w-1 h-1 rounded-full bg-muted/20 group-hover/pause:bg-primary/40"></div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted/40 bg-app-bg/80 backdrop-blur px-2 py-0.5 rounded-md border border-border-main/50 group-hover/pause:text-primary/50 group-hover/pause:border-primary/20 transition-all">
                      PAUSE • {pauseLabel}
                    </span>
                 </div>
              </div>
            );
          }
        }

        return (
          <div key={event.id}>
            <TimelineItem event={event} idx={idx} now={now} />
            {pauseElement}
          </div>
        );
      })}
    </div>
  );
}

function TimelineItem({ event, idx, now }: { event: TimelineEvent; idx: number; now: Date }) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const isNow = isWithinInterval(now, { start, end });
  const isFinished = isPastDate(end);

  return (
    <div className="relative group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
      {/* Dot on timeline */}
      <div className={`absolute -left-[30px] top-1.5 w-5 h-5 rounded-full border-4 bg-app-bg z-10 transition-all duration-500 ${isNow ? 'border-primary scale-125 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : isFinished ? 'border-muted' : 'border-muted/50 group-hover:border-primary/50'}`}>
        {isNow && <div className="absolute inset-0 rounded-full animate-ping bg-primary/40 -z-10"></div>}
      </div>

      <div className={`glass p-4 rounded-3xl transition-all duration-500 border ring-1 ring-border-main ${isNow ? 'border-primary/30 bg-primary/5 shadow-lg shadow-primary/5' : 'border-border-main hover:border-primary/20 hover:bg-card-hover'}`}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 overflow-hidden">
              {isNow && (
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shrink-0"></span>
              )}
              <h4 className="font-bold text-sm text-main group-hover:text-primary transition-colors truncate">
                {event.title}
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted font-medium font-mono uppercase tracking-tight">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(start, 'HH:mm')} - {format(end, 'HH:mm')}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
            </div>
          </div>
          
          {isNow && (
             <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">En cours</span>
          )}
           {!isNow && isFinished && (
             <span className="px-2 py-0.5 rounded-full bg-accent-bg text-muted text-[9px] font-black uppercase tracking-widest">Terminé</span>
          )}
        </div>
        
        {/* Progress bar for ongoing class */}
        {isNow && (
          <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000"
              style={{ 
                width: `${Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100))}%` 
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
