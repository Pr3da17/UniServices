import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export interface TimetableEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string; // ISO String or Date
  end: string;   // ISO String or Date
  color: string;
}

// In-memory cache for fast switching
const MEMORY_CACHE = new Map<string, { data: TimetableEvent[], timestamp: number }>();
const CACHE_KEY_PREFIX = "ade_cache_";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const fetchTimetable = async (resources: string, sessionId?: string, force: boolean = false): Promise<TimetableEvent[]> => {
  const now = Date.now();

  // 1. Check Memory Cache (vitesse instantanée)
  if (!force) {
    const memCached = MEMORY_CACHE.get(resources);
    if (memCached && (now - memCached.timestamp < CACHE_TTL)) {
      console.log(`⚡ [TIMETABLE] Cache Hit (Memory): ${resources}`);
      return memCached.data;
    }
  }

  // 2. Check LocalStorage Cache (persistance rechargement page)
  if (!force) {
    try {
      const localCached = localStorage.getItem(`${CACHE_KEY_PREFIX}${resources}`);
      if (localCached) {
        const { data, timestamp } = JSON.parse(localCached);
        if (now - timestamp < CACHE_TTL) {
          console.log(`⚡ [TIMETABLE] Cache Hit (Storage): ${resources}`);
          MEMORY_CACHE.set(resources, { data, timestamp });
          return data;
        }
      }
    } catch (e) {
      console.warn("Storage cache error:", e);
    }
  }

  try {
    const response = await axios.get(`${BACKEND_URL}/api/timetable`, {
      params: { resources, sessionId }
    });
    
    const events = response.data;
    
    // Save to Cache
    MEMORY_CACHE.set(resources, { data: events, timestamp: now });
    try {
      localStorage.setItem(`${CACHE_KEY_PREFIX}${resources}`, JSON.stringify({ data: events, timestamp: now }));
    } catch (e) {}

    return events;
  } catch (error) {
    console.error("Error fetching timetable:", error);
    
    // Fallback on expired cache if network fails
    const expired = localStorage.getItem(`${CACHE_KEY_PREFIX}${resources}`);
    if (expired) {
        return JSON.parse(expired).data;
    }

    throw error;
  }
};

// Récupérer l'arborescence (4 niveaux)
export const fetchTimetableTree = async (parentId?: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/timetable/tree`, {
      params: { parentId }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching timetable tree:", error);
    return [];
  }
};

// Real searching via backend
export const searchResources = async (query: string, sessionId?: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/timetable/search`, {
      params: { q: query, sessionId }
    });
    return response.data;
  } catch (error) {
    console.error("Error searching resources:", error);
    return [];
  }
};
