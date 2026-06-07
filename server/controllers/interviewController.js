import Interview from "../models/Interview.js";
import User      from "../models/User.js";
import * as resp from "../utils/apiResponse.js";
import { callGeminiRaw } from "../services/geminiResumeService.js";

/* ─── POST /api/interview/save ──────────────────────────────────────────────── */
export const saveInterview = async (req, res) => {
  try {
    const { mode, difficulty, role, duration, scores, transcript, analysis } = req.body;
    const avgScore = scores?.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const interview = await Interview.create({
      userId: req.user._id, mode, difficulty, role,
      duration, scores, transcript, analysis,
      avgScore:    Math.round(avgScore * 10),
      completedAt: new Date(),
    });

    const user = await User.findById(req.user._id);
    if (user) {
      user.totalInterviews  += 1;
      user.avgInterviewScore = Math.round(
        (user.avgInterviewScore * (user.totalInterviews - 1) + Math.round(avgScore * 10))
        / user.totalInterviews
      );
      user.xp += 50 + Math.round(avgScore * 5);
      await user.save({ validateBeforeSave: false });
    }

    return resp.success(
      res,
      { interviewId: interview._id, avgScore: interview.avgScore },
      "Interview saved!",
      201
    );
  } catch (err) {
    console.error("[Interview] saveInterview error:", err.message);
    return resp.error(res, "Failed to save interview.", 500);
  }
};

/* ─── GET /api/interview/history ────────────────────────────────────────────── */
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

/* ─── GET /api/interview/:id ─────────────────────────────────────────────────── */
export const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id, userId: req.user._id,
    });
    if (!interview) return resp.error(res, "Interview not found.", 404);
    return resp.success(res, { interview });
  } catch (err) {
    return resp.error(res, "Failed to fetch interview.", 500);
  }
};

/* ─── POST /api/interview/ai — Gemini-powered interview proxy ───────────────── */
export const aiProxy = async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    // ── Validate request ────────────────────────────────────────────────────
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return resp.error(res, "Invalid request: messages array is required.", 400);
    }
    if (messages[messages.length - 1]?.role !== "user") {
      return resp.error(res, "Last message must be from the user.", 400);
    }

    // ── Check Gemini key ────────────────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.length < 20) {
      console.error("[Interview AI] GEMINI_API_KEY is not configured");
      return resp.error(
        res,
        "AI interview service is not configured. Please set GEMINI_API_KEY in your Render environment variables.",
        503
      );
    }

    // ── Build prompt for Gemini ─────────────────────────────────────────────
    // Gemini doesn't have a system role — prepend system prompt to first user message
    const conversationHistory = messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
      .join("\n\n");

    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\nConversation so far:\n${conversationHistory}\n\nNow respond as the Interviewer:`
      : `${conversationHistory}\n\nInterviewer:`;

    // ── Call Gemini ─────────────────────────────────────────────────────────
    const text = await callGeminiRaw(fullPrompt, {
      retries:   2,
      timeoutMs: 35000,
    });

    if (!text || !text.trim()) {
      return resp.error(res, "AI returned an empty response. Please try again.", 502);
    }

    return resp.success(res, { text: text.trim() });

  } catch (err) {
    console.error("[Interview AI] Error:", err.message);

    if (err.message?.includes("timed out")) {
      return resp.error(res, "AI request timed out. Please try again.", 504);
    }
    if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
      return resp.error(res, "AI rate limit reached. Please wait a moment and try again.", 429);
    }
    if (err.message?.includes("GEMINI_API_KEY")) {
      return resp.error(res, err.message, 503);
    }

    return resp.error(res, "AI service error. Please try again.", 500);
  }
};
