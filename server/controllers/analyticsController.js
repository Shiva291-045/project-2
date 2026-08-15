import Interview from "../models/Interview.js";
import SolvedProblem from "../models/SolvedProblem.js";
import User from "../models/User.js";
import * as resp from "../utils/apiResponse.js";
import { getStreakCalendar } from "../utils/streakService.js";
import { getReadiness } from "../utils/readinessService.js";

export const getAnalytics = async (req, res) => {
  try {
    const uid = req.user._id;

    const [interviews, solvedCount, user] = await Promise.all([
      Interview.find({ userId: uid }).sort({ createdAt: -1 }).limit(20).select("-transcript"),
      SolvedProblem.countDocuments({ userId: uid }),
      User.findById(uid),
    ]);

    // scores[] are stored as 0–10; multiply by 10 to get 0–100 percentage
    const scores = interviews.flatMap((i) => i.scores || []);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10)
      : 0;

    const modeBreakdown = interviews.reduce((acc, i) => {
      acc[i.mode] = (acc[i.mode] || 0) + 1; return acc;
    }, {});

    const diffBreakdown = interviews.reduce((acc, i) => {
      acc[i.difficulty] = (acc[i.difficulty] || 0) + 1; return acc;
    }, {});

    return resp.success(res, {
      totalInterviews: interviews.length,
      avgScore,
      solvedProblems: solvedCount,
      streak: user?.streak || 0,
      xp: user?.xp || 0,
      modeBreakdown,
      diffBreakdown,
      scoreTimeline: interviews.slice(0, 10).reverse().map((i) => ({
        date: i.completedAt || i.createdAt,
        score: i.avgScore || 0,
        mode: i.mode,
      })),
    });
  } catch (err) {
    return resp.error(res, "Failed to fetch analytics.", 500);
  }
};

// ── GET /api/analytics/streak?days=182 ─────────────────────────────────────
// Returns the current/longest streak, freezes available, and a day-by-day
// calendar (default ~6 months) for a GitHub-style contribution heatmap.
export const getStreak = async (req, res) => {
  try {
    const days = Math.min(365, Math.max(30, parseInt(req.query.days, 10) || 182));
    const data = await getStreakCalendar(req.user._id, days);
    return resp.success(res, data);
  } catch (err) {
    console.error("[Analytics] getStreak error:", err.message);
    return resp.error(res, "Failed to fetch streak data.", 500);
  }
};

// ── GET /api/analytics/readiness ────────────────────────────────────────────
// Centralized placement-readiness score, built entirely from real stored
// data (see readinessService.js) — never fabricated.
export const getReadinessScore = async (req, res) => {
  try {
    const data = await getReadiness(req.user._id);
    return resp.success(res, data);
  } catch (err) {
    console.error("[Analytics] getReadinessScore error:", err.message);
    return resp.error(res, "Failed to compute readiness score.", 500);
  }
};
