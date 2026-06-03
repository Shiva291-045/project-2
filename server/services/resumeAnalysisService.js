/**
 * Resume Analysis Service
 * Production-ready AI-powered ATS analysis with retry logic,
 * comprehensive skill extraction, and clear error reporting.
 */

/* ─── Startup validation ───────────────────────────────────────────────────── */
export const validateApiKey = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error("❌ ANTHROPIC_API_KEY is not set — resume AI analysis will use keyword fallback");
    return { valid: false, reason: "not_set" };
  }
  if (!key.startsWith("sk-ant-")) {
    console.error("❌ ANTHROPIC_API_KEY appears invalid (should start with sk-ant-)");
    return { valid: false, reason: "invalid_format" };
  }
  console.log("✅ ANTHROPIC_API_KEY configured — AI resume analysis enabled");
  return { valid: true };
};

/* ─── Comprehensive skill lists ────────────────────────────────────────────── */
export const SKILL_CATEGORIES = {
  languages: [
    "JavaScript", "TypeScript", "Python", "Java", "C\\+\\+", "C#", "Go", "Golang",
    "Rust", "Swift", "Kotlin", "PHP", "Ruby", "Scala", "R", "MATLAB", "Perl",
    "Dart", "Elixir", "Haskell", "Lua", "Julia", "Bash", "Shell", "PowerShell",
    "Assembly", "COBOL", "Fortran", "Groovy", "Clojure", "Erlang", "F#",
    "Objective-C", "Visual Basic", "VB\\.NET",
  ],
  frontend: [
    "React", "Vue", "Angular", "Svelte", "Next\\.js", "Nuxt", "Gatsby",
    "HTML5?", "CSS3?", "Tailwind", "Bootstrap", "Material.?UI", "Ant Design",
    "Redux", "MobX", "Zustand", "Webpack", "Vite", "Babel", "Sass", "SCSS",
    "Less", "Styled.?Components", "Emotion", "jQuery", "Alpine\\.js",
    "Storybook", "Figma", "Adobe XD",
  ],
  backend: [
    "Node\\.js", "Express", "Nest\\.js", "Django", "Flask", "FastAPI",
    "Spring Boot", "Spring", "Laravel", "Rails", "Ruby on Rails",
    "ASP\\.NET", "\\.NET Core", "Gin", "Echo", "Fiber", "Actix",
    "GraphQL", "REST", "gRPC", "WebSocket", "Kafka", "RabbitMQ",
    "Celery", "Sidekiq", "Nginx", "Apache",
  ],
  mobile: [
    "React Native", "Flutter", "Swift", "SwiftUI", "Kotlin", "Android",
    "iOS", "Xamarin", "Ionic", "Expo", "Capacitor",
  ],
  databases: [
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLite",
    "Oracle", "SQL Server", "DynamoDB", "Cassandra", "CouchDB", "Neo4j",
    "InfluxDB", "TimescaleDB", "Firestore", "Supabase", "PlanetScale",
    "MariaDB", "RethinkDB", "Couchbase",
  ],
  cloud: [
    "AWS", "GCP", "Azure", "Google Cloud", "Heroku", "Vercel", "Netlify",
    "DigitalOcean", "Cloudflare", "Firebase", "Supabase", "Render",
    "Lambda", "EC2", "S3", "RDS", "ECS", "EKS", "CloudFormation",
    "Serverless", "Cloud Functions",
  ],
  devops: [
    "Docker", "Kubernetes", "Terraform", "Ansible", "Puppet", "Chef",
    "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Travis CI",
    "ArgoCD", "Helm", "Istio", "Prometheus", "Grafana", "ELK Stack",
    "Datadog", "New Relic", "Splunk", "CI/CD", "DevOps", "SRE",
    "Linux", "Unix", "Git", "GitHub", "GitLab", "Bitbucket",
  ],
  ai_ml: [
    "TensorFlow", "PyTorch", "Keras", "scikit.?learn", "Pandas",
    "NumPy", "Matplotlib", "Seaborn", "OpenCV", "Hugging Face",
    "LangChain", "OpenAI", "Machine Learning", "Deep Learning",
    "NLP", "Computer Vision", "MLOps", "Spark", "Hadoop",
    "Airflow", "dbt", "Snowflake", "BigQuery", "Databricks",
    "BERT", "GPT", "LLM", "RAG", "Fine.?tuning",
  ],
  practices: [
    "Agile", "Scrum", "Kanban", "TDD", "BDD", "DDD",
    "Microservices", "System Design", "REST.?ful", "API Design",
    "Clean Code", "SOLID", "Design Patterns", "OOP",
    "Functional Programming", "Test.?Driven", "Code Review",
    "Pair Programming", "CI/CD", "DevSecOps",
  ],
};

/* ─── Escape regex special chars ───────────────────────────────────────────── */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ─── Comprehensive skill extraction from text ─────────────────────────────── */
export const extractSkillsFromText = (text) => {
  if (!text || text.trim().length < 10) return [];

  const found = new Set();

  for (const [, skills] of Object.entries(SKILL_CATEGORIES)) {
    for (const skill of skills) {
      // skill may already be a regex pattern (e.g. "C\\+\\+", "HTML5?")
      try {
        const pattern = new RegExp(`(?<![a-zA-Z])${skill}(?![a-zA-Z])`, "i");
        if (pattern.test(text)) {
          // Store the clean display name (un-escaped)
          const display = skill
            .replace(/\\\+/g, "+")
            .replace(/\\\./g, ".")
            .replace(/\?/g, "")
            .replace(/\\/g, "")
            .replace(/\./g, "")
            .trim();
          found.add(display);
        }
      } catch { /* invalid regex pattern — skip */ }
    }
  }

  return [...found];
};

/* ─── Anthropic API call with retry ─────────────────────────────────────────── */
const callAnthropicWithRetry = async (payload, retries = 2) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(payload),
      });

      clearTimeout(timer);

      if (res.status === 429) {
        // Rate limited — wait and retry
        const wait = (attempt + 1) * 2000;
        console.warn(`[Resume AI] Rate limited (attempt ${attempt + 1}), retrying in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (res.status === 529 || res.status >= 500) {
        const wait = (attempt + 1) * 1500;
        console.warn(`[Resume AI] Server error ${res.status} (attempt ${attempt + 1}), retrying in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 200)}`);
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        lastErr = new Error("AI request timed out after 35s");
      } else {
        lastErr = err;
      }
      if (attempt < retries) {
        const wait = (attempt + 1) * 1000;
        console.warn(`[Resume AI] Attempt ${attempt + 1} failed: ${lastErr.message}, retrying in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }

  throw lastErr;
};

/* ─── Parse AI JSON response robustly ──────────────────────────────────────── */
const parseAIResponse = (raw) => {
  if (!raw || typeof raw !== "string") return null;

  // Try direct parse first
  try { const p = JSON.parse(raw); if (p?.atsScore !== undefined) return p; } catch {}

  // Extract first JSON object from response
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const p = JSON.parse(match[0]);
    if (typeof p?.atsScore === "number") return p;
  } catch (e) {
    // Try to fix common JSON issues: trailing commas, unquoted values
    try {
      const fixed = match[0]
        .replace(/,\s*([}\]])/g, "$1")   // trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // unquoted keys
      const p = JSON.parse(fixed);
      if (typeof p?.atsScore === "number") return p;
    } catch {}
  }

  return null;
};

/* ─── AI analysis ──────────────────────────────────────────────────────────── */
export const analyzeWithAI = async (text, fileName, base64, mimeType) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return { success: false, reason: "no_api_key" };
  }

  // Extract skills using our comprehensive extractor (helps even if AI misses some)
  const preExtractedSkills = extractSkillsFromText(text);
  console.log(`[Resume AI] Pre-extracted ${preExtractedSkills.length} skills from text for: ${fileName}`);

  const isPdf = mimeType === "application/pdf" && base64 && base64.length > 100;

  const systemPrompt = `You are an expert ATS resume analyzer and senior technical recruiter with 20+ years experience at FAANG companies.

CRITICAL SKILL EXTRACTION RULES:
- Extract EVERY technical skill, tool, language, framework, library, platform, or certification mentioned ANYWHERE in the resume
- Look in: skills sections, work experience bullet points, project descriptions, education, certifications
- Common skills that are often missed: programming languages in experience bullets (e.g. "wrote Python scripts"), databases mentioned in project stack, cloud services used, testing frameworks, version control tools
- Include: React, Node.js, Python, Java, SQL, Git, Docker, AWS, etc. even if mentioned once
- Do NOT skip skills just because they appear in context rather than a skills list
- These skills were pre-extracted by our system and MUST appear in your output if valid: ${preExtractedSkills.slice(0, 20).join(", ") || "none detected by pre-extractor"}

SCORING RULES:
- Be ACCURATE and SPECIFIC — scores must reflect actual resume quality
- 85-100: Exceptional — strong metrics, relevant keywords, clean format, impressive projects
- 70-84: Good — solid experience but missing some metrics or keywords  
- 50-69: Average — needs more detail, better formatting, or more keywords
- Below 50: Needs significant work

OUTPUT: Respond with ONLY a valid JSON object, no markdown, no explanation:
{"atsScore":<0-100>,"strengths":["specific strength based on actual content"],"improvements":["specific, actionable improvement"],"skills":["every skill found — minimum 5 if any tech is mentioned"],"missingKeywords":["important keywords absent from this resume"],"suggestions":["actionable suggestion"],"summary":"2-3 honest sentences about THIS specific resume","sections":{"skillsScore":<0-100>,"experienceScore":<0-100>,"projectsScore":<0-100>,"formatScore":<0-100>},"trendingSkills":["5 trending skills in this person's field"],"recommendedTech":["5 technologies to learn based on background"]}`;

  try {
    let userContent;

    if (isPdf) {
      // Send PDF directly — Claude reads it natively, much better than extracted text
      userContent = [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        },
        { type: "text", text: systemPrompt },
      ];
      console.log(`[Resume AI] Sending PDF directly to Claude (${Math.round(base64.length * 0.75 / 1024)}KB)`);
    } else {
      // Text or doc — use extracted text
      const resumeText = text?.trim() || "(text extraction failed — analyze based on context)";
      userContent = `${systemPrompt}\n\nResume content:\n${resumeText.slice(0, 8000)}`;
      console.log(`[Resume AI] Sending text (${resumeText.length} chars) to Claude`);
    }

    const data = await callAnthropicWithRetry({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: userContent }],
    });

    const raw    = data.content?.[0]?.text || "";
    const parsed = parseAIResponse(raw);

    if (!parsed) {
      console.error("[Resume AI] Failed to parse AI response:", raw.slice(0, 300));
      return { success: false, reason: "parse_failed", raw };
    }

    // Merge pre-extracted skills with AI skills to ensure none are missed
    const aiSkills  = Array.isArray(parsed.skills) ? parsed.skills : [];
    const allSkills = [...new Set([...aiSkills, ...preExtractedSkills])];

    // Validate and clamp scores
    const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(Number(v) || 0)));
    parsed.atsScore = clamp(parsed.atsScore);
    if (parsed.sections) {
      parsed.sections.skillsScore     = clamp(parsed.sections.skillsScore);
      parsed.sections.experienceScore = clamp(parsed.sections.experienceScore);
      parsed.sections.projectsScore   = clamp(parsed.sections.projectsScore);
      parsed.sections.formatScore     = clamp(parsed.sections.formatScore);
    }

    console.log(`[Resume AI] ✅ Analysis complete — ATS: ${parsed.atsScore}, Skills: ${allSkills.length}`);

    return {
      success: true,
      data: {
        ...parsed,
        skills: allSkills.slice(0, 20),
        source: "ai",
      },
    };

  } catch (err) {
    console.error("[Resume AI] AI analysis failed after retries:", err.message);
    return { success: false, reason: "api_error", error: err.message };
  }
};

/* ─── Keyword-based fallback (honest, no fake high scores) ─────────────────── */
export const analyzeWithKeywords = (text, fileName) => {
  console.log(`[Resume Keyword] Running keyword analysis for: ${fileName}`);

  const skills = extractSkillsFromText(text);
  const lower  = (text || "").toLowerCase();

  const hasMetrics   = /\d+%|\$[\d,]+|\d+\s*(users|customers|clients|team|engineers|services|ms|seconds|requests)/i.test(text);
  const hasActions   = /\b(achieved|led|built|developed|improved|managed|designed|deployed|launched|delivered|optimized|created|reduced|increased|scaled|architected|engineered|automated|migrated)\b/i.test(text);
  const hasEmail     = /\b[\w.+%-]+@[\w.-]+\.[a-z]{2,}\b/i.test(text);
  const hasPhone     = /(\+?\d[\d\s\-().]{7,}\d)/.test(text);
  const hasLinkedIn  = /linkedin\.com/i.test(text);
  const hasGitHub    = /github\.com/i.test(text);
  const hasEducation = /bachelor|master|b\.tech|m\.tech|b\.e\b|m\.e\b|b\.sc|m\.sc|ph\.d|degree|university|college/i.test(lower);
  const hasExp       = /work experience|professional experience|employment|internship/i.test(lower);
  const hasProjects  = /\bprojects?\b/i.test(lower);
  const hasSummary   = /\b(summary|objective|profile|about me)\b/i.test(lower);
  const wordCount    = (text || "").split(/\s+/).filter(Boolean).length;

  // Realistic scoring
  let score = 28;
  if (hasEmail)     score += 5;
  if (hasPhone)     score += 3;
  if (hasLinkedIn)  score += 4;
  if (hasGitHub)    score += 5;
  if (hasEducation) score += 8;
  if (hasExp)       score += 12;
  if (hasProjects)  score += 8;
  if (hasSummary)   score += 4;
  if (hasActions)   score += 8;
  if (hasMetrics)   score += 10;
  score += Math.min(skills.length * 2, 18);
  if (wordCount > 300) score += 3;
  if (wordCount > 600) score += 4;
  score = Math.min(score, 88); // cap — needs AI for higher

  const clamp = (v) => Math.min(100, Math.max(0, v));

  const esc2 = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const missingPool = [
    "CI/CD", "Docker", "Kubernetes", "AWS", "Agile", "System Design",
    "Microservices", "REST APIs", "GraphQL", "TypeScript", "Machine Learning",
    "Test-Driven Development", "DevOps", "Cloud Architecture",
  ].filter(k => !new RegExp(esc2(k), "i").test(text)).slice(0, 6);

  return {
    atsScore: score,
    source:   "keyword",
    strengths: [
      hasActions   ? "Action verbs used in experience descriptions"                          : "Document structure is parseable",
      hasMetrics   ? "Quantified achievements with metrics detected"                         : hasExp ? "Work experience section present" : "Education section detected",
      skills.length > 0
        ? `${skills.length} technical skill${skills.length > 1 ? "s" : ""} found: ${skills.slice(0, 5).join(", ")}${skills.length > 5 ? "…" : ""}`
        : "Resume structure detected",
      (hasLinkedIn || hasGitHub) ? "Professional online presence linked" : hasEmail ? "Contact information present" : "File parsed successfully",
    ].filter(Boolean),
    improvements: [
      !hasMetrics  ? "Add quantified achievements — e.g. 'Improved API speed by 40%', 'Led team of 6'" : "Add more specific data-driven outcomes",
      !hasProjects ? "Add a Projects section with tech stack and measurable impact"                       : "Expand project descriptions with technologies and outcomes",
      skills.length < 6 ? "Add a dedicated Technical Skills section listing all languages, tools, and frameworks" : "Align skills section keywords with your target job descriptions",
      !hasSummary ? "Add a 2-3 sentence professional summary at the top" : "Consider adding more industry-specific keywords",
    ],
    skills: skills.slice(0, 20),
    missingKeywords: missingPool,
    suggestions: [
      "Start every bullet point with a strong action verb (Built, Designed, Led, Deployed, Optimized)",
      "Quantify every achievement — even rough estimates are better than vague descriptions",
      "Tailor your resume keywords for each specific job description you apply to",
      "Keep to 1–2 pages maximum for best ATS compatibility",
    ],
    summary: `Keyword-based analysis (enable AI for deeper insights by setting ANTHROPIC_API_KEY). ${skills.length} technical skill${skills.length !== 1 ? "s" : ""} detected. ATS compatibility score: ${score}/100.`,
    sections: {
      skillsScore:     clamp(28 + skills.length * 5),
      experienceScore: clamp(20 + (hasExp ? 28 : 0) + (hasActions ? 20 : 0) + (hasMetrics ? 20 : 0)),
      projectsScore:   clamp(20 + (hasProjects ? 35 : 0) + (hasGitHub ? 15 : 0)),
      formatScore:     clamp(30 + (hasEmail ? 15 : 0) + (hasPhone ? 10 : 0) + (hasSummary ? 15 : 0) + (wordCount > 300 ? 10 : 0)),
    },
    trendingSkills:  ["LLMs / AI Integration", "TypeScript", "Cloud-Native Architecture", "Kubernetes", "React/Next.js"],
    recommendedTech: ["Next.js", "FastAPI", "Terraform", "Redis", "GraphQL"],
  };
};

/* ─── Resume document detection (exported for controller) ──────────────────── */
const SECTION_WORDS = [
  "experience","education","skills","projects","objective","summary",
  "achievements","certifications","internship","work history","employment",
  "qualifications","profile","accomplishments","responsibilities",
  "work experience","professional experience","technical skills",
  "core competencies","career objective","personal statement","about me",
  "languages","awards","volunteer","publications","references",
];

const RESUME_SIGNALS = [
  "bachelor","master","degree","university","college","engineer",
  "developer","manager","intern","gpa","github","linkedin",
  "years of experience","responsibilities","technologies","frameworks",
  "proficient","collaborated","developed","designed","implemented",
  "led","built","maintained","deployed","optimized","created",
  "achieved","improved","launched","delivered","coordinated",
  "team","position","role","company","organization","startup",
];

const NON_RESUME_FLAGS = [
  "tax invoice","gst invoice","total amount due","unit price",
  "date of purchase","purchase order","invoice number","receipt number",
  "payment received","subtotal","grand total","amount paid",
  "billing address","shipping address","item description","qty",
  "patient name","doctor name","prescription date","diagnosis",
  "medication","dosage","clinic name","hospital name",
  "table of contents","bibliography","chapter ","plaintiff",
  "defendant","hereby","whereas","affidavit",
  "menu","calories","ingredients","serving size","allergens",
];

export const detectResume = (text, fileName = "") => {
  const trimmed = (text || "").trim();
  const lower   = trimmed.toLowerCase();
  const fileL   = (fileName || "").toLowerCase();

  // Empty / scanned PDF — accept with low confidence
  if (trimmed.length < 50) {
    return { isResume: true, confidence: 30, scanned: true };
  }

  // Hard reject obvious non-resume documents
  const nonResumeHits = NON_RESUME_FLAGS.filter(f => lower.includes(f));
  if (nonResumeHits.length >= 3) {
    const hasSections = SECTION_WORDS.some(s => lower.includes(s));
    if (!hasSections) {
      const isFinancial = nonResumeHits.some(f => ["invoice","total","billing","receipt"].some(k => f.includes(k)));
      const isMedical   = nonResumeHits.some(f => ["patient","prescription","diagnosis","medication"].some(k => f.includes(k)));
      const isAcademic  = nonResumeHits.some(f => ["chapter","bibliography","table of contents"].some(k => f.includes(k)));
      return {
        isResume: false,
        confidence: 0,
        reason: `This file appears to be a ${isFinancial ? "financial document or invoice" : isMedical ? "medical document" : isAcademic ? "academic document" : "non-resume document"}. Please upload your CV or resume.`,
      };
    }
  }

  const sectionHits = SECTION_WORDS.filter(s => lower.includes(s));
  const signalHits  = RESUME_SIGNALS.filter(s => lower.includes(s));
  const fileBonus   = /resume|cv|curriculum/i.test(fileL) ? 3 : 0;
  const evidence    = sectionHits.length + Math.floor(signalHits.length / 2) + fileBonus;
  const hasEmail    = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(trimmed);
  const hasPhone    = /(\+?\d[\d\s\-().]{7,}\d)/.test(trimmed);
  const hasContact  = hasEmail || hasPhone;
  const extractedSkills = extractSkillsFromText(trimmed);

  // Accept if has skills even without obvious section words
  if (extractedSkills.length >= 3 && (hasContact || sectionHits.length >= 1)) {
    const confidence = Math.min(100, 40 + sectionHits.length * 8 + signalHits.length * 2 + (hasContact ? 10 : 0));
    return { isResume: true, confidence, detectedSections: sectionHits.slice(0, 8), signalCount: signalHits.length };
  }

  if (evidence < 2 && !hasContact && trimmed.length > 300) {
    return {
      isResume: false,
      confidence: 10,
      reason: "This file does not contain typical resume sections (Experience, Education, Skills, etc.). Please upload a proper CV or resume file.",
    };
  }

  if (evidence < 1 && !hasContact) {
    return {
      isResume: false,
      confidence: 5,
      reason: "Could not detect resume content. Please upload a CV or resume with sections like Education, Skills, and Experience.",
    };
  }

  const confidence = Math.min(100, 35 + sectionHits.length * 10 + signalHits.length * 2 + (hasContact ? 10 : 0));
  return { isResume: true, confidence, detectedSections: sectionHits.slice(0, 8), signalCount: signalHits.length };
};
