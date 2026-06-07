/**
 * Groq AI Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all Groq API calls across PrepAI.
 * Used by: interview AI proxy, resume validation, resume ATS analysis.
 *
 * Model: llama-3.3-70b-versatile
 *   - Fast, accurate, 128k context window
 *   - Supports JSON mode (response_format: { type: "json_object" })
 *   - Free tier available at console.groq.com
 */

import Groq from "groq-sdk";

const GROQ_MODEL      = "llama-3.3-70b-versatile";
const GROQ_MODEL_FAST = "llama-3.1-8b-instant"; // for simple/fast calls

/* ─── Startup key validation ───────────────────────────────────────────────── */
export const validateGroqKey = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.error("❌ [Groq] GROQ_API_KEY is not set — all AI features disabled");
    return { valid: false, reason: "not_set" };
  }
  if (!key.startsWith("gsk_")) {
    console.warn("⚠️  [Groq] GROQ_API_KEY doesn't start with 'gsk_' — may be invalid");
  }
  console.log(`✅ [Groq] GROQ_API_KEY configured — model: ${GROQ_MODEL}`);
  return { valid: true };
};

/* ─── Groq client factory ───────────────────────────────────────────────────── */
const getClient = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error(
      "GROQ_API_KEY is not configured. " +
      "Get a free key at console.groq.com and set it in your Render environment variables."
    );
  }
  return new Groq({ apiKey: key });
};

/* ─── Core chat completion with retry ──────────────────────────────────────── */
const chatCompletion = async (messages, opts = {}) => {
  const {
    model      = GROQ_MODEL,
    retries    = 2,
    timeoutMs  = 40000,
    jsonMode   = false,
    maxTokens  = 2048,
    temperature = 0.7,
  } = opts;

  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const client = getClient();

      const requestOpts = {
        model,
        messages,
        max_tokens:  maxTokens,
        temperature,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      };

      const completion = await client.chat.completions.create(requestOpts);
      clearTimeout(timer);

      const text = completion.choices?.[0]?.message?.content || "";
      if (!text.trim()) throw new Error("Groq returned empty response");

      return text;

    } catch (err) {
      clearTimeout(timer);

      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        lastErr = new Error(`Groq request timed out after ${timeoutMs / 1000}s`);
      } else {
        lastErr = err;
      }

      // Determine if we should retry
      const status = err.status || err.statusCode || 0;
      const isRetryable =
        status === 429 ||   // rate limited
        status === 503 ||   // service unavailable
        status === 529 ||   // overloaded
        status >= 500  ||   // server error
        err.message?.includes("timed out") ||
        err.message?.includes("ETIMEDOUT") ||
        err.message?.includes("ECONNRESET");

      if (!isRetryable || attempt >= retries) {
        console.error(`[Groq] Failed after ${attempt + 1} attempt(s): ${lastErr.message}`);
        break;
      }

      const wait = status === 429
        ? (attempt + 1) * 3000   // rate limit: wait longer
        : (attempt + 1) * 1500;

      console.warn(`[Groq] Attempt ${attempt + 1} failed (${status || "network"}): ${lastErr.message} — retrying in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
    }
  }

  throw lastErr;
};

/* ─── Parse JSON from AI response ──────────────────────────────────────────── */
export const parseJSON = (raw) => {
  if (!raw || typeof raw !== "string") return null;

  // Strip markdown code fences
  const stripped = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  // Direct parse
  try { const p = JSON.parse(stripped); if (p && typeof p === "object") return p; } catch {}

  // Extract first {...} block
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try { const p = JSON.parse(match[0]); if (p && typeof p === "object") return p; } catch {}

  // Fix trailing commas and unquoted keys
  try {
    const fixed = match[0]
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3');
    return JSON.parse(fixed);
  } catch {}

  return null;
};

/* ─── Clamp score to 0-100 integer ─────────────────────────────────────────── */
const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));

/* ═══════════════════════════════════════════════════════════════════════════════
   INTERVIEW AI
   Used by: POST /api/interview/ai
   Receives conversation history + system prompt, returns next interviewer turn.
═══════════════════════════════════════════════════════════════════════════════ */
export const runInterviewTurn = async (messages, systemPrompt) => {
  // Build proper OpenAI-compatible messages array
  const groqMessages = [];

  // System prompt as first system message
  if (systemPrompt) {
    groqMessages.push({ role: "system", content: systemPrompt });
  }

  // Add conversation history (user/assistant alternating)
  for (const m of messages) {
    if (m.role === "user" || m.role === "assistant") {
      groqMessages.push({ role: m.role, content: m.content });
    }
  }

  console.log(`[Groq Interview] Sending ${groqMessages.length} messages to ${GROQ_MODEL}`);

  const text = await chatCompletion(groqMessages, {
    model:       GROQ_MODEL,
    retries:     2,
    timeoutMs:   35000,
    maxTokens:   1024,
    temperature: 0.8,
  });

  return text.trim();
};

/* ═══════════════════════════════════════════════════════════════════════════════
   RESUME VALIDATION
   Used by: POST /api/resume/analyze (step 1)
   Returns: { isResume: boolean, reason: string }
═══════════════════════════════════════════════════════════════════════════════ */
export const validateResume = async (extractedText) => {
  const systemPrompt = `You are an ATS Resume Validator. Your only job is to determine whether a document is a genuine resume/CV.

A valid resume contains sections such as: contact information, education, skills, work experience, projects, certifications, or professional summary.

Reject these as NOT a resume:
- Blank, empty, or near-empty documents
- Random unrelated text or gibberish
- Class notes, lecture slides, homework, assignments
- Question papers or exam papers
- Award/course completion certificates
- Image descriptions with no resume content
- Invoices, receipts, financial documents
- Medical records, prescriptions
- Legal documents, contracts
- News articles, blog posts
- Any document clearly not a professional resume/CV

Respond with ONLY valid JSON, no explanation, no markdown:
{"isResume": true, "reason": "Contains education, skills, and work experience sections"}
or
{"isResume": false, "reason": "This appears to be a class assignment, not a resume"}`;

  const userMessage = `Analyze this document and determine if it is a genuine resume/CV:\n\n---\n${extractedText.slice(0, 3000)}\n---`;

  console.log(`[Groq Resume] Validating document (${extractedText.length} chars)...`);

  const raw = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userMessage  },
    ],
    {
      model:       GROQ_MODEL,
      retries:     2,
      timeoutMs:   25000,
      jsonMode:    true,
      maxTokens:   150,
      temperature: 0.1,
    }
  );

  const parsed = parseJSON(raw);
  if (!parsed || typeof parsed.isResume !== "boolean") {
    console.warn("[Groq Resume] Validation parse failed:", raw?.slice(0, 200));
    throw new Error("AI validation returned unexpected response. Please try again.");
  }

  console.log(`[Groq Resume] Validation: isResume=${parsed.isResume}, reason="${parsed.reason}"`);
  return parsed;
};

/* ═══════════════════════════════════════════════════════════════════════════════
   RESUME ATS ANALYSIS
   Used by: POST /api/resume/analyze (step 2 — only after validation passes)
   Returns: Full ATS analysis object
═══════════════════════════════════════════════════════════════════════════════ */
export const analyzeResume = async (extractedText, fileName) => {
  const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume analyzer and senior technical recruiter with 20+ years at top tech companies (Google, Meta, Amazon).

Your analysis must be SPECIFIC to the actual resume content — not generic advice.

SCORING:
- 85-100: Exceptional — strong metrics, excellent keywords, impressive projects
- 70-84: Good — solid background, minor gaps
- 50-69: Average — needs more detail or keywords
- 30-49: Below average — significant issues
- Below 30: Needs major rework

SKILL EXTRACTION RULES:
- Extract EVERY technical skill mentioned ANYWHERE: skills section, experience bullets, project descriptions, education
- Include: languages, frameworks, libraries, databases, cloud services, tools, DevOps, AI/ML
- Do NOT skip skills just because they appear in context rather than a list

Respond with ONLY valid JSON matching this EXACT structure:
{
  "atsScore": <integer 0-100>,
  "summary": "<2-3 honest sentences about THIS specific resume>",
  "strengths": ["<specific strength>", "<specific strength>", "<specific strength>"],
  "improvements": ["<specific improvement>", "<specific improvement>", "<specific improvement>", "<specific improvement>"],
  "technicalSkills": ["<every technical skill found>"],
  "softSkills": ["<soft skills found>"],
  "education": {"score": <0-100>, "details": "<degree, institution, year>", "feedback": "<specific feedback>"},
  "experience": {"score": <0-100>, "yearsEstimate": "<X years>", "feedback": "<specific feedback>"},
  "projects": {"score": <0-100>, "count": <number>, "feedback": "<specific feedback>"},
  "missingKeywords": ["<important missing keyword>"],
  "suggestions": ["<actionable suggestion>", "<actionable suggestion>", "<actionable suggestion>", "<actionable suggestion>"],
  "trendingSkills": ["<5 trending skills in this field>"],
  "recommendedTech": ["<5 technologies to learn>"],
  "sections": {"skillsScore": <0-100>, "experienceScore": <0-100>, "projectsScore": <0-100>, "formatScore": <0-100>},
  "overallFeedback": "<3-4 sentences of professional recruiter feedback>"
}`;

  const userMessage = `Analyze this resume thoroughly (file: ${fileName}):\n\n---\n${extractedText.slice(0, 7000)}\n---`;

  console.log(`[Groq Resume] Running ATS analysis for: ${fileName}`);

  const raw = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userMessage  },
    ],
    {
      model:       GROQ_MODEL,
      retries:     2,
      timeoutMs:   45000,
      jsonMode:    true,
      maxTokens:   2048,
      temperature: 0.3,
    }
  );

  const parsed = parseJSON(raw);
  if (!parsed || typeof parsed.atsScore !== "number") {
    console.error("[Groq Resume] ATS parse failed:", raw?.slice(0, 300));
    throw new Error("AI returned unexpected analysis format. Please try again.");
  }

  // Clamp all scores
  parsed.atsScore = clamp(parsed.atsScore);
  if (parsed.sections) {
    parsed.sections.skillsScore     = clamp(parsed.sections.skillsScore);
    parsed.sections.experienceScore = clamp(parsed.sections.experienceScore);
    parsed.sections.projectsScore   = clamp(parsed.sections.projectsScore);
    parsed.sections.formatScore     = clamp(parsed.sections.formatScore);
  }
  if (parsed.education)  parsed.education.score  = clamp(parsed.education.score);
  if (parsed.experience) parsed.experience.score = clamp(parsed.experience.score);
  if (parsed.projects)   parsed.projects.score   = clamp(parsed.projects.score);

  // Ensure all arrays are arrays
  ["strengths","improvements","technicalSkills","softSkills",
   "missingKeywords","suggestions","trendingSkills","recommendedTech",
  ].forEach(k => { if (!Array.isArray(parsed[k])) parsed[k] = []; });

  console.log(`[Groq Resume] ✅ ATS done — Score: ${parsed.atsScore}, Skills: ${parsed.technicalSkills.length}`);
  return parsed;
};
