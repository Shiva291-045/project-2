import express from "express";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import * as resp from "../utils/apiResponse.js";

const router = express.Router();

// GET /api/leaderboard — top 100 users by XP (MongoDB, not Firebase)
router.get("/", protect, async (req, res) => {
  try {
    const { timeframe = "global" } = req.query;

    const users = await User.find({ isVerified: true })
      .sort({ xp: -1 })
      .limit(100)
      .select("name email avatar xp totalInterviews problemsSolved streak avgInterviewScore");

    const leaderboard = users.map((u, index) => ({
      rank: index + 1,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      xp: u.xp,
      totalInterviews: u.totalInterviews,
      problemsSolved: u.problemsSolved,
      streak: u.streak,
      avgScore: u.avgInterviewScore,
    }));

    return resp.success(res, { leaderboard, timeframe });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return resp.error(res, "Failed to fetch leaderboard.", 500);
  }
});

// GET /api/leaderboard/rank — current user's rank
router.get("/rank", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const userXP  = req.user.xp || 0;

    const [rank, total] = await Promise.all([
      User.countDocuments({ isVerified: true, xp: { $gt: userXP } }),
      User.countDocuments({ isVerified: true }),
    ]);

    return resp.success(res, {
      rank: rank + 1,
      xp: userXP,
      totalUsers: total,
    });
  } catch (err) {
    return resp.error(res, "Failed to fetch rank.", 500);
  }
});

export default router;
