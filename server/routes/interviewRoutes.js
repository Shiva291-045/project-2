import express from "express";
import { saveInterview, getHistory, getInterview, aiProxy } from "../controllers/interviewController.js";
import { protect } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
router.post("/save",    protect,              saveInterview);
router.get("/history",  protect,              getHistory);
router.post("/ai",      protect, apiLimiter,  aiProxy);      // ← secure AI proxy
router.get("/:id",      protect,              getInterview);
export default router;
