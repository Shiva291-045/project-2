import express from "express";
import { getAnalytics, getStreak, getReadinessScore } from "../controllers/analyticsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.get("/",           protect, getAnalytics);
router.get("/streak",     protect, getStreak);
router.get("/readiness",  protect, getReadinessScore);
export default router;
