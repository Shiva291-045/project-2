import express from "express";
import { saveInterview, getHistory, getInterview } from "../controllers/interviewController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.post("/save",     protect, saveInterview);
router.get("/history",   protect, getHistory);
router.get("/:id",       protect, getInterview);
export default router;
