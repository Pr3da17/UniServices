import { createRxDatabase, addRxPlugin } from 'rxdb';
import type { RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';

// Register plugins
addRxPlugin(RxDBMigrationSchemaPlugin);

export type SessionDocument = {
  id: string; // usually 'current'
  token: string;
  username: string;
  universityId?: string;
  establishmentId?: string;
  formationId?: string;
  yearId?: string;
  favoriteCourses?: string[];
  hiddenCourses?: string[];
};

export type CourseContentDocument = {
  courseId: string;
  sections: any[];
  lastUpdated: number;
};

export type TaskDocument = {
  id: string;
  title: string;
  course?: string;
  dueDate: string;
  completed: boolean;
  type: 'moodle' | 'manual';
  url?: string;
  notes?: string;
  createdAt: number;
};

export type DatabaseCollections = {
  sessions: RxCollection<SessionDocument>;
  course_contents: RxCollection<CourseContentDocument>;
  tasks: RxCollection<TaskDocument>;
};

export type MyDatabase = RxDatabase<DatabaseCollections>;

const sessionSchema = {
  title: 'session schema',
  version: 0,
  description: 'Stores the current user session token',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    token: { type: 'string' },
    username: { type: 'string' },
    universityId: { type: 'string' },
    establishmentId: { type: 'string' },
    formationId: { type: 'string' },
    yearId: { type: 'string' },
    favoriteCourses: { type: 'array', items: { type: 'string' } },
    hiddenCourses: { type: 'array', items: { type: 'string' } }
  },
  required: ['id', 'token', 'username']
} as const;

const courseContentSchema = {
  title: 'course content schema',
  version: 0,
  description: 'Stores detailed course contents like sections and documents',
  primaryKey: 'courseId',
  type: 'object',
  properties: {
    courseId: { type: 'string', maxLength: 100 },
    sections: { type: 'array', items: { type: 'object' } },
    lastUpdated: { type: 'number' }
  },
  required: ['courseId', 'sections', 'lastUpdated']
} as const;

const taskSchema = {
  title: 'task schema',
  version: 1,
  description: 'Stores user-created and tracked tasks',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    title: { type: 'string' },
    course: { type: 'string' },
    dueDate: { type: 'string' },
    completed: { type: 'boolean' },
    type: { type: 'string' },
    url: { type: 'string' },
    notes: { type: 'string' },
    createdAt: { type: 'number' }
  },
  required: ['id', 'title', 'dueDate', 'completed', 'type', 'createdAt']
} as const;

let dbPromise: Promise<MyDatabase> | null = null;

export const initDb = async (): Promise<MyDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    console.log("🛠️ DB: Initializing RxDB v7...");
    const db = await createRxDatabase<DatabaseCollections>({
      name: 'moodledb_v7',
      storage: getRxStorageDexie()
    });

    console.log("🛠️ DB: Collections added.");
    await db.addCollections({
      sessions: { schema: sessionSchema },
      course_contents: { schema: courseContentSchema },
      tasks: { 
        schema: taskSchema,
        migrationStrategies: {
          1: (oldDoc) => oldDoc // Simple identity migration for notes field
        }
      }
    });

    console.log("🛠️ DB: Ready!");
    return db;
  })();

  return dbPromise;
};

export const saveSession = async (data: { token: string; username: string; universityId?: string; establishmentId?: string; formationId?: string; yearId?: string; favoriteCourses?: string[]; hiddenCourses?: string[] }) => {
  const db = await initDb();
  await db.sessions.upsert({ id: 'current', ...data });
};

export const updateFavorites = async (favoriteIds: string[]) => {
  const db = await initDb();
  const session = await db.sessions.findOne('current').exec();
  if (session) {
    await session.incrementalPatch({ favoriteCourses: favoriteIds });
  }
};

export const updateHiddenStatus = async (hiddenIds: string[]) => {
  const db = await initDb();
  const session = await db.sessions.findOne('current').exec();
  if (session) {
    await session.incrementalPatch({ hiddenCourses: hiddenIds });
  }
};

export const saveCourseContent = async (courseId: string, sections: any[]) => {
  const db = await initDb();
  await db.course_contents.upsert({
    courseId,
    sections,
    lastUpdated: Date.now()
  });
};

export const getCachedCourseContent = async (courseId: string): Promise<any[] | null> => {
  const db = await initDb();
  const doc = await db.course_contents.findOne(courseId).exec();
  if (!doc) return null;
  // If older than 1 hour, consider it stale (but we can still return it and fetch fresh in background)
  return doc.sections;
};

export const getStoredSession = async (): Promise<SessionDocument | null> => {
  const db = await initDb();
  const session = await db.sessions.findOne('current').exec();
  if (!session) return null;
  const data = session.toJSON();
  return {
    ...data,
    favoriteCourses: data.favoriteCourses ? [...data.favoriteCourses] : [],
    hiddenCourses: data.hiddenCourses ? [...data.hiddenCourses] : []
  } as SessionDocument;
};

export const clearSession = async () => {
  const db = await initDb();
  await db.sessions.findOne('current').remove();
};

// Task functions
export const saveTask = async (task: TaskDocument) => {
  const db = await initDb();
  await db.tasks.upsert(task);
};

export const getTasks = async (): Promise<TaskDocument[]> => {
  const db = await initDb();
  const docs = await db.tasks.find().exec();
  return docs.map(d => d.toJSON()) as TaskDocument[];
};

export const deleteTask = async (id: string) => {
  const db = await initDb();
  await db.tasks.findOne(id).remove();
};

export const toggleTask = async (id: string, completed: boolean) => {
  const db = await initDb();
  const task = await db.tasks.findOne(id).exec();
  if (task) {
    await task.incrementalPatch({ completed });
  }
};

export const updateTask = async (id: string, updates: Partial<TaskDocument>) => {
  const db = await initDb();
  const task = await db.tasks.findOne(id).exec();
  if (task) {
    await task.incrementalPatch(updates);
  }
};
