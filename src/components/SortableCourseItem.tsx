import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Star, Eye, EyeOff } from 'lucide-react';
import type { Course } from '../services/moodleService';

interface SortableCourseItemProps {
  course: Course;
  isSelected: boolean;
  isFavorite: boolean;
  isHidden: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function SortableCourseItem({ course, isSelected, isFavorite, isHidden, onSelect, onToggleFavorite, onToggleVisibility }: SortableCourseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.id, disabled: !isFavorite });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group flex items-center gap-2 p-1 ${isDragging ? "opacity-50" : ""}`}
    >
      <button
        onClick={() => onSelect(course.id)}
        {...(isFavorite ? listeners : {})}
        {...(isFavorite ? attributes : {})}
        className={`flex-1 text-left p-4 rounded-2xl transition-all duration-300 border ${
          isSelected 
          ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/10" 
          : "bg-card-bg border-border-main hover:bg-card-hover"
        } ${isHidden ? 'opacity-40 grayscale-[0.5]' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 px-2 py-0.5 bg-primary/10 rounded-md">
            {course.code}
          </span>
          {isFavorite && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
          )}
        </div>
        <h3 className="font-semibold line-clamp-2 leading-tight text-main">{course.name}</h3>
      </button>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(course.id); }}
          className={`p-1.5 rounded-lg transition-all ${isFavorite ? 'bg-yellow-500/20 text-yellow-500' : 'bg-black/50 text-muted hover:text-white'}`}
        >
          <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(course.id); }}
          className={`p-1.5 rounded-lg transition-all ${isHidden ? 'bg-red-500/20 text-red-500' : 'bg-black/50 text-muted hover:text-white'}`}
        >
          {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}
