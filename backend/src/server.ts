import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import authRoutes from "./routes/auth";
import ssoSyncRoutes from "./routes/ssoSync";
import assignmentsRoutes from "./routes/assignments";
import timetableRoutes from "./routes/timetable";
import libraryRoutes from "./routes/library";
import mailRoutes from "./routes/mail";
import proxyRoutes from "./routes/moodleProxy";
import crousRoutes from "./routes/crous";
import { errorHandler } from "./middlewares/errorHandler";
import { generalLimiter } from "./middlewares/rateLimiter";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MOODLE_BASE_URL =
  process.env.MOODLE_BASE_URL || "https://moodle.univ-artois.fr";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

// Security & Parsing Middleware
app.use(helmet());
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
app.use("/api/auth", authRoutes);
app.use("/api/auth/sso", ssoSyncRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/crous", crousRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", moodleUrl: MOODLE_BASE_URL });
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎓 Moodle Scraper Backend running on http://localhost:${PORT}`);
  console.log(`📚 Scraping from: ${MOODLE_BASE_URL}`);
  console.log(`🔒 Security enabled: Helmet, Rate Limiter, Zod Validation`);
});
