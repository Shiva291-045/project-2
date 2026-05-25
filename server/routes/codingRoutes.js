import express from "express";
import { markSolved, getSolved } from "../controllers/codingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.post("/solved",   protect, markSolved);
router.get("/solved",    protect, getSolved);
export default router;
