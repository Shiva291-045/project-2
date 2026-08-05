import express from "express";
import { getAnalytics, getStreak } from "../controllers/analyticsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.get("/",       protect, getAnalytics);
router.get("/streak", protect, getStreak);
export default router;
