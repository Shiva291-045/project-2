import SolvedProblem from "../models/SolvedProblem.js";
import User from "../models/User.js";
import * as resp from "../utils/apiResponse.js";
import { recordActivity } from "../utils/streakService.js";

// ── POST /api/coding/solved ───────────────────────────────────────────────────
export const markSolved = async (req, res) => {
  try {
    const { problemId, title, topic, difficulty } = req.body;
    const existing = await SolvedProblem.findOne({ userId: req.user._id, problemId });
    if (existing) {
      await SolvedProblem.deleteOne({ _id: existing._id });
      await User.findByIdAndUpdate(req.user._id, { $inc: { problemsSolved: -1 } });
      return resp.success(res, { solved: false }, "Problem marked as unsolved.");
    }
    await SolvedProblem.create({ userId: req.user._id, problemId, title, topic, difficulty });
    await User.findByIdAndUpdate(req.user._id, { $inc: { problemsSolved: 1, xp: 10 } });
    recordActivity(req.user._id).catch(e => console.warn("[Streak] problem solved:", e.message));
    return resp.success(res, { solved: true }, "Problem marked as solved! +10 XP");
  } catch (err) {
    return resp.error(res, "Failed to update solved status.", 500);
  }
};

// ── GET /api/coding/solved ────────────────────────────────────────────────────
export const getSolved = async (req, res) => {
  try {
    const solved = await SolvedProblem.find({ userId: req.user._id }).select("problemId");
    return resp.success(res, { solvedIds: solved.map((s) => s.problemId) });
  } catch (err) {
    return resp.error(res, "Failed to fetch solved problems.", 500);
  }
};
