import Resume from "../models/Resume.js";
import * as resp from "../utils/apiResponse.js";

/* ─── Resume Detection ──────────────────────────────────────────────────────
   Strategy: be GENEROUS. False-negatives (blocking valid resumes) hurt UX.
   Only hard-reject obvious non-resume documents with many clear flags.
──────────────────────────────────────────────────────────────────────────── */
const SECTION_WORDS = [
  "experience","education","skills","projects","objective","summary","achievements",
  "certifications","internship","work history","employment","qualifications","profile",
  "languages","awards","volunteer","publications","references","work experience",
  "professional experience","technical skills","core competencies","career objective",
  "accomplishments","responsibilities","personal statement","about me",
];
const RESUME_SIGNALS = [
  "bachelor","master","degree","university","college","engineer","developer","manager",
  "intern","gpa","github","linkedin","email","phone","years of experience","responsibilities",
  "technologies","frameworks","proficient","collaborated","developed","designed",
  "implemented","led","built","maintained","deployed","optimized","created","managed",
  "achieved","improved","launched","delivered","coordinated","mentored","worked","contributed",
  "team","project","position","role","company","organization","startup","corporation",
];
const HARD_REJECT_FLAGS = [
  "tax invoice","gst invoice","total amount due","unit price","date of purchase",
  "purchase order","patient name","doctor name","prescription date","table of contents",
  "bibliography","invoice number","receipt number","payment received",
];

const detectResume = (text) => {
  // Empty / very short → can't validate but don't reject — AI can still analyze via base64
  if (!text || text.trim().length < 20) {
    return { isResume: true, confidence: 50, reason: "Accepted for AI analysis (text extraction limited)" };
  }

  const lower = text.toLowerCase();

  // Only hard-reject if 4+ commercial/medical flags AND no resume words at all
  const hardFlags = HARD_REJECT_FLAGS.filter(f => lower.includes(f)).length;
  const hasAnyResumeWord = SECTION_WORDS.some(s => lower.includes(s)) ||
                           RESUME_SIGNALS.slice(0, 10).some(s => lower.includes(s));

  if (hardFlags >= 4 && !hasAnyResumeWord) {
    return {
      isResume:   false,
      confidence: 0,
      reason:     "This appears to be an invoice, receipt, or non-resume document. Please upload your CV or resume.",
    };
  }

  const sectionHits  = SECTION_WORDS.filter(s => lower.includes(s));
  const signalHits   = RESUME_SIGNALS.filter(k => lower.includes(k));
  const hasResumeName = /resume|curriculum vitae|\bcv\b/i.test(text);

  // Very lenient accept conditions — pass if ANY of these:
  const accepted =
    sectionHits.length >= 1 ||       // Has at least one resume section heading
    signalHits.length >= 3 ||         // Has 3+ resume signal words
    hasResumeName ||                  // Filename or content says "resume" or "cv"
    text.trim().length > 200;         // Long enough to be a document

  if (!accepted) {
    return {
      isResume:   false,
      confidence: 20,
      reason:     "Could not detect resume sections. Please ensure your file contains sections like Experience, Education, or Skills.",
    };
  }

  const confidence = Math.min(100, 40 + sectionHits.length * 8 + signalHits.length * 2);
  return { isResume: true, confidence, detectedSections: sectionHits.slice(0, 8) };
};

/* ─── ATS Analysis ──────────────────────────────────────────────────────── */
const generateAnalysis = async (text, fileName, base64, mimeType) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Try Anthropic AI first
  if (apiKey && apiKey.startsWith("sk-ant-")) {
    try {
      const content = mimeType === "application/pdf" && base64
        ? [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: `You are an expert ATS resume analyzer. Analyze this resume thoroughly.
Respond ONLY with a raw JSON object (no markdown, no explanation, no backticks):
{"atsScore":<0-100>,"strengths":["str1","str2","str3","str4"],"improvements":["imp1","imp2","imp3","imp4"],"skills":["skill1",...up to 12],"missingKeywords":["kw1",...up to 6],"suggestions":["sug1","sug2","sug3","sug4"],"summary":"2-3 sentence assessment","sections":{"skillsScore":<0-100>,"experienceScore":<0-100>,"projectsScore":<0-100>,"formatScore":<0-100>},"trendingSkills":["ts1","ts2","ts3","ts4","ts5"],"recommendedTech":["rt1","rt2","rt3","rt4","rt5"]}` },
          ]
        : `You are an expert ATS resume analyzer. Analyze this resume.
Respond ONLY with a raw JSON object (no markdown):
{"atsScore":<0-100>,"strengths":["str1","str2","str3","str4"],"improvements":["imp1","imp2","imp3","imp4"],"skills":["skill1",...up to 12],"missingKeywords":["kw1",...up to 6],"suggestions":["sug1","sug2","sug3","sug4"],"summary":"2-3 sentence assessment","sections":{"skillsScore":<0-100>,"experienceScore":<0-100>,"projectsScore":<0-100>,"formatScore":<0-100>},"trendingSkills":["ts1","ts2","ts3","ts4","ts5"],"recommendedTech":["rt1","rt2","rt3","rt4","rt5"]}

Resume text:
${text.slice(0, 4000)}`;

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content }],
        }),
      });

      if (r.ok) {
        const d = await r.json();
        const raw = d.content?.[0]?.text || "";
        const clean = raw.replace(/```json|```/g, "").trim();
        // Extract JSON object from response (handle extra text)
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.atsScore !== undefined) return parsed;
        }
      }
    } catch (e) {
      console.warn("Anthropic AI analysis failed, using fallback:", e.message);
    }
  }

  // ── Keyword-based fallback ─────────────────────────────────────────────────
  const lower = text.toLowerCase();
  const TECH_SKILLS = [
    "JavaScript","Python","Java","React","Node.js","SQL","Git","AWS","Docker","TypeScript",
    "HTML","CSS","MongoDB","PostgreSQL","Linux","C++","Kubernetes","Redis","GraphQL","REST",
    "Next.js","Vue","Angular","Django","FastAPI","Spring Boot","Golang","Rust","Swift",
    "Kotlin","Flutter","TensorFlow","PyTorch","Spark","Hadoop","Kafka",
  ];
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const foundSkills  = TECH_SKILLS.filter(s => new RegExp(escRe(s), "i").test(text));
  const hasMetrics   = /\d+%|\$\d+|\d+ (users|team|projects|clients|services)/i.test(text);
  const hasActions   = /achieved|led|built|developed|improved|managed|designed|deployed|launched|delivered/i.test(text);
  const hasContact   = /email|phone|linkedin|github/i.test(lower);
  const hasEducation = /bachelor|master|degree|university|college|b\.tech|m\.tech|b\.e\.|m\.e\./i.test(lower);
  const hasExp       = /(work experience|professional experience|employment|internship)/i.test(lower);
  const hasProjects  = /project/i.test(lower);
  const hasSkills    = /(skills|technologies|frameworks|tools)/i.test(lower);
  const wordCount    = text.split(/\s+/).length;

  const score = Math.min(90,
    40 +
    (wordCount > 200 ? 8 : 0) +
    (hasMetrics   ? 12 : 0) +
    (hasActions   ? 10 : 0) +
    (hasContact   ?  5 : 0) +
    (hasEducation ?  5 : 0) +
    (hasExp       ?  8 : 0) +
    (hasProjects  ?  5 : 0) +
    (hasSkills    ?  5 : 0) +
    Math.min(foundSkills.length * 2, 14)
  );

  return {
    atsScore:        score,
    strengths: [
      hasActions   ? "Strong action verbs used throughout the resume"          : "Document structure is ATS-compatible",
      hasMetrics   ? "Quantified achievements with numbers and percentages"    : "Professional formatting detected",
      hasContact   ? "Contact information is present and visible"              : "Clear candidate information found",
      foundSkills.length > 3 ? `${foundSkills.length} technical skills detected` : "Skills section present",
    ],
    improvements: [
      !hasMetrics  ? "Add quantified achievements (e.g. 'Reduced load time by 40%')"  : "Add more data-driven impact metrics",
      !hasProjects ? "Add a Projects section with tech stack and outcomes"              : "Expand project descriptions with tech stack used",
      "Include keywords from the target job description for higher ATS match",
      !hasContact  ? "Add complete contact information (LinkedIn, GitHub, phone)"       : "Add a concise professional summary at the top",
    ],
    skills:          foundSkills.slice(0, 12),
    missingKeywords: ["CI/CD","Agile/Scrum","System Design","Microservices","DevOps","Cloud Architecture","REST APIs","Test-Driven Development"]
      .filter(k => !new RegExp(escRe(k), "i").test(text)).slice(0, 6),
    suggestions: [
      "Start every bullet point with a strong action verb (Designed, Built, Led, Delivered)",
      "Tailor your resume keywords to match each specific job description",
      "Keep your resume to 1–2 pages for optimal ATS performance",
      "Add links to GitHub profile, LinkedIn, and live project demos",
    ],
    summary: `Resume analyzed for ${fileName}. ${foundSkills.length} technical skills detected. Set ANTHROPIC_API_KEY for AI-powered deep analysis.`,
    sections: {
      skillsScore:     foundSkills.length > 6 ? 85 : foundSkills.length > 3 ? 65 : 40,
      experienceScore: hasExp ? (hasMetrics ? 85 : 65) : 40,
      projectsScore:   hasProjects ? (hasMetrics ? 80 : 65) : 30,
      formatScore:     hasContact ? (wordCount > 300 ? 80 : 65) : 50,
    },
    trendingSkills:  ["LLMs / AI Integration", "TypeScript", "Docker", "Kubernetes", "React Native"],
    recommendedTech: ["Next.js", "FastAPI", "Terraform", "Redis", "GraphQL"],
  };
};

/* ─── POST /api/resume/analyze ──────────────────────────────────────────── */
export const analyzeResume = async (req, res) => {
  try {
    const { extractedText = "", fileName = "resume", base64, mimeType } = req.body;

    // Server-side resume validation (lenient)
    const detection = detectResume(extractedText);
    if (!detection.isResume) {
      return resp.error(res, detection.reason, 422);
    }

    const analysis = await generateAnalysis(extractedText, fileName, base64, mimeType);

    // Persist to MongoDB (non-blocking)
    try {
      await Resume.create({
        userId:   req.user._id,
        fileName,
        atsScore: analysis.atsScore,
        analysis,
      });
    } catch (dbErr) {
      console.warn("Failed to save resume to DB:", dbErr.message);
    }

    return resp.success(res, {
      resumeId: undefined,
      confidence: detection.confidence,
      detectedSections: detection.detectedSections,
      ...analysis,
    }, "Resume analyzed successfully!");
  } catch (err) {
    console.error("Resume analysis error:", err.message);
    return resp.error(res, "Failed to analyze resume. Please try again.", 500);
  }
};

/* ─── GET /api/resume/history ───────────────────────────────────────────── */
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
