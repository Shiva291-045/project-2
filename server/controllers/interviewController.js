import Interview from "../models/Interview.js";
import User from "../models/User.js";
import * as resp from "../utils/apiResponse.js";

// ── POST /api/interview/save ──────────────────────────────────────────────────
export const saveInterview = async (req, res) => {
  try {
    const { mode, difficulty, role, duration, scores, transcript, analysis } = req.body;
    const avgScore = scores?.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const interview = await Interview.create({
      userId: req.user._id, mode, difficulty, role,
      duration, scores, transcript, analysis,
      avgScore: Math.round(avgScore * 10),
      completedAt: new Date(),
    });

    // Update user stats
    const user = await User.findById(req.user._id);
    if (user) {
      user.totalInterviews   += 1;
      user.avgInterviewScore  = Math.round(
        (user.avgInterviewScore * (user.totalInterviews - 1) + Math.round(avgScore * 10)) / user.totalInterviews
      );
      user.xp += 50 + Math.round(avgScore * 5);
      await user.save({ validateBeforeSave: false });
    }

    return resp.success(res, { interviewId: interview._id, avgScore: interview.avgScore }, "Interview saved!", 201);
  } catch (err) {
    return resp.error(res, "Failed to save interview.", 500);
  }
};

// ── GET /api/interview/history ────────────────────────────────────────────────
export const getHistory = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const interviews = await Interview.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select("-transcript");

    const total = await Interview.countDocuments({ userId: req.user._id });
    return resp.success(res, { interviews, total, page: parseInt(page) });
  } catch (err) {
    return resp.error(res, "Failed to fetch interview history.", 500);
  }
};

// ── GET /api/interview/:id ────────────────────────────────────────────────────
export const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return resp.error(res, "Interview not found.", 404);
    return resp.success(res, { interview });
  } catch (err) {
    return resp.error(res, "Failed to fetch interview.", 500);
  }
};
