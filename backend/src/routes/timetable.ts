import { Router } from "express";
import { getTimetable, searchTimetableResources, getTimetableTree } from "../controllers/timetableController.js";

const router = Router();

// GET /api/timetable?resources=...&sessionId=...
router.get("/", getTimetable);

// GET /api/timetable/tree?parentId=...
router.get("/tree", getTimetableTree);

// GET /api/timetable/search?q=...&sessionId=...
router.get("/search", searchTimetableResources);

export default router;
