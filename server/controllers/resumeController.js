import Resume from "../models/Resume.js";
import * as resp from "../utils/apiResponse.js";
import { validateResume, analyzeResume as groqAnalyze } from "../services/groqService.js";
import { extractTextFromBase64 } from "../utils/textExtraction.js";
import { recordActivity } from "../utils/streakService.js";

const MIN_CHARS = 100;
const MIN_WORDS = 20;

const sufficient = (text) => {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  const wordCount = clean.split(/\s+/).filter(w => w.length > 1).length;
  return { clean, wordCount, ok: clean.length >= MIN_CHARS && wordCount >= MIN_WORDS };
};

/**
 * POST /api/resume/analyze
 * Flow:
 *  1. Check GROQ_API_KEY — 503 if missing
 *  2. Check extracted text ≥100 chars / ≥20 words. If insufficient and a
 *     base64 payload was provided, attempt server-side extraction
 *     (covers DOCX, which the client never extracts, and PDFs the
 *     client-side extractor failed on) — 422 if still insufficient
 *  3. Groq validates: is this a real resume?
 *  4. Not a resume → 422 with reason
 *  5. Valid resume → Groq ATS analysis, personalized to targetRole if given
 *  6. Save to DB, return results
 */
export const analyzeResume = async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      extractedText = "",
      fileName = "resume.pdf",
      base64,
      mimeType,
      targetRole = "",
    } = req.body;

    // 1. Key check
    if (!process.env.GROQ_API_KEY) {
      return resp.error(res,
        "Resume analysis is not configured. Please set GROQ_API_KEY in your environment variables.",
        503
      );
    }

    // 2. Text sufficiency — try client-extracted text first
    let { clean: text, wordCount, ok } = sufficient(extractedText);
    let extractionMethod = text ? "client" : "none";

    // Fall back to server-side extraction (required for DOCX; also a
    // safety net for PDFs the client-side extractor couldn't parse)
    if (!ok && base64) {
      const extracted = await extractTextFromBase64(base64, mimeType, fileName);
      if (extracted.text) {
        const server = sufficient(extracted.text);
        if (server.ok) {
          text = server.clean;
          wordCount = server.wordCount;
          ok = true;
          extractionMethod = extracted.method;
        }
      } else if (extracted.error && !ok) {
        // Surface a specific extraction error (e.g. legacy .doc, corrupted file)
        console.log(`[Resume] "${fileName}" | server extraction failed: ${extracted.error}`);
        return resp.error(res, `Invalid Resume: ${extracted.error}`, 422);
      }
    }

    console.log(`[Resume] "${fileName}" | ${text.length} chars | ${wordCount} words | source=${extractionMethod}`);

    if (!ok) {
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

    // 5. ATS analysis (personalized to targetRole when provided)
    let analysis;
    try {
      analysis = await groqAnalyze(text, fileName, targetRole);
    } catch (e) {
      console.error("[Resume] Analysis error:", e.message);
      return resp.error(res, `Resume analysis failed: ${e.message}`, 502);
    }

    // 6. Save to DB (non-blocking)
    Resume.create({
      userId:   req.user._id,
      fileName,
      targetRole,
      atsScore: analysis.atsScore,
      analysis: { ...analysis, source: "groq" },
    }).catch(e => console.warn("[Resume] DB save failed:", e.message));

    recordActivity(req.user._id).catch(e => console.warn("[Streak] resume analyze:", e.message));

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
