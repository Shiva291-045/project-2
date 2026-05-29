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
    console.error("saveInterview error:", err.message);
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

// ── POST /api/interview/ai — secure proxy to Anthropic API ───────────────────
export const aiProxy = async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return resp.error(res, "Invalid request: messages array required.", 400);
    }
    if (messages.length === 0) {
      return resp.error(res, "Messages array cannot be empty.", 400);
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("❌ ANTHROPIC_API_KEY is not set in environment variables");
      return resp.error(res, "AI service not configured. Please set ANTHROPIC_API_KEY in your environment variables.", 503);
    }

    // Enforce valid role alternation (Anthropic requires user/assistant alternating)
    const sanitized = messages.filter(m => m.role === "user" || m.role === "assistant");
    if (sanitized.length === 0 || sanitized[sanitized.length - 1].role !== "user") {
      return resp.error(res, "Last message must be from user.", 400);
    }

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages: sanitized,
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      const isRateLimit = response.status === 429;
      return resp.error(
        res,
        isRateLimit ? "AI rate limit reached. Please wait a moment and try again." : "AI service temporarily unavailable.",
        response.status === 429 ? 429 : 502
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    return resp.success(res, { text });
  } catch (err) {
    if (err.name === "AbortError") {
      return resp.error(res, "AI request timed out. Please try again.", 504);
    }
    console.error("AI proxy error:", err.message);
    return resp.error(res, "AI service error. Please try again.", 500);
  }
};
