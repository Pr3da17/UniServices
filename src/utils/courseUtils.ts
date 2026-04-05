import { 
  FileText, MessageSquare, Folder, Link, ClipboardList, HelpCircle, 
  FileArchive, Video, Image, FileAudio, File, Languages, 
  CheckSquare, MessageCircle, Book
} from 'lucide-react';

export const getActivityStyle = (type: string, name: string) => {
  const t = type.toLowerCase();
  const n = name.toLowerCase();

  if (n.endsWith('.pdf')) return { Icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10' };
  if (n.endsWith('.zip') || n.endsWith('.rar') || n.endsWith('.7z')) return { Icon: FileArchive, color: 'text-amber-600', bg: 'bg-amber-600/10' };
  if (n.endsWith('.mp4') || n.endsWith('.mov') || n.endsWith('.avi')) return { Icon: Video, color: 'text-blue-500', bg: 'bg-blue-500/10' };
  if (n.endsWith('.jpg') || n.endsWith('.png') || n.endsWith('.svg')) return { Icon: Image, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  if (n.endsWith('.mp3') || n.endsWith('.wav')) return { Icon: FileAudio, color: 'text-pink-500', bg: 'bg-pink-500/10' };

  switch (t) {
    case 'forum': return { Icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
    case 'folder': return { Icon: Folder, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    case 'url': return { Icon: Link, color: 'text-blue-400', bg: 'bg-blue-400/10' };
    case 'quiz': return { Icon: HelpCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' };
    case 'assign': return { Icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-600/10' };
    case 'page': return { Icon: FileText, color: 'text-sky-500', bg: 'bg-sky-500/10' };
    case 'book': return { Icon: Book, color: 'text-orange-500', bg: 'bg-orange-500/10' };
    case 'glossary': return { Icon: Languages, color: 'text-rose-500', bg: 'bg-rose-500/10' };
    case 'choice': return { Icon: CheckSquare, color: 'text-cyan-500', bg: 'bg-cyan-500/10' };
    case 'chat': return { Icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-500/10' };
    case 'feedback': return { Icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10' };
    case 'resource': return { Icon: File, color: 'text-muted', bg: 'bg-accent-bg' };
    default: return { Icon: FileText, color: 'text-muted', bg: 'bg-accent-bg' };
  }
};
