import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Import Backend Routes from compiled dist
// Note: We avoid importing the full backend server.js to prevent it from starting its own listener
import authRoutes from './backend/dist/routes/auth.js';
import ssoSyncRoutes from './backend/dist/routes/ssoSync.js';
import assignmentsRoutes from './backend/dist/routes/assignments.js';
import timetableRoutes from './backend/dist/routes/timetable.js';
import libraryRoutes from './backend/dist/routes/library.js';
import mailRoutes from './backend/dist/routes/mail.js';
import proxyRoutes from './backend/dist/routes/moodleProxy.js';
import crousRoutes from './backend/dist/routes/crous.js';
import { errorHandler } from './backend/dist/middlewares/errorHandler.js';
import { generalLimiter } from './backend/dist/middlewares/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for easier dev/prod transition if needed
}));

app.use(cors());
app.use(express.json());
app.use(generalLimiter);

// --- API ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/auth/sso", ssoSyncRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/crous", crousRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok", mode: "unified", puppeteer: false });
});

// --- FRONTEND SERVING ---
// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 UniServices Unified Server (Puppeteer-Free)`);
    console.log(`📡 Serving Frontend from /dist`);
    console.log(`🔌 API available at /api`);
    console.log(`🌍 Listening on port ${PORT}`);
});
