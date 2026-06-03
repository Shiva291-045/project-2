import Resume from "../models/Resume.js";
import * as resp from "../utils/apiResponse.js";
import {
  detectResume,
  analyzeWithAI,
  analyzeWithKeywords,
  extractSkillsFromText,
} from "../services/resumeAnalysisService.js";

/* ─── POST /api/resume/analyze ──────────────────────────────────────────────── */
export const analyzeResume = async (req, res) => {
  const startTime = Date.now();
  try {
    const { extractedText = "", fileName = "resume.pdf", base64, mimeType } = req.body;

    // ── 1. Validate it's actually a resume ────────────────────────────────────
    const detection = detectResume(extractedText, fileName);
    console.log(`[Resume] Validation for "${fileName}": isResume=${detection.isResume}, confidence=${detection.confidence}`);

    if (!detection.isResume) {
      return resp.error(res, detection.reason, 422);
    }

    let analysis = null;
    let aiAttempted = false;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // ── 2. Try AI analysis ────────────────────────────────────────────────────
    if (apiKey && apiKey.startsWith("sk-ant-")) {
      aiAttempted = true;
      const aiResult = await analyzeWithAI(extractedText, fileName, base64, mimeType);

      if (aiResult.success) {
        analysis = aiResult.data;
        console.log(`[Resume] AI analysis done in ${Date.now() - startTime}ms — ATS: ${analysis.atsScore}, Skills: ${analysis.skills?.length}`);
      } else {
        // AI failed — log clearly and fall back
        console.warn(`[Resume] AI analysis failed (${aiResult.reason}): ${aiResult.error || ""}. Using keyword fallback.`);
      }
    } else {
      console.info("[Resume] ANTHROPIC_API_KEY not configured — using keyword analysis");
    }

    // ── 3. Keyword fallback ───────────────────────────────────────────────────
    if (!analysis) {
      analysis = analyzeWithKeywords(extractedText, fileName);

      // If text extraction was poor (short/empty), warn in summary
      if (!extractedText || extractedText.trim().length < 100) {
        analysis.summary = "⚠️ Text extraction from this PDF was limited (may be scanned or image-based). " + analysis.summary;
        analysis.extractionWarning = true;
      }
    }

    // ── 4. Ensure skills are never empty if text has tech content ────────────
    if ((!analysis.skills || analysis.skills.length === 0) && extractedText) {
      const fallbackSkills = extractSkillsFromText(extractedText);
      if (fallbackSkills.length > 0) {
        console.log(`[Resume] Skill safety net: adding ${fallbackSkills.length} skills missed by primary analysis`);
        analysis.skills = fallbackSkills.slice(0, 20);
      }
    }

    // ── 5. Save to DB (non-blocking) ──────────────────────────────────────────
    Resume.create({
      userId:   req.user._id,
      fileName,
      atsScore: analysis.atsScore,
      analysis,
    }).catch(err => console.warn("[Resume] DB save failed:", err.message));

    // ── 6. Return result ──────────────────────────────────────────────────────
    return resp.success(res, {
      confidence:       detection.confidence,
      detectedSections: detection.detectedSections || [],
      scanned:          detection.scanned || false,
      aiUsed:           aiAttempted && analysis.source === "ai",
      analysisTime:     Date.now() - startTime,
      ...analysis,
    }, "Resume analyzed successfully!");

  } catch (err) {
    console.error("[Resume] Unhandled error:", err.message, err.stack);
    return resp.error(res, "Failed to analyze resume. Please try again.", 500);
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
    console.error("[Resume] History fetch failed:", err.message);
    return resp.error(res, "Failed to fetch resume history.", 500);
  }
};
