import axios from "axios";

// Backend configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Types
export type Assignment = {
  id: string;
  title: string;
  course: string;
  courseId: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  submissionStatus: "not_submitted" | "submitted" | "graded";
  url: string;
};

export type Course = {
  id: string;
  name: string;
  code: string;
  instructor: string;
  url: string;
};

export type LoginType = {
  sessionId: string;
  userId: string;
  username: string;
  favoriteCourses?: string[];
  hiddenCourses?: string[];
  success?: boolean;
};

/**
 * LOGIN TO MOODLE VIA BACKEND PROXY
 * Credentials sent to Express backend (NOT to Moodle directly)
 * Backend handles login, extracts cookies, returns sessionId
 */
export async function loginMoodle(
  username: string,
  password: string,
): Promise<LoginType> {
  if (!username || !password) {
    throw new Error("Identifiant et mot de passe requis.");
  }

  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: username.trim(),
      password: password.trim(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || "Erreur d'authentification");
    }

    return {
      sessionId: response.data.sessionId,
      userId: response.data.userId,
      username: response.data.username,
    };
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(
      error.response?.data?.details || error.message || "Erreur de connexion",
    );
  }
}

/**
 * FETCH ASSIGNMENTS FROM MOODLE VIA BACKEND PROXY
 * Backend scrapes Moodle, extracts assignments from HTML, returns JSON
 */
export async function getUpcomingAssignments(
  sessionId: string,
): Promise<Assignment[]> {
  if (!sessionId) {
    throw new Error("Session invalide.");
  }

  try {
    const response = await axios.get(`${BACKEND_URL}/api/assignments`, {
      params: { sessionId },
    });

    if (!response.data.success) {
      throw new Error(response.data.error || "Erreur lors de la récupération");
    }

    return response.data.data || [];
  } catch (error: any) {
    console.error("Fetch assignments error:", error);

    if (error.response?.status === 401) {
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    throw new Error(
      error.response?.data?.details || "Impossible de récupérer les devoirs",
    );
  }
}

/**
 * CONFIRM SESSION VALIDITY
 */
export async function verifySession(sessionId: string): Promise<boolean> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/verify`, {
      params: { sessionId },
    });
    return response.data.valid === true;
  } catch {
    return false;
  }
}

/**
 * FETCH COURSES FROM MOODLE VIA BACKEND PROXY
 */
export async function getCourses(sessionId: string): Promise<Course[]> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/assignments/courses`, {
      params: { sessionId },
    });
    if (!response.data.success) {
      throw new Error(response.data.error || "Erreur de récupération");
    }
    return response.data.data || [];
  } catch (error: any) {
    if (error.response?.status !== 401) {
       console.error("Fetch courses error:", error);
    }
    return [];
  }
}

/**
 * FETCH CATALOG FROM MOODLE VIA BACKEND PROXY
 */
export async function getCatalog(sessionId: string, categoryId: string): Promise<Course[]> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/assignments/catalog`, {
      params: { sessionId, categoryId },
    });
    if (!response.data.success) {
      throw new Error(response.data.error || "Erreur de récupération");
    }
    return response.data.data || [];
  } catch (error: any) {
    if (error.response?.status !== 401) {
       console.error("Fetch catalog error:", error);
    }
    return [];
  }
}

/**
 * FETCH COURSE CONTENT FROM MOODLE VIA BACKEND PROXY
 */
export async function getCourseContent(
  sessionId: string, 
  courseId: string, 
  forceRefresh: boolean = false
): Promise<{ success: boolean; data: any }> {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/assignments/course/${courseId}`, {
      params: { sessionId, forceRefresh },
    });
    return response.data;
  } catch (error: any) {
    console.error("Fetch course content error:", error);
    return { success: false, data: null };
  }
}

/**
 * LOGOUT (clear server-side session)
 */
export async function logoutMoodle(sessionId: string): Promise<void> {
  try {
    if (sessionId) {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, { sessionId });
    }
  } catch (error) {
    console.warn("Logout error:", error);
  }
}
