import { PageWrapper } from "../../components/PageWrapper";
import { Badge } from "../../components/ui";
import React, { useState, useRef } from "react";
import api from "../../services/apiClient";
import {
  Upload, CheckCircle, AlertTriangle, TrendingUp, Zap,
  FileText, X, RefreshCw, Download, Eye, XCircle,
  Star, Code2, Briefcase, FolderOpen, Layout,
} from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

/* ─── VERY lenient client-side check ───────────────────────────────────────────
   PURPOSE: Only block obvious non-documents (invoices, prescriptions).
   Real resume validation happens on the server.
   If text extraction fails (common with PDFs), we PASS it through anyway.
──────────────────────────────────────────────────────────────────────────────── */
const HARD_REJECT = [
  "tax invoice", "gst invoice", "total amount due", "unit price", "date of purchase",
  "terms and conditions", "purchase order", "patient name", "doctor name",
  "prescription date", "diagnosis", "table of contents", "bibliography",
];

const quickCheck = (text, fileName) => {
  // If we couldn't extract text at all → pass to server (don't block)
  if (!text || text.trim().length < 30) return { ok: true };

  const lower = text.toLowerCase();

  // Hard reject only if 4+ commercial/medical flags AND no resume words
  const flags = HARD_REJECT.filter(f => lower.includes(f)).length;
  const hasResumeWord = /resume|curriculum vitae|\bcv\b|experience|education|skills|projects/i.test(text);

  if (flags >= 4 && !hasResumeWord) {
    return { ok: false, reason: "This looks like an invoice, receipt, or non-resume document. Please upload your CV or resume." };
  }

  // Everything else → let the server decide
  return { ok: true };
};

/* ─── Extract text from PDF (best-effort — failure is OK) ─────────────────── */
const extractPdfText = async (base64) => {
  try {
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    // CSP-safe: disable the Web Worker entirely — pdfjs runs in the main thread.
    // This avoids loading any external script (cdnjs, etc.) which would violate CSP.
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    // Alternatively for pdfjs v4+:
    // pdfjsLib.GlobalWorkerOptions.workerPort = null;
    const pdf = await pdfjsLib.getDocument({ data: atob(base64), useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
    let text = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(s => s.str).join(" ") + "\n";
    }
    return text.trim();
  } catch (e) {
    // Text extraction failed (scanned PDF, complex layout, etc.)
    // Return empty string — server will handle it via the raw base64
    return "";
  }
};

/* ─── UI sub-components ────────────────────────────────────────────────────── */
const ATSRing = ({ score }) => {
  const r = 52, c = 2 * Math.PI * r;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#374151" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: "stroke-dasharray 1.2s ease" }} />
      <text x="70" y="64" textAnchor="middle" fill={color} fontSize="28" fontWeight="bold">{score}</text>
      <text x="70" y="83" textAnchor="middle" fill="#9ca3af" fontSize="12">ATS Score</text>
    </svg>
  );
};

const ScoreBar = ({ label, score, icon: Icon, color }) => (
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-white font-bold">{score}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  </div>
);

/* ─── Local fallback analysis (when backend is unreachable) ─────────────────── */
const buildFallback = (text, name) => {
  const TECH = ["JavaScript","Python","Java","React","Node.js","SQL","Git","AWS","Docker","TypeScript","HTML","CSS","MongoDB","PostgreSQL","Linux","C++","Kubernetes","Redis","GraphQL","REST","Next.js","Vue","Angular","Django","FastAPI","Spring Boot","Golang","Rust","Swift","Kotlin"];
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const skills = TECH.filter(s => new RegExp(escapeRe(s), "i").test(text)).slice(0, 12);
  const hasMetrics = /\d+%|\$\d+|\d+ (users|team|projects|clients)/i.test(text);
  const hasActions = /achieved|led|built|developed|improved|managed|designed|deployed|launched/i.test(text);
  const hasContact = /email|phone|linkedin|github/i.test(text);
  const score = Math.min(88, 48 + skills.length * 2 + (hasMetrics ? 10 : 0) + (hasActions ? 8 : 0) + (hasContact ? 5 : 0));
  return {
    atsScore: score,
    strengths: [
      hasActions ? "Strong action verbs used throughout" : "Document structure is ATS-compatible",
      skills.length > 3 ? `${skills.length} technical skills detected` : "Contact information present",
      "Format is readable by ATS systems",
      hasMetrics ? "Quantified achievements found" : "Document parsed successfully",
    ],
    improvements: [
      !hasMetrics ? "Add quantified achievements (e.g. 'Reduced load time by 40%')" : "Add more data-driven results",
      "Include keywords from the target job description",
      "Add a professional summary at the top",
      "Expand project descriptions with tech stack and impact",
    ],
    skills,
    missingKeywords: ["CI/CD","Agile","System Design","DevOps","Microservices","Cloud Architecture"].filter(k => !text.includes(k)).slice(0, 5),
    suggestions: [
      "Start bullet points with strong action verbs (Designed, Built, Deployed)",
      "Tailor your resume for each specific job description",
      "Keep resume to 1–2 pages for best ATS performance",
      "Add links to GitHub, LinkedIn, or portfolio",
    ],
    summary: `${name} analyzed. ${skills.length} technical skills detected. Connect backend AI for deeper analysis.`,
    sections: {
      skillsScore:     skills.length > 5 ? 80 : skills.length > 2 ? 60 : 40,
      experienceScore: hasMetrics ? 85 : hasActions ? 65 : 45,
      projectsScore:   /project/i.test(text) ? 70 : 30,
      formatScore:     hasContact ? (text.length > 500 ? 80 : 65) : 50,
    },
    trendingSkills:  ["LLMs / AI Integration", "TypeScript", "Docker", "Kubernetes", "React Native"],
    recommendedTech: ["Next.js", "FastAPI", "Terraform", "Redis", "GraphQL"],
  };
};

/* ─── Main Component ───────────────────────────────────────────────────────── */
export const ResumeAnalyzer = () => {
  const [resume,      setResume]      = useState(null);
  const [analysis,    setAnalysis]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [loadingMsg,  setLoadingMsg]  = useState("Analyzing resume…");
  const [dragActive,  setDragActive]  = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [valError,    setValError]    = useState("");
  const fileRef = useRef(null);

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type !== "dragleave"); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); processFile(e.dataTransfer.files?.[0]); };

  const processFile = async (file) => {
    if (!file) return;

    const ACCEPTED = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      toast.error("Only PDF, DOC, DOCX, or TXT files accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB.");
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setValError("");
    setLoadingMsg("Reading your file…");

    try {
      const url    = URL.createObjectURL(file);
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      setPreviewUrl(url);
      setResume({ name: file.name, size: file.size, type: file.type });

      // ── Step 1: Try to extract text (best-effort) ──────────────────────────
      let extractedText = "";
      if (file.type === "application/pdf") {
        setLoadingMsg("Extracting text from PDF…");
        extractedText = await extractPdfText(base64);
      } else if (file.type === "text/plain") {
        extractedText = await file.text();
      }
      // For .doc/.docx — skip client extraction, server handles it

      // ── Step 2: Very lenient client check ─────────────────────────────────
      const check = quickCheck(extractedText, file.name);
      if (!check.ok) {
        setValError(check.reason);
        setLoading(false);
        return;
      }

      // ── Step 3: Send to backend ────────────────────────────────────────────
      setLoadingMsg("AI is analyzing your resume…");
      try {
        const { data } = await api.post("/api/resume/analyze", {
          extractedText,
          fileName: file.name,
          base64,
          mimeType: file.type,
        });
        setAnalysis(data.data);
        toast.success("Resume analyzed successfully!");
      } catch (backendErr) {
        console.warn("Backend unavailable, using local analysis:", backendErr.message);
        // If backend returns 422 (validation error), show a helpful message
        if (backendErr.status === 422) {
          // Backend rejected it — but we still give a local analysis
          toast("Server couldn't parse the PDF. Showing local analysis instead.", { icon: "ℹ️" });
          // Use filename + any extracted text for local analysis
          const fallbackText = extractedText || file.name;
          setAnalysis(buildFallback(fallbackText, file.name));
        } else {
          setAnalysis(buildFallback(extractedText || file.name, file.name));
          toast("Backend not connected — showing local analysis.", { icon: "ℹ️" });
        }
      }

    } catch (err) {
      console.error("processFile error:", err);
      toast.error("Failed to process file. Please try a different file.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;
    const lines = [
      "PREPAI RESUME ANALYSIS REPORT",
      "=".repeat(35),
      `ATS Score : ${analysis.atsScore}/100`,
      `File      : ${resume?.name}`,
      `Date      : ${new Date().toLocaleDateString()}`,
      "",
      "STRENGTHS:",
      ...(analysis.strengths || []).map(s => `  • ${s}`),
      "",
      "IMPROVEMENTS:",
      ...(analysis.improvements || []).map(s => `  • ${s}`),
      "",
      "SKILLS FOUND:",
      `  ${(analysis.skills || []).join(", ")}`,
      "",
      "MISSING KEYWORDS:",
      `  ${(analysis.missingKeywords || []).join(", ")}`,
      "",
      "SECTION SCORES:",
      ...(analysis.sections ? Object.entries(analysis.sections).map(([k, v]) => `  ${k}: ${v}%`) : []),
      "",
      "RECOMMENDATIONS:",
      ...(analysis.suggestions || []).map((s, i) => `  ${i + 1}. ${s}`),
      "",
      "SUMMARY:",
      `  ${analysis.summary || ""}`,
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    a.download = "prepai-resume-report.txt";
    a.click();
    toast.success("Report downloaded!");
  };

  const reset = () => {
    setResume(null);
    setAnalysis(null);
    setPreviewUrl(null);
    setValError("");
    setLoadingMsg("Analyzing resume…");
  };

  const radarData = analysis?.sections ? [
    { subject: "Skills",     score: analysis.sections.skillsScore     || 0 },
    { subject: "Experience", score: analysis.sections.experienceScore || 0 },
    { subject: "Projects",   score: analysis.sections.projectsScore   || 0 },
    { subject: "Format",     score: analysis.sections.formatScore     || 0 },
  ] : [];

  const SECTION_BARS = analysis?.sections ? [
    { label: "Skills",     score: analysis.sections.skillsScore,     icon: Code2,      color: "bg-purple-500" },
    { label: "Experience", score: analysis.sections.experienceScore, icon: Briefcase,  color: "bg-blue-500"   },
    { label: "Projects",   score: analysis.sections.projectsScore,   icon: FolderOpen, color: "bg-green-500"  },
    { label: "Format",     score: analysis.sections.formatScore,     icon: Layout,     color: "bg-orange-500" },
  ] : [];

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-white mb-1">Resume Analyzer</h1>
        <p className="text-gray-400 text-sm">AI-powered ATS scoring, skills gap analysis, and improvement suggestions</p>
      </div>

      {/* Validation error banner */}
      {valError && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-900/20 border border-red-800">
          <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-300 mb-1">File Not Accepted</p>
            <p className="text-sm text-red-400">{valError}</p>
            <button onClick={reset} className="mt-2 text-sm text-red-400 underline underline-offset-2 hover:text-red-300">
              Try a different file
            </button>
          </div>
        </div>
      )}

      {/* Upload zone */}
      {!analysis && !loading && !valError && (
        <div
          className={`glass rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            dragActive ? "border-neon-purple bg-brand-500/10 scale-[1.01]" : "border-[rgba(155,93,229,0.25)] hover:border-neon-purple/60 hover:bg-white/[0.02]"
          }`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="py-20 text-center px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-neon-cyan/20 mb-5 border border-brand-500/20">
              <Upload className="w-9 h-9 text-neon-purple" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload Your Resume</h3>
            <p className="text-gray-400 text-sm mb-1">Drag & drop, or click to browse</p>
            <p className="text-xs text-gray-600">PDF · DOC · DOCX · TXT · Max 5 MB</p>
            <p className="text-xs text-gray-700 mt-3">Works with all PDF types including multi-column, designed, and ATS-formatted resumes</p>
            <input
              ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt"
              onChange={e => processFile(e.target.files?.[0])}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-20 text-center">
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-neon-purple animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-neon-cyan animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{loadingMsg}</p>
              <p className="text-sm text-gray-500 mt-1">Extracting skills · Scoring ATS compatibility · Generating suggestions</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-6">
          {/* ATS Score hero */}
          <div className="glass rounded-2xl border border-[rgba(155,93,229,0.15)] p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ATSRing score={analysis.atsScore} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">
                    {analysis.atsScore >= 80 ? "Excellent" : analysis.atsScore >= 65 ? "Good" : analysis.atsScore >= 50 ? "Fair" : "Needs Work"} Score
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    analysis.atsScore >= 80 ? "bg-green-500/20 text-green-300"
                    : analysis.atsScore >= 60 ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-red-500/20 text-red-300"
                  }`}>
                    {analysis.atsScore}/100
                  </span>
                </div>
                {analysis.summary && <p className="text-gray-300 text-sm mb-3">{analysis.summary}</p>}
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {resume?.name} · {(resume?.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {previewUrl && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 text-sm transition-all"
                  >
                    <Eye className="w-4 h-4" /> {showPreview ? "Hide" : "Preview"}
                  </button>
                )}
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 text-sm transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> New Upload
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && previewUrl && (
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-surface-elevated border-b border-[rgba(155,93,229,0.1)]">
                <span className="font-medium text-white text-sm">Resume Preview</span>
                <button onClick={() => setShowPreview(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
              </div>
              <iframe src={previewUrl} className="w-full h-96" title="Resume Preview" />
            </div>
          )}

          {/* Section scores + radar */}
          {SECTION_BARS.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" /> Section Breakdown
                </h2>
                <div className="space-y-4">
                  {SECTION_BARS.map(s => <ScoreBar key={s.label} {...s} />)}
                </div>
              </div>
              <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                <h2 className="font-semibold text-white mb-4">Skill Radar</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#6b7280" }} />
                    <Radar dataKey="score" stroke="#9333ea" fill="#9333ea" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Strengths + Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" /> Strengths
              </h2>
              <div className="space-y-2">
                {(analysis.strengths || []).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-green-900/20 border border-green-900/40">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">{s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" /> Improvements
              </h2>
              <div className="space-y-2">
                {(analysis.improvements || []).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-900/20 border border-orange-900/40">
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills */}
          {analysis.skills?.length > 0 && (
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-neon-purple" /> Detected Skills ({analysis.skills.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.map((s, i) => <Badge key={i} variant="primary">{s}</Badge>)}
              </div>
            </div>
          )}

          {/* Missing keywords */}
          {analysis.missingKeywords?.length > 0 && (
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
              <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" /> Missing Keywords
              </h2>
              <p className="text-sm text-gray-500 mb-3">Add these to your resume to boost your ATS score:</p>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywords.map((k, i) => <Badge key={i} variant="warning">{k}</Badge>)}
              </div>
            </div>
          )}

          {/* Trending + Recommended */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {analysis.trendingSkills?.length > 0 && (
              <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-neon-cyan" /> Trending Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.trendingSkills.map((s, i) => <Badge key={i} variant="default">{s}</Badge>)}
                </div>
              </div>
            )}
            {analysis.recommendedTech?.length > 0 && (
              <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-neon-blue" /> Recommended Tech
                </h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.recommendedTech.map((s, i) => <Badge key={i} variant="primary">{s}</Badge>)}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-neon-purple" /> AI Improvement Suggestions
              </h2>
              <div className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-900/20 border border-blue-900/40">
                    <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-300">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={downloadReport}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue hover:opacity-90 text-white font-semibold text-sm shadow-brand transition-all"
            >
              <Download className="w-4 h-4" /> Download Report
            </button>
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[rgba(155,93,229,0.2)] text-gray-300 hover:bg-white/5 font-semibold text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Analyze Another
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
