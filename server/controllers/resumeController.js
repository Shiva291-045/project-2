import Resume from "../models/Resume.js";
import * as resp from "../utils/apiResponse.js";

/* ─── Resume section keywords (must find at least 2) ───────────────────────── */
const SECTION_WORDS = [
  "experience", "education", "skills", "projects", "objective", "summary",
  "achievements", "certifications", "internship", "work history", "employment",
  "qualifications", "profile", "accomplishments", "responsibilities",
  "work experience", "professional experience", "technical skills",
  "core competencies", "career objective", "personal statement", "about me",
  "languages", "awards", "volunteer", "publications", "references",
];

/* ─── Strong resume signal words (must find at least 5) ────────────────────── */
const RESUME_SIGNALS = [
  "bachelor", "master", "degree", "university", "college", "engineer",
  "developer", "manager", "intern", "gpa", "github", "linkedin",
  "years of experience", "responsibilities", "technologies", "frameworks",
  "proficient", "collaborated", "developed", "designed", "implemented",
  "led", "built", "maintained", "deployed", "optimized", "created",
  "achieved", "improved", "launched", "delivered", "coordinated",
  "team", "position", "role", "company", "organization", "startup",
];

/* ─── Non-resume document flags ─────────────────────────────────────────────── */
const NON_RESUME_FLAGS = [
  // Invoice / financial
  "tax invoice", "gst invoice", "total amount due", "unit price",
  "date of purchase", "purchase order", "invoice number", "receipt number",
  "payment received", "subtotal", "grand total", "amount paid",
  "billing address", "shipping address", "item description", "qty",
  // Medical
  "patient name", "doctor name", "prescription date", "diagnosis",
  "medication", "dosage", "clinic name", "hospital name",
  // Legal / academic
  "table of contents", "bibliography", "chapter ", "section ",
  "plaintiff", "defendant", "hereby", "whereas", "affidavit",
  // Food / menu
  "menu", "calories", "ingredients", "serving size", "allergens",
];

/* ─── Core validation ────────────────────────────────────────────────────────── */
const detectResume = (text, fileName = "") => {
  const trimmed = text?.trim() || "";
  const lower   = trimmed.toLowerCase();
  const fileL   = fileName.toLowerCase();

  // ── 1. Empty / unreadable PDF ──────────────────────────────────────────────
  if (trimmed.length < 50) {
    // Could be a scanned PDF — accept but flag low confidence
    return { isResume: true, confidence: 30, scanned: true };
  }

  // ── 2. Hard reject obvious non-resume docs ─────────────────────────────────
  const nonResumeHits = NON_RESUME_FLAGS.filter(f => lower.includes(f));
  if (nonResumeHits.length >= 3) {
    // Only reject if also NO resume sections present
    const hasSections = SECTION_WORDS.filter(s => lower.includes(s)).length >= 1;
    if (!hasSections) {
      return {
        isResume: false,
        confidence: 0,
        reason: `This file does not appear to be a resume. It looks like a ${
          nonResumeHits.some(f => f.includes("invoice") || f.includes("total") || f.includes("billing"))
            ? "financial document or invoice"
            : nonResumeHits.some(f => f.includes("patient") || f.includes("prescription"))
            ? "medical document"
            : nonResumeHits.some(f => f.includes("chapter") || f.includes("bibliography"))
            ? "academic document"
            : "non-resume document"
        }. Please upload your CV or resume.`,
      };
    }
  }

  // ── 3. Score how resume-like this document is ─────────────────────────────
  const sectionHits = SECTION_WORDS.filter(s => lower.includes(s));
  const signalHits  = RESUME_SIGNALS.filter(s => lower.includes(s));

  // Filename bonus
  const fileBonus = /resume|cv|curriculum/i.test(fileL) ? 3 : 0;

  // Total evidence points
  const evidence = sectionHits.length + Math.floor(signalHits.length / 2) + fileBonus;

  // Contact info signals
  const hasEmail   = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(trimmed);
  const hasPhone   = /(\+?\d[\d\s\-().]{7,}\d)/.test(trimmed);
  const hasContact = hasEmail || hasPhone;

  // Reject if very low evidence AND no contact info AND document is long
  // (a long random document with no resume signals is not a resume)
  if (evidence < 2 && !hasContact && trimmed.length > 300) {
    return {
      isResume: false,
      confidence: 10,
      reason: "This file does not contain typical resume sections (Experience, Education, Skills, etc.). Please upload a proper CV or resume file.",
    };
  }

  // Reject if very low evidence AND short — probably a random file
  if (evidence < 1 && !hasContact) {
    return {
      isResume: false,
      confidence: 5,
      reason: "Could not detect resume content. Please upload a CV or resume with sections like Education, Skills, and Experience.",
    };
  }

  const confidence = Math.min(100, 35 + sectionHits.length * 10 + signalHits.length * 2 + (hasContact ? 10 : 0));
  return {
    isResume: true,
    confidence,
    detectedSections: sectionHits.slice(0, 8),
    signalCount: signalHits.length,
  };
};

/* ─── ATS Analysis (AI + keyword fallback) ──────────────────────────────────── */
const generateAnalysis = async (text, fileName, base64, mimeType, detection) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── Try Anthropic AI ─────────────────────────────────────────────────────
  if (apiKey && apiKey.startsWith("sk-ant-")) {
    try {
      const isPdf    = mimeType === "application/pdf" && base64;
      const prompt   = `You are a strict, expert ATS resume analyzer and recruiter with 15+ years experience.

TASK: Analyze the provided resume carefully and return a JSON analysis.

RULES:
- Be ACCURATE — scores must reflect actual content quality, not generic values
- ATS Score 85-100: Exceptional resume with strong sections, metrics, keywords, formatting
- ATS Score 70-84: Good resume, minor gaps
- ATS Score 50-69: Average resume, needs work
- ATS Score below 50: Poor resume, major issues
- Base ALL scoring on actual content found in the resume
- Extract ONLY skills that actually appear in the resume
- Identify keywords specifically MISSING from this resume

Respond ONLY with a valid JSON object (no markdown, no extra text):
{"atsScore":<0-100>,"strengths":["specific strength 1","specific strength 2","specific strength 3"],"improvements":["specific improvement 1","specific improvement 2","specific improvement 3","specific improvement 4"],"skills":["only skills found in resume"...],"missingKeywords":["keywords missing from this resume"...],"suggestions":["actionable suggestion 1","actionable suggestion 2","actionable suggestion 3","actionable suggestion 4"],"summary":"2-3 sentence honest assessment of THIS specific resume","sections":{"skillsScore":<0-100>,"experienceScore":<0-100>,"projectsScore":<0-100>,"formatScore":<0-100>},"trendingSkills":["5 trending skills relevant to this person's field"],"recommendedTech":["5 technologies to learn based on their background"]}`;

      const userContent = isPdf
        ? [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: prompt },
          ]
        : `${prompt}\n\nResume content:\n${text.slice(0, 6000)}`;

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":    "application/json",
          "x-api-key":       apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: userContent }],
        }),
      });

      if (r.ok) {
        const d   = await r.json();
        const raw = d.content?.[0]?.text || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed?.atsScore === "number") return { ...parsed, source: "ai" };
        }
      }
    } catch (e) {
      console.warn("Anthropic analysis failed, using keyword fallback:", e.message);
    }
  }

  // ── Keyword-based fallback ─────────────────────────────────────────────────
  const lower = text.toLowerCase();
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const TECH_SKILLS = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Swift",
    "Kotlin", "React", "Vue", "Angular", "Next.js", "Node.js", "Express", "Django",
    "FastAPI", "Spring Boot", "Flutter", "React Native", "AWS", "GCP", "Azure",
    "Docker", "Kubernetes", "Terraform", "Git", "CI/CD", "Jenkins", "GitHub Actions",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "GraphQL", "REST",
    "Microservices", "System Design", "Agile", "Scrum", "Machine Learning", "TensorFlow",
    "PyTorch", "SQL", "Linux", "HTML", "CSS", "Tailwind", "Bootstrap",
  ];

  const foundSkills  = TECH_SKILLS.filter(s => new RegExp(escRe(s), "i").test(text));
  const hasMetrics   = /\d+%|\$[\d,]+|\d+\s*(users|customers|clients|team members|engineers|services|requests|ms|seconds)/i.test(text);
  const hasActions   = /\b(achieved|led|built|developed|improved|managed|designed|deployed|launched|delivered|optimized|created|established|reduced|increased|scaled|architected)\b/i.test(text);
  const hasEmail     = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(text);
  const hasPhone     = /(\+?\d[\d\s\-().]{7,}\d)/.test(text);
  const hasLinkedIn  = /linkedin\.com/i.test(text);
  const hasGitHub    = /github\.com/i.test(text);
  const hasEducation = /bachelor|master|b\.tech|m\.tech|b\.e\.|m\.e\.|b\.sc|m\.sc|ph\.d|degree|university|college/i.test(lower);
  const hasExp       = /work experience|professional experience|employment history|internship/i.test(lower);
  const hasProjects  = /\bprojects?\b/i.test(text);
  const hasSummary   = /summary|objective|profile|about me/i.test(lower);
  const wordCount    = text.split(/\s+/).filter(Boolean).length;

  // Realistic score based on actual content
  let score = 30; // base
  if (hasEmail)     score += 5;
  if (hasPhone)     score += 3;
  if (hasLinkedIn)  score += 4;
  if (hasGitHub)    score += 4;
  if (hasEducation) score += 8;
  if (hasExp)       score += 10;
  if (hasProjects)  score += 7;
  if (hasSummary)   score += 5;
  if (hasActions)   score += 8;
  if (hasMetrics)   score += 10;
  score += Math.min(foundSkills.length * 2, 20); // max 20 from skills
  if (wordCount > 400) score += 4;
  if (wordCount > 700) score += 4;
  score = Math.min(score, 92); // cap — perfect scores need AI

  const sectionScore = (base, bonus) => Math.min(100, base + bonus);

  return {
    atsScore: score,
    source:   "keyword",
    strengths: [
      hasActions   ? "Uses strong action verbs in experience descriptions"      : "Basic resume structure detected",
      hasMetrics   ? "Contains quantified achievements with numbers/percentages" : hasExp ? "Work experience section present" : "Education section detected",
      foundSkills.length > 5 ? `${foundSkills.length} technical skills detected: ${foundSkills.slice(0, 4).join(", ")}…` : foundSkills.length > 0 ? `Skills detected: ${foundSkills.join(", ")}` : "Document format is parseable",
      (hasLinkedIn || hasGitHub) ? "Professional online presence (LinkedIn/GitHub)" : hasEmail ? "Contact information present" : "File successfully parsed",
    ].filter(Boolean),
    improvements: [
      !hasMetrics  ? "Add quantified achievements: 'Reduced load time by 40%', 'Led team of 5'" : "Add more specific metrics and measurable outcomes",
      !hasProjects ? "Add a Projects section with tech stack and impact" : "Expand project descriptions with technologies used and outcomes",
      foundSkills.length < 5 ? "Add a dedicated Skills section with relevant technologies" : "Tailor skills section to match target job descriptions",
      !hasLinkedIn && !hasGitHub ? "Add LinkedIn and GitHub profile links" : !hasSummary ? "Add a professional summary at the top of the resume" : "Include more industry-relevant keywords",
    ],
    skills: foundSkills.slice(0, 12),
    missingKeywords: [
      "CI/CD", "Agile", "System Design", "Microservices", "DevOps",
      "Cloud Architecture", "REST APIs", "Test-Driven Development",
      "Docker", "Kubernetes", "AWS", "Machine Learning",
    ].filter(k => !new RegExp(escRe(k), "i").test(text)).slice(0, 6),
    suggestions: [
      "Start every bullet with a strong action verb (Built, Designed, Led, Optimized)",
      "Add numbers to every achievement — even estimates are better than none",
      "Tailor resume keywords to match each specific job description",
      "Keep to 1–2 pages and use consistent formatting throughout",
    ],
    summary: `Resume analyzed using keyword matching (AI analysis requires ANTHROPIC_API_KEY). ${foundSkills.length} technical skills found. ATS score: ${score}/100 — ${score >= 70 ? "good foundation" : score >= 50 ? "needs improvements" : "significant work needed"}.`,
    sections: {
      skillsScore:     sectionScore(30, foundSkills.length * 4),
      experienceScore: sectionScore(20, (hasExp ? 25 : 0) + (hasActions ? 20 : 0) + (hasMetrics ? 20 : 0)),
      projectsScore:   sectionScore(20, (hasProjects ? 30 : 0) + (hasGitHub ? 20 : 0)),
      formatScore:     sectionScore(30, (hasEmail ? 15 : 0) + (hasPhone ? 10 : 0) + (hasSummary ? 15 : 0) + (wordCount > 300 ? 10 : 0)),
    },
    trendingSkills:  ["LLMs / AI Integration", "TypeScript", "Cloud-Native", "Kubernetes", "React/Next.js"],
    recommendedTech: ["Next.js", "FastAPI", "Terraform", "Redis", "GraphQL"],
  };
};

/* ─── POST /api/resume/analyze ──────────────────────────────────────────────── */
export const analyzeResume = async (req, res) => {
  try {
    const { extractedText = "", fileName = "resume", base64, mimeType } = req.body;

    // Validate it's actually a resume
    const detection = detectResume(extractedText, fileName);

    if (!detection.isResume) {
      return resp.error(res, detection.reason, 422);
    }

    const analysis = await generateAnalysis(extractedText, fileName, base64, mimeType, detection);

    // Save to DB (non-blocking)
    try {
      await Resume.create({ userId: req.user._id, fileName, atsScore: analysis.atsScore, analysis });
    } catch (dbErr) {
      console.warn("DB save failed:", dbErr.message);
    }

    return resp.success(res, {
      confidence:       detection.confidence,
      detectedSections: detection.detectedSections,
      scanned:          detection.scanned || false,
      ...analysis,
    }, "Resume analyzed successfully!");

  } catch (err) {
    console.error("Resume analysis error:", err.message);
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
    return resp.error(res, "Failed to fetch resume history.", 500);
  }
};
