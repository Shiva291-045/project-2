import express from "express";
import { saveInterview, getHistory, getInterview, aiProxy, getCompanies } from "../controllers/interviewController.js";
import { startSession, submitAnswer, endSession, getSession } from "../controllers/interviewSessionController.js";
import { protect } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
router.post("/save",    protect,              saveInterview);
router.get("/history",  protect,              getHistory);
router.post("/ai",      protect, apiLimiter,  aiProxy);      // ← legacy AI proxy (kept for backward compat)
router.get("/companies", protect,             getCompanies); // ← must come before /:id

// Stateful session-based interview (server owns all state/history)
router.post("/session/start",       protect, apiLimiter, startSession);
router.post("/session/:id/answer",  protect, apiLimiter, submitAnswer);
router.post("/session/:id/end",     protect, apiLimiter, endSession);
router.get ("/session/:id",         protect,             getSession);

router.get("/:id",      protect,              getInterview);
export default router;
