import { Router } from "express";
import { getAssignments, getCourses, getCatalog, getCourseContent, clearCache } from "../controllers/assignmentsController.js";

const router = Router();

router.get("/", getAssignments);
router.get("/courses", getCourses);
router.get("/catalog", getCatalog);
router.get("/course/:id", getCourseContent);
router.post("/clear-cache", clearCache);

export default router;
