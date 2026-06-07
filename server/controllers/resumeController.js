import Resume from "../models/Resume.js";
import * as resp from "../utils/apiResponse.js";
import {
  validateResume,
  analyzeResume as geminiAnalyze,
} from "../services/geminiResumeService.js";

/**
 * POST /api/resume/analyze
 *
 * Flow:
 *  1. Check GEMINI_API_KEY is set — if not, return 503 with clear message
 *  2. Validate extracted text has sufficient content (≥100 meaningful chars)
 *  3. Ask Gemini to validate: is this a real resume?
 *  4. If NOT a resume → return 422 with Gemini's reason
 *  5. If YES → run full Gemini ATS analysis
 *  6. Save to DB and return results
 *
 * NO keyword fallback scoring. NO fake scores. Ever.
 */
export const analyzeResume = async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      extractedText = "",
      fileName      = "resume.pdf",
      base64,
      mimeType,
    } = req.body;

    // ── 1. Gemini key check ───────────────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.length < 20) {
      console.error("[Resume] GEMINI_API_KEY not configured");
      return resp.error(
        res,
        "Resume analysis is not configured. Please contact the administrator to set up GEMINI_API_KEY.",
        503
      );
    }

    // ── 2. Check extracted text has sufficient content ────────────────────────
    const meaningfulText = extractedText.replace(/\s+/g, " ").trim();
    const wordCount      = meaningfulText.split(/\s+/).filter(w => w.length > 1).length;

    console.log(`[Resume] File: "${fileName}" | Extracted: ${meaningfulText.length} chars | Words: ${wordCount}`);

    if (meaningfulText.length < 100 || wordCount < 20) {
      console.warn(`[Resume] Insufficient text extracted from "${fileName}" — rejecting`);
      return resp.error(
        res,
        "Invalid Resume: Unable to extract sufficient resume content from this file. " +
        "This may be a scanned image PDF, a corrupted file, or a blank document. " +
        "Please upload a text-based PDF or a Word document (.docx).",
        422
      );
    }

    // ── 3. Gemini validation: is this actually a resume? ─────────────────────
    console.log(`[Resume] Sending to Gemini for validation...`);
    let validation;
    try {
      validation = await validateResume(meaningfulText);
    } catch (validErr) {
      console.error("[Resume] Gemini validation error:", validErr.message);
      return resp.error(
        res,
        `Resume validation failed: ${validErr.message}`,
        502
      );
    }

    // ── 4. Reject non-resumes ─────────────────────────────────────────────────
    if (!validation.isResume) {
      console.log(`[Resume] Gemini rejected "${fileName}": ${validation.reason}`);
      return resp.error(
        res,
        `Invalid Resume: ${validation.reason || "This document does not appear to be a resume or CV. Please upload a valid resume."}`,
        422
      );
    }

    // ── 5. Gemini ATS analysis ────────────────────────────────────────────────
    console.log(`[Resume] Gemini confirmed resume — running ATS analysis...`);
    let analysis;
    try {
      analysis = await geminiAnalyze(meaningfulText, fileName);
    } catch (analysisErr) {
      console.error("[Resume] Gemini ATS analysis error:", analysisErr.message);
      return resp.error(
        res,
        `Resume analysis failed: ${analysisErr.message}`,
        502
      );
    }

    // ── 6. Save to DB (non-blocking) ──────────────────────────────────────────
    Resume.create({
      userId:   req.user._id,
      fileName,
      atsScore: analysis.atsScore,
      analysis: { ...analysis, source: "gemini" },
    }).catch(err => console.warn("[Resume] DB save failed:", err.message));

    const elapsed = Date.now() - startTime;
    console.log(`[Resume] ✅ Complete for "${fileName}" in ${elapsed}ms — ATS: ${analysis.atsScore}`);

    return resp.success(res, {
      source:       "gemini",
      analysisTime: elapsed,
      wordCount,
      ...analysis,
    }, "Resume analyzed successfully!");

  } catch (err) {
    console.error("[Resume] Unhandled error:", err.message);
    return resp.error(
      res,
      "An unexpected error occurred during resume analysis. Please try again.",
      500
    );
  }
};

/* ─── GET /api/resume/history ───────────────────────────────────────────────── */
export const getResumeHistory = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("fileName atsScore createdAt analysis.summary");
    return resp.success(res, { resumes });
  } catch (err) {
    console.error("[Resume] History fetch error:", err.message);
    return resp.error(res, "Failed to fetch resume history.", 500);
  }
};
