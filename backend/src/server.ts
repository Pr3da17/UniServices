import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import ssoSyncRoutes from "./routes/ssoSync.js";
import assignmentsRoutes from "./routes/assignments.js";
import timetableRoutes from "./routes/timetable.js";
import libraryRoutes from "./routes/library.js";
import mailRoutes from "./routes/mail.js";
import proxyRoutes from "./routes/moodleProxy.js";
import crousRoutes from "./routes/crous.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { generalLimiter } from "./middlewares/rateLimiter.js";

import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;
const MOODLE_BASE_URL =
  process.env.MOODLE_BASE_URL || "https://moodle.univ-artois.fr";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

// Determine static files path
const possiblePaths = [
  process.env.STATIC_FILES_PATH,
  path.join(__dirname, "../frontend-site"),
  path.join(__dirname, "../../dist"),
  path.join(__dirname, "../../"), // Case for Infomaniak root deployment (frontend at root)
  path.join(__dirname, "../public")
].filter(Boolean) as string[];

let distPath = possiblePaths[0];
for (const p of possiblePaths) {
  if (fs.existsSync(p) && fs.readdirSync(p).includes("index.html")) {
    distPath = p;
    break;
  }
}

console.log(`📂 Static files path: ${distPath}`);

// Security & Parsing Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Global Rate Limiting
app.use(generalLimiter);

// Routes
app.use("/api/auth", authRoutes); // authRoutes now handles both auth and sso
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/crous", crousRoutes);

// Static frontend serving
app.use(express.static(distPath));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", moodleUrl: MOODLE_BASE_URL });
});

// Catch-all for React Router navigation
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Route API non trouvée" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎓 Moodle Scraper Backend running on http://localhost:${PORT}`);
  console.log(`📚 Scraping from: ${MOODLE_BASE_URL}`);
  console.log(`🔒 Security enabled: Helmet, Rate Limiter, Zod Validation`);
});
