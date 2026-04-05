// Session storage for authenticated users
export interface UserSession {
  userId: string;
  username: string;
  cookies: string; // Raw cookie header
  loginTime: number;
  lastActivityTime: number;
  moodleSessionId: string; // MoodleSession cookie value
  sessionId?: string;
  password?: string; // Stored for SSO-hopping
  zimbraCookies?: string[]; // Stored for persistent email access
  zimbraLastAuth?: number; // Timestamp of last successful Zimbra auth
  adeCookies?: string[]; // Stored for persistent timetable access
  adeTimetableCache?: {
    resources: string;
    data: any[];
    timestamp: number;
  };
}

// Scraped assignment data
export interface Assignment {
  id: string;
  title: string;
  course: string;
  courseId: string;
  dueDate: string; // ISO date string
  priority: "high" | "medium" | "low";
  submissionStatus: "not_submitted" | "submitted" | "graded";
  url: string;
}

// Scraped course data
export interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  url: string;
}

export interface CourseActivity {
  id: string;
  name: string;
  type: string;
  url: string;
  iconUrl?: string;
  description?: string;
}

export interface CourseSection {
  id: string;
  name: string;
  summary?: string;
  activities: CourseActivity[];
}

export interface CourseContent {
  courseId: string;
  sections: CourseSection[];
}

// Login request body
export interface LoginRequest {
  username: string;
  password: string;
}

// Login response
export interface LoginResponse {
  success: boolean;
  userId: string;
  username: string;
  sessionId: string;
  message?: string;
}

// API Error response
export interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: number;
}
