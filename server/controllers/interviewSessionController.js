import InterviewSession from "../models/InterviewSession.js";
import Interview        from "../models/Interview.js";
import User             from "../models/User.js";
import * as resp from "../utils/apiResponse.js";
import {
  generateOpeningQuestion,
  runAdaptiveInterviewTurn,
  generateInterviewReport,
} from "../services/groqService.js";

const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"];

// Deterministic base progression across the session: first third Easy,
// middle third Medium, final third Hard — nudged up/down by how the
// candidate is actually performing.
const stageForQuestionIndex = (index, total, baseDifficulty) => {
  const baseIdx = Math.max(0, DIFFICULTY_ORDER.indexOf(baseDifficulty));
  const progress = total > 1 ? (index - 1) / (total - 1) : 0; // 0 → 1
  let stage;
  if (progress < 1 / 3)      stage = 0;
  else if (progress < 2 / 3) stage = 1;
  else                       stage = 2;
  // Anchor around the session's configured base difficulty rather than
  // always starting at Easy — e.g. a "Hard" session stays Medium→Hard→Hard.
  const shifted = Math.min(2, Math.max(0, stage + Math.max(0, baseIdx - 1)));
  return DIFFICULTY_ORDER[shifted];
};

const nextDifficultyFromPerformance = (baseNext, lastScore) => {
  if (lastScore == null) return baseNext;
  const idx = DIFFICULTY_ORDER.indexOf(baseNext);
  if (lastScore >= 8.5 && idx < 2) return DIFFICULTY_ORDER[idx + 1]; // doing great → push harder
  if (lastScore <= 3   && idx > 0) return DIFFICULTY_ORDER[idx - 1]; // struggling → ease off
  return baseNext;
};

const QUESTIONS_BY_DURATION = { 5: 4, 10: 8, 15: 12, 20: 16 };
const questionTargetForDuration = (durationMin) =>
  QUESTIONS_BY_DURATION[durationMin] || Math.max(4, Math.round((durationMin || 10) * 0.8));

const requireGroqKey = (res) => {
  if (!process.env.GROQ_API_KEY) {
    resp.error(res, "AI interview service is not configured. Please set GROQ_API_KEY in your environment variables.", 503);
    return false;
  }
  return true;
};

const handleGroqError = (res, err, fallbackMsg) => {
  console.error("[Interview Session] Error:", err.message);
  const status = err.status || err.statusCode || 0;
  if (err.message?.includes("timed out"))             return resp.error(res, "AI request timed out. Please try again.", 504);
  if (status === 429 || err.message?.includes("429")) return resp.error(res, "AI rate limit reached. Please wait a moment and try again.", 429);
  return resp.error(res, fallbackMsg, 502);
};

/* ─── POST /api/interview/session/start ─────────────────────────────────────
   body: { mode, role, difficulty, duration (minutes) }
──────────────────────────────────────────────────────────────────────────── */
export const startSession = async (req, res) => {
  try {
    if (!requireGroqKey(res)) return;

    const { mode, role, difficulty = "Medium", duration = 10 } = req.body;
    if (!["technical", "behavioral", "hr"].includes(mode)) {
      return resp.error(res, "Invalid interview mode.", 400);
    }

    const targetQuestions = questionTargetForDuration(duration);

    let opening;
    try {
      opening = await generateOpeningQuestion({ mode, role, difficulty });
    } catch (err) {
      return handleGroqError(res, err, "Failed to start the interview. Please try again.");
    }

    const session = await InterviewSession.create({
      userId:          req.user._id,
      mode,
      role:            role || "Software Engineer",
      baseDifficulty:  difficulty,
      duration:        Math.round(duration * 60),
      targetQuestions,
      qa: [{ question: opening.question, difficulty, topic: opening.topic }],
      topicsCovered:   [opening.topic],
    });

    return resp.success(res, {
      sessionId:       session._id,
      question:        opening.question,
      topic:           opening.topic,
      difficulty,
      questionNumber:  1,
      targetQuestions,
    }, "Interview session started.", 201);
  } catch (err) {
    console.error("[Interview Session] startSession error:", err.message);
    return resp.error(res, "Failed to start interview session.", 500);
  }
};

/* ─── POST /api/interview/session/:id/answer ────────────────────────────────
   body: { answer }
   Scores the last question, stores the answer, generates the next
   context-aware question (or finalizes the session with a report if the
   configured question count has been reached).
──────────────────────────────────────────────────────────────────────────── */
export const submitAnswer = async (req, res) => {
  try {
    if (!requireGroqKey(res)) return;

    const { answer } = req.body;
    if (typeof answer !== "string" || !answer.trim()) {
      return resp.error(res, "An answer is required.", 400);
    }

    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return resp.error(res, "Interview session not found.", 404);
    if (session.status !== "active") return resp.error(res, "This interview session has already ended.", 409);

    const current = session.qa[session.qa.length - 1];
    if (current.answer) return resp.error(res, "This question has already been answered.", 409);

    current.answer     = answer.trim();
    current.answeredAt = new Date();

    const questionNumber = session.qa.length;
    const isFinal = questionNumber >= session.targetQuestions;

    const askedQuestions = session.qa.map(q => q.question);

    if (isFinal) {
      // Score the final answer via one last adaptive-turn-style call, then
      // generate the full report. We still need a score for this answer —
      // reuse runAdaptiveInterviewTurn but discard its "next question".
      let scored;
      try {
        scored = await runAdaptiveInterviewTurn({
          mode: session.mode, role: session.role,
          difficulty: current.difficulty, nextDifficulty: current.difficulty,
          lastQuestion: current.question, lastTopic: current.topic, answer: current.answer,
          askedQuestions, topicsCovered: session.topicsCovered,
          questionNumber, targetQuestions: session.targetQuestions,
        });
      } catch (err) {
        return handleGroqError(res, err, "Failed to score your final answer. Please try again.");
      }
      current.score    = scored.score;
      current.feedback = scored.feedback;

      let report;
      try {
        report = await generateInterviewReport({
          mode: session.mode, role: session.role, qa: session.qa,
        });
      } catch (err) {
        return handleGroqError(res, err, "Failed to generate your performance report. Please try again.");
      }

      session.status      = "completed";
      session.completedAt = new Date();
      session.report      = report;
      await session.save();

      return resp.success(res, {
        done:      true,
        score:     current.score,
        feedback:  current.feedback,
        report,
        sessionId: session._id,
      }, "Interview complete.");
    }

    // Not final — generate the next question
    const nextQuestionNumber = questionNumber + 1;
    const baseNext = stageForQuestionIndex(nextQuestionNumber, session.targetQuestions, session.baseDifficulty);

    let turn;
    try {
      turn = await runAdaptiveInterviewTurn({
        mode: session.mode, role: session.role,
        difficulty: current.difficulty,
        nextDifficulty: nextDifficultyFromPerformance(baseNext, current.score),
        lastQuestion: current.question, lastTopic: current.topic, answer: current.answer,
        askedQuestions, topicsCovered: session.topicsCovered,
        questionNumber, targetQuestions: session.targetQuestions,
      });
    } catch (err) {
      return handleGroqError(res, err, "AI failed to generate the next question. Please try again.");
    }

    current.score    = turn.score;
    current.feedback = turn.feedback;

    const nextDifficulty = nextDifficultyFromPerformance(baseNext, turn.score);
    session.qa.push({ question: turn.nextQuestion, difficulty: nextDifficulty, topic: turn.nextTopic });
    if (!session.topicsCovered.includes(turn.nextTopic)) session.topicsCovered.push(turn.nextTopic);

    await session.save();

    return resp.success(res, {
      done:           false,
      score:          turn.score,
      feedback:       turn.feedback,
      question:       turn.nextQuestion,
      topic:          turn.nextTopic,
      difficulty:     nextDifficulty,
      questionNumber: nextQuestionNumber,
      targetQuestions: session.targetQuestions,
    }, "Answer recorded.");
  } catch (err) {
    console.error("[Interview Session] submitAnswer error:", err.message);
    return resp.error(res, "Failed to process your answer. Please try again.", 500);
  }
};

/* ─── POST /api/interview/session/:id/end ───────────────────────────────────
   Manual early end (e.g. timer expired or user clicked Stop). Scores any
   unanswered-but-pending last question if an answer was supplied, then
   finalizes the session with a report from whatever was covered so far.
──────────────────────────────────────────────────────────────────────────── */
export const endSession = async (req, res) => {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return resp.error(res, "Interview session not found.", 404);

    if (session.status === "completed") {
      return resp.success(res, { done: true, report: session.report, sessionId: session._id }, "Session already completed.");
    }

    // Drop a trailing unanswered question — can't score what wasn't answered
    if (session.qa.length && !session.qa[session.qa.length - 1].answer) {
      session.qa.pop();
    }

    if (!session.qa.length) {
      session.status      = "abandoned";
      session.completedAt = new Date();
      await session.save();
      return resp.success(res, { done: true, report: null, sessionId: session._id }, "Session ended with no answered questions.");
    }

    if (!requireGroqKey(res)) return;

    let report;
    try {
      report = await generateInterviewReport({ mode: session.mode, role: session.role, qa: session.qa });
    } catch (err) {
      return handleGroqError(res, err, "Failed to generate your performance report. Please try again.");
    }

    session.status      = "completed";
    session.completedAt = new Date();
    session.report      = report;
    await session.save();

    return resp.success(res, { done: true, report, sessionId: session._id }, "Interview ended.");
  } catch (err) {
    console.error("[Interview Session] endSession error:", err.message);
    return resp.error(res, "Failed to end interview session.", 500);
  }
};

/* ─── GET /api/interview/session/:id ─────────────────────────────────────────
   Fetch current session state (used to resume a session after a page reload).
──────────────────────────────────────────────────────────────────────────── */
export const getSession = async (req, res) => {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return resp.error(res, "Interview session not found.", 404);
    return resp.success(res, { session });
  } catch (err) {
    return resp.error(res, "Failed to fetch interview session.", 500);
  }
};
