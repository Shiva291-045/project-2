import Interview from "../models/Interview.js";
import SolvedProblem from "../models/SolvedProblem.js";
import User from "../models/User.js";
import * as resp from "../utils/apiResponse.js";

export const getAnalytics = async (req, res) => {
  try {
    const uid = req.user._id;

    const [interviews, solvedCount, user] = await Promise.all([
      Interview.find({ userId: uid }).sort({ createdAt: -1 }).limit(20).select("-transcript"),
      SolvedProblem.countDocuments({ userId: uid }),
      User.findById(uid),
    ]);

    const scores = interviews.flatMap((i) => i.scores || []);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;

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
