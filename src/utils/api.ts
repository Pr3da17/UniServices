const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

/**
 * Génère une URL API propre en évitant les doubles slashes 
 * et les répétitions de "/api".
 */
export const getApiUrl = (path: string): string => {
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Éviter de doubler le "/api" si VITE_BACKEND_URL se termine déjà par "/api"
  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api')) {
    return cleanBase + cleanPath.slice(4);
  }
  
  return cleanBase + cleanPath;
};

export const BACKEND_URL = BASE_URL;
