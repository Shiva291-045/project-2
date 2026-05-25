import express from "express";
import { analyzeResume, getResumeHistory } from "../controllers/resumeController.js";
import { protect } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
router.post("/analyze",  protect, apiLimiter, analyzeResume);
router.get("/history",   protect, getResumeHistory);
export default router;
