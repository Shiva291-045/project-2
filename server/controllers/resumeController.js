import Resume from "../models/Resume.js";
import * as resp from "../utils/apiResponse.js";

// ── Resume detection keywords ─────────────────────────────────────────────────
const RESUME_SECTIONS  = ["experience","education","skills","projects","objective","summary","achievements","certifications","internship","work history","employment","qualification","profile","contact","languages","awards","volunteer","publications","references","work experience","professional experience","technical skills","core competencies","career objective"];
const RESUME_KEYWORDS  = ["bachelor","master","degree","university","college","engineer","developer","manager","intern","gpa","github","linkedin","email","phone","years","responsibilities","technologies","frameworks","proficient","collaborated","developed","designed","implemented","led","built","maintained","deployed","optimized","created","managed","achieved","improved","launched","delivered","coordinated","mentored","worked","contributed"];
const NON_RESUME_FLAGS = ["invoice","receipt","bill","total amount","gst","tax invoice","payment","order id","product","quantity","unit price","customer","vendor","date of purchase","terms and conditions","warranty","claim","prescription","diagnosis","patient","doctor","chapter","table of contents","bibliography","appendix","dear sir","to whom it may concern","as discussed","please find attached","regards","yours sincerely"];

const detectResume = (text) => {
  if (!text || text.trim().length < 80)
    return { isResume: false, confidence: 0, reason: "The file appears to be empty or has very little text content." };

  const lower = text.toLowerCase();
  const flagCount = NON_RESUME_FLAGS.filter((f) => lower.includes(f)).length;

  if (flagCount >= 4)
    return { isResume: false, confidence: 0, reason: "This appears to be an invoice, receipt, or non-resume document. Please upload your actual CV or resume." };

  const sectionHits = RESUME_SECTIONS.filter((s) => lower.includes(s));
  const keywordHits = RESUME_KEYWORDS.filter((k) => lower.includes(k));

  // Accept if ≥1 section OR ≥4 keywords (lenient for scanned/poorly-extracted PDFs)
  if (sectionHits.length < 1 && keywordHits.length < 4) {
    return {
      isResume:   false,
      confidence: Math.min(35, sectionHits.length * 10 + keywordHits.length * 5),
      reason:     "The uploaded file does not appear to be a resume. Please upload a document containing sections like Education, Skills, Experience, or Projects.",
    };
  }

  const confidence = Math.min(100, 45 + sectionHits.length * 7 + keywordHits.length * 2);
  return { isResume: true, confidence, detectedSections: sectionHits.slice(0, 6) };
};

// ── ATS analysis (AI-powered with keyword extraction) ────────────────────────
const generateAnalysis = async (text, fileName, base64, mimeType) => {
  // Try Claude API
  try {
    const content = mimeType === "application/pdf" && base64
      ? [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: `Analyze this resume as an expert ATS system. Respond ONLY with raw JSON, no markdown:\n{"atsScore":<0-100>,"strengths":["...x4"],"improvements":["...x4"],"skills":["...x8"],"missingKeywords":["...x6"],"suggestions":["...x4"],"summary":"2-sentence overview","sections":{"skillsScore":<0-100>,"experienceScore":<0-100>,"projectsScore":<0-100>,"formatScore":<0-100>},"trendingSkills":["...x5"],"recommendedTech":["...x5"]}` },
        ]
      : `Analyze this resume. Respond ONLY with raw JSON:\n{"atsScore":<0-100>,"strengths":[],"improvements":[],"skills":[],"missingKeywords":[],"suggestions":[],"summary":"","sections":{"skillsScore":<0-100>,"experienceScore":<0-100>,"projectsScore":<0-100>,"formatScore":<0-100>},"trendingSkills":[],"recommendedTech":[]}\n\nResume:\n${text.slice(0,3000)}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, messages: [{ role: "user", content }] }),
    });

    if (r.ok) {
      const d = await r.json();
      const raw = d.content?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed && parsed.atsScore) return parsed;
    }
  } catch {}

  // Fallback: deterministic keyword-based analysis
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).length;
  const hasMetrics = /\d+%|\$\d+|\d+ (users|team|projects|clients)/i.test(text);
  const hasActions = /achieved|led|built|developed|improved|managed|designed|deployed|launched/i.test(text);
  const hasContact = /email|phone|linkedin|github/i.test(lower);
  const hasEducation = /bachelor|master|degree|university|college/i.test(lower);
  const hasExperience = /(work experience|professional experience|experience)/i.test(lower);
  const hasProjects = /project/i.test(lower);
  const hasSkills = /skills|technologies|frameworks/i.test(lower);

  const baseScore = 40
    + (words > 200 ? 10 : 0)
    + (hasMetrics ? 12 : 0)
    + (hasActions ? 10 : 0)
    + (hasContact ? 5 : 0)
    + (hasEducation ? 5 : 0)
    + (hasExperience ? 8 : 0)
    + (hasProjects ? 5 : 0)
    + (hasSkills ? 5 : 0);

  const TECH_SKILLS = ["JavaScript","Python","Java","React","Node.js","SQL","Git","AWS","Docker","TypeScript","HTML","CSS","MongoDB","PostgreSQL","Linux","C++","Kubernetes","Redis","GraphQL","REST"];
  const foundSkills = TECH_SKILLS.filter((s) => new RegExp(s, "i").test(text));

  return {
    atsScore:        Math.min(92, baseScore),
    strengths:       [
      hasActions  ? "Strong action verbs throughout the resume" : "Document structure is ATS-compatible",
      hasMetrics  ? "Quantified achievements with numbers and percentages" : "Professional formatting detected",
      hasContact  ? "Contact information is present" : "Clear candidate information",
      foundSkills.length > 3 ? "Strong technical skills section" : "Skills section detected",
    ],
    improvements:   [
      !hasMetrics   ? "Add quantified achievements (e.g. 'Reduced load time by 40%')" : "Consider adding more data-driven results",
      !hasProjects  ? "Add a Projects section with descriptions" : "Expand project descriptions with tech stack used",
      "Include keywords from target job descriptions",
      "Add a professional summary at the top",
    ],
    skills:          foundSkills.slice(0, 10),
    missingKeywords: ["CI/CD","Agile","System Design","Microservices","DevOps","Cloud Architecture"].filter((k) => !new RegExp(k, "i").test(text)).slice(0, 6),
    suggestions:     [
      "Start bullet points with strong action verbs (Designed, Built, Deployed)",
      "Tailor your resume for each specific job description",
      "Keep resume to 1-2 pages for best ATS performance",
      "Add links to GitHub, LinkedIn, or portfolio",
    ],
    summary:         `Resume for ${fileName} analyzed. ${foundSkills.length} technical skills detected. Add your Anthropic API key for deeper AI-powered analysis.`,
    sections: {
      skillsScore:     foundSkills.length > 5 ? 80 : foundSkills.length > 2 ? 60 : 40,
      experienceScore: hasExperience ? (hasMetrics ? 85 : 65) : 40,
      projectsScore:   hasProjects ? 70 : 30,
      formatScore:     hasContact ? (words > 300 ? 80 : 65) : 50,
    },
    trendingSkills:  ["LLMs / AI Integration", "TypeScript", "Docker", "Kubernetes", "React Native"],
    recommendedTech: ["Next.js", "FastAPI", "Terraform", "Redis", "GraphQL"],
  };
};

// ── POST /api/resume/analyze ──────────────────────────────────────────────────
export const analyzeResume = async (req, res) => {
  try {
    const { extractedText = "", fileName = "resume", base64, mimeType } = req.body;

    // Validate it's a resume
    const detection = detectResume(extractedText);
    if (!detection.isResume) {
      return resp.error(res, detection.reason, 422);
    }

    const analysis = await generateAnalysis(extractedText, fileName, base64, mimeType);

    // Persist to MongoDB
    const saved = await Resume.create({
      userId:   req.user._id,
      fileName,
      atsScore: analysis.atsScore,
      analysis,
    });

    return resp.success(res, {
      resumeId:   saved._id,
      confidence: detection.confidence,
      detectedSections: detection.detectedSections,
      ...analysis,
    }, "Resume analyzed successfully!");
  } catch (err) {
    console.error("Resume analysis error:", err);
    return resp.error(res, "Failed to analyze resume. Please try again.", 500);
  }
};

// ── GET /api/resume/history ───────────────────────────────────────────────────
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
