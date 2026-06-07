/**
 * Gemini Resume Analysis Service
 * ─────────────────────────────────────────────────────────────────────────────
 * All resume validation and ATS analysis goes through Gemini AI.
 * No keyword-based fallback scoring. If Gemini is unavailable, we show
 * a clear error — never fake scores.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

/* ─── Startup key validation ───────────────────────────────────────────────── */
export const validateGeminiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("❌ [Gemini] GEMINI_API_KEY is not set — resume analysis disabled");
    return { valid: false, reason: "not_set" };
  }
  if (key.length < 20) {
    console.error("❌ [Gemini] GEMINI_API_KEY appears invalid (too short)");
    return { valid: false, reason: "invalid_format" };
  }
  console.log("✅ [Gemini] GEMINI_API_KEY configured — AI resume analysis enabled");
  return { valid: true };
};

/* ─── Get Gemini client (throws if key missing) ────────────────────────────── */
const getClient = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.length < 20) {
    throw new Error("GEMINI_API_KEY is not configured. Please set it in your environment variables.");
  }
  return new GoogleGenerativeAI(key);
};

/* ─── Call Gemini with timeout + retry (exported for other controllers) ────── */
export const callGeminiRaw = async (prompt, opts = {}) => callGemini(prompt, opts);

/* ─── Internal Gemini caller ───────────────────────────────────────────────── */
const callGemini = async (prompt, opts = {}) => {
  const { retries = 2, timeoutMs = 40000 } = opts;
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const genAI = getClient();
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const raceResult = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error("Gemini request timed out after 40s")), timeoutMs)
        ),
      ]);

      const text = raceResult?.response?.text?.() || "";
      if (!text.trim()) throw new Error("Gemini returned empty response");
      return text;

    } catch (err) {
      lastErr = err;
      const isRetryable =
        err.message.includes("503") ||
        err.message.includes("429") ||
        err.message.includes("timed out") ||
        err.message.includes("UNAVAILABLE") ||
        err.message.includes("RESOURCE_EXHAUSTED");

      if (!isRetryable || attempt === retries) break;

      const wait = (attempt + 1) * 2000;
      console.warn(`[Gemini] Attempt ${attempt + 1} failed: ${err.message} — retrying in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
    }
  }

  throw lastErr;
};

/* ─── Parse JSON from Gemini response (handles markdown fences) ────────────── */
const parseJSON = (raw) => {
  if (!raw) return null;
  // Strip markdown code fences
  const stripped = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  // Try direct parse
  try { return JSON.parse(stripped); } catch {}

  // Extract first {...} block
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try { return JSON.parse(match[0]); } catch {}

  // Fix common issues: trailing commas, single quotes
  try {
    const fixed = match[0]
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/'/g, '"');
    return JSON.parse(fixed);
  } catch {}

  return null;
};

/* ─── Step 1: Validate whether document is a real resume ───────────────────── */
export const validateResume = async (extractedText) => {
  const prompt = `You are an ATS Resume Validator. Analyze the extracted text and determine whether it is a genuine resume/CV.

Return JSON only with no other text, no markdown, no explanation:
{"isResume": true/false, "reason": "short explanation under 20 words"}

A valid resume normally contains identifiable sections such as:
- Contact information (name, email, phone, LinkedIn, GitHub)
- Education (degree, university, graduation year)
- Skills (technical or soft skills list)
- Work Experience or Internship
- Projects
- Certifications
- Professional Summary or Objective

Reject these as NOT a resume:
- Blank or nearly empty files
- Random or unrelated text
- Class notes or lecture materials
- Assignment submissions or homework
- Question papers or exam papers
- Certificate documents (award certificates, course completion certificates)
- Image-only PDFs with no readable text
- Corrupted or unreadable files
- Invoices, receipts, or financial documents
- Medical records or prescriptions
- Legal documents
- News articles or blog posts
- Any document that clearly is not a professional resume/CV

Extracted text to analyze:
---
${extractedText.slice(0, 4000)}
---`;

  console.log(`[Gemini] Validating document (${extractedText.length} chars)...`);
  const raw    = await callGemini(prompt, { retries: 2, timeoutMs: 30000 });
  const parsed = parseJSON(raw);

  if (!parsed || typeof parsed.isResume !== "boolean") {
    console.warn("[Gemini] Validation response could not be parsed:", raw.slice(0, 200));
    throw new Error("Gemini validation returned an unexpected response. Please try again.");
  }

  console.log(`[Gemini] Validation result: isResume=${parsed.isResume}, reason="${parsed.reason}"`);
  return parsed;
};

/* ─── Step 2: Full ATS Analysis (only called after validation passes) ──────── */
export const analyzeResume = async (extractedText, fileName) => {
  const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer and senior technical recruiter with 20+ years of experience at top tech companies.

Perform a thorough analysis of this resume and return ONLY a valid JSON object with no markdown, no code fences, no explanation.

SCORING GUIDELINES:
- 85-100: Exceptional — strong quantified metrics, excellent keyword density, clean format, impressive projects/experience
- 70-84: Good — solid background with minor gaps in metrics or keywords
- 50-69: Average — needs more detail, better formatting, or stronger keywords
- 30-49: Below average — significant content or structure issues
- Below 30: Needs major rework

JSON format (return EXACTLY this structure):
{
  "atsScore": <integer 0-100>,
  "summary": "<2-3 honest, specific sentences about THIS resume's quality>",
  "strengths": ["<specific strength from actual content>", "<another specific strength>", "<third strength>"],
  "improvements": ["<specific actionable improvement>", "<another improvement>", "<third>", "<fourth>"],
  "technicalSkills": ["<every technical skill, language, framework, tool found in resume>"],
  "softSkills": ["<soft skills explicitly or implicitly mentioned>"],
  "education": {
    "score": <0-100>,
    "details": "<degree, institution, year if found>",
    "feedback": "<specific feedback on education section>"
  },
  "experience": {
    "score": <0-100>,
    "yearsEstimate": "<estimated years of experience>",
    "feedback": "<specific feedback on work experience section>"
  },
  "projects": {
    "score": <0-100>,
    "count": <number of projects found>,
    "feedback": "<specific feedback on projects section>"
  },
  "missingKeywords": ["<important ATS keyword absent from resume>"],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>", "<actionable suggestion 4>"],
  "trendingSkills": ["<5 trending skills relevant to this person's field>"],
  "recommendedTech": ["<5 technologies to learn based on their background>"],
  "sections": {
    "skillsScore": <0-100>,
    "experienceScore": <0-100>,
    "projectsScore": <0-100>,
    "formatScore": <0-100>
  },
  "overallFeedback": "<3-4 sentences of professional recruiter feedback specific to this resume>"
}

IMPORTANT:
- Extract EVERY technical skill mentioned anywhere (skills section, experience bullets, project descriptions)
- Be specific and honest — reference actual content from the resume
- Do not use generic feedback that could apply to any resume

Resume to analyze (file: ${fileName}):
---
${extractedText.slice(0, 8000)}
---`;

  console.log(`[Gemini] Running ATS analysis for: ${fileName}`);
  const raw    = await callGemini(prompt, { retries: 2, timeoutMs: 45000 });
  const parsed = parseJSON(raw);

  if (!parsed || typeof parsed.atsScore !== "number") {
    console.error("[Gemini] ATS response parse failed:", raw.slice(0, 300));
    throw new Error("Gemini returned an unexpected analysis format. Please try again.");
  }

  // Clamp all scores to valid range
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  parsed.atsScore = clamp(parsed.atsScore);
  if (parsed.sections) {
    parsed.sections.skillsScore     = clamp(parsed.sections.skillsScore);
    parsed.sections.experienceScore = clamp(parsed.sections.experienceScore);
    parsed.sections.projectsScore   = clamp(parsed.sections.projectsScore);
    parsed.sections.formatScore     = clamp(parsed.sections.formatScore);
  }
  if (parsed.education) parsed.education.score = clamp(parsed.education.score);
  if (parsed.experience) parsed.experience.score = clamp(parsed.experience.score);
  if (parsed.projects) parsed.projects.score = clamp(parsed.projects.score);

  // Ensure arrays are arrays
  ["strengths","improvements","technicalSkills","softSkills",
   "missingKeywords","suggestions","trendingSkills","recommendedTech"
  ].forEach(k => { if (!Array.isArray(parsed[k])) parsed[k] = []; });

  console.log(`[Gemini] ✅ ATS analysis complete — Score: ${parsed.atsScore}, Technical skills: ${parsed.technicalSkills.length}`);
  return parsed;
};
