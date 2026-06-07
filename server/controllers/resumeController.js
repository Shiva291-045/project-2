import Resume from "../models/Resume.js";
import * as resp from "../utils/apiResponse.js";
import { validateResume, analyzeResume as groqAnalyze } from "../services/groqService.js";

/**
 * POST /api/resume/analyze
 * Flow:
 *  1. Check GROQ_API_KEY — 503 if missing
 *  2. Check extracted text ≥100 chars / ≥20 words — 422 if insufficient
 *  3. Groq validates: is this a real resume?
 *  4. Not a resume → 422 with reason
 *  5. Valid resume → Groq ATS analysis
 *  6. Save to DB, return results
 */
export const analyzeResume = async (req, res) => {
  const startTime = Date.now();
  try {
    const { extractedText = "", fileName = "resume.pdf", base64, mimeType } = req.body;

    // 1. Key check
    if (!process.env.GROQ_API_KEY) {
      return resp.error(res,
        "Resume analysis is not configured. Please set GROQ_API_KEY in your environment variables.",
        503
      );
    }

    // 2. Text sufficiency
    const text      = extractedText.replace(/\s+/g, " ").trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
    console.log(`[Resume] "${fileName}" | ${text.length} chars | ${wordCount} words`);

    if (text.length < 100 || wordCount < 20) {
      return resp.error(res,
        "Invalid Resume: Unable to extract sufficient content from this file. " +
        "This may be a scanned image PDF or corrupted file. " +
        "Please upload a text-based PDF or .docx file.",
        422
      );
    }

    // 3. Validate it's a resume
    let validation;
    try {
      validation = await validateResume(text);
    } catch (e) {
      console.error("[Resume] Validation error:", e.message);
      return resp.error(res, `Resume validation failed: ${e.message}`, 502);
    }

    // 4. Reject non-resumes
    if (!validation.isResume) {
      return resp.error(res,
        `Invalid Resume: ${validation.reason || "This does not appear to be a resume or CV."}`,
        422
      );
    }

    // 5. ATS analysis
    let analysis;
    try {
      analysis = await groqAnalyze(text, fileName);
    } catch (e) {
      console.error("[Resume] Analysis error:", e.message);
      return resp.error(res, `Resume analysis failed: ${e.message}`, 502);
    }

    // 6. Save to DB (non-blocking)
    Resume.create({
      userId:   req.user._id,
      fileName,
      atsScore: analysis.atsScore,
      analysis: { ...analysis, source: "groq" },
    }).catch(e => console.warn("[Resume] DB save failed:", e.message));

    const elapsed = Date.now() - startTime;
    console.log(`[Resume] ✅ "${fileName}" done in ${elapsed}ms — ATS: ${analysis.atsScore}`);

    return resp.success(res, {
      source:       "groq",
      analysisTime: elapsed,
      wordCount,
      ...analysis,
    }, "Resume analyzed successfully!");

  } catch (err) {
    console.error("[Resume] Unhandled error:", err.message);
    return resp.error(res, "An unexpected error occurred. Please try again.", 500);
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
    return resp.error(res, "Failed to fetch resume history.", 500);
  }
};
