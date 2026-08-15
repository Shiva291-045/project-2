import Interview from "../models/Interview.js";
import SolvedProblem from "../models/SolvedProblem.js";
import Resume from "../models/Resume.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";

// src/data/450DSA.json's actual valid-problem count (branded app-wide as
// "450 DSA problems" — the real number after filtering blank rows is 448).
const TOTAL_DSA_PROBLEMS = 448;

const CATEGORY_WEIGHTS = { dsa: 0.30, technical: 0.25, communication: 0.15, resume: 0.15, consistency: 0.15 };

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

/**
 * Builds the placement-readiness snapshot for a user entirely from data
 * that already exists elsewhere in the app (solved DSA problems, saved
 * interview score breakdowns, latest resume ATS score, daily activity log).
 * No category is ever given a fabricated score — if there's no data for a
 * category yet, it's excluded from the weighted average and flagged
 * `hasData: false` so the UI can say "not enough data yet" instead of
 * showing a made-up number.
 */
export const getReadiness = async (userId) => {
  const [solvedCount, recentInterviews, latestResume, user] = await Promise.all([
    SolvedProblem.countDocuments({ userId }),
    Interview.find({ userId }).sort({ createdAt: -1 }).limit(10).select("analysis avgScore"),
    Resume.findOne({ userId }).sort({ createdAt: -1 }).select("atsScore"),
    User.findById(userId).select("streak longestStreak"),
  ]);

  // Consistency = % of the last 30 days with a logged activity (interview
  // started, resume analyzed, or a problem solved) — reuses the same
  // Activity log the streak calendar is built from.
  const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const activeDays = await Activity.countDocuments({ userId, date: { $gte: since } });
  const consistencyScore = Math.round((activeDays / 30) * 100);

  const dsaScore = solvedCount > 0 ? Math.round((solvedCount / TOTAL_DSA_PROBLEMS) * 100) : 0;

  const technicalScores = recentInterviews.map(i => i.analysis?.technicalScore).filter(s => typeof s === "number");
  const commScores      = recentInterviews.map(i => i.analysis?.communicationScore).filter(s => typeof s === "number");
  const overallInterviewScores = recentInterviews.map(i => i.avgScore).filter(s => typeof s === "number");

  // Older interviews (from before per-category scoring was added) only have
  // a single avgScore — fall back to that for "technical" so returning
  // users don't lose their history, but never invent a communication score
  // that was never actually measured.
  const technicalScore     = technicalScores.length ? avg(technicalScores) : avg(overallInterviewScores);
  const communicationScore = commScores.length ? avg(commScores) : null;
  const resumeScore        = typeof latestResume?.atsScore === "number" ? latestResume.atsScore : null;

  const categories = {
    dsa:           { label: "DSA",           score: dsaScore,           hasData: solvedCount > 0 },
    technical:     { label: "Technical",     score: technicalScore != null ? Math.round(technicalScore) : null, hasData: technicalScore != null },
    communication: { label: "Communication", score: communicationScore != null ? Math.round(communicationScore) : null, hasData: communicationScore != null },
    resume:        { label: "Resume",        score: resumeScore,        hasData: resumeScore != null },
    consistency:   { label: "Consistency",   score: consistencyScore,   hasData: activeDays > 0 },
  };

  let weightedSum = 0, weightTotal = 0;
  Object.entries(categories).forEach(([key, cat]) => {
    if (cat.hasData) { weightedSum += cat.score * CATEGORY_WEIGHTS[key]; weightTotal += CATEGORY_WEIGHTS[key]; }
  });
  const overallReadiness = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : null;

  const withData = Object.values(categories).filter(c => c.hasData);
  const sorted = [...withData].sort((a, b) => b.score - a.score);
  const strongAreas = withData.length >= 2 ? sorted.slice(0, 2).map(c => c.label) : [];
  const weakAreas   = withData.length >= 2 ? sorted.slice(-2).map(c => c.label).reverse() : [];

  return {
    overallReadiness,
    categories,
    strongAreas,
    weakAreas,
    solvedProblems:    solvedCount,
    totalDsaProblems:  TOTAL_DSA_PROBLEMS,
    streak:            user?.streak || 0,
    longestStreak:     user?.longestStreak || 0,
    interviewsAnalyzed: recentInterviews.length,
  };
};
