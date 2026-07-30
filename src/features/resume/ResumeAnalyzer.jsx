import React, { useState, useRef } from "react";
import { PageWrapper } from "../../components/PageWrapper";
import { Badge } from "../../components/ui";
import api from "../../services/apiClient";
import {
  Upload, CheckCircle, AlertTriangle, TrendingUp, Zap,
  FileText, X, RefreshCw, Download, Eye, XCircle,
  Star, Code2, Briefcase, FolderOpen, Layout, Brain,
  User, Shield,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

/* ─── Job roles for personalized keyword/suggestion matching ───────────────── */
const TARGET_ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "AI Engineer", "Machine Learning Engineer",
  "Data Scientist", "Cloud Engineer", "DevOps Engineer",
  "Cybersecurity Analyst", "UI/UX Designer", "Mobile App Developer",
  "Product Manager", "QA Engineer", "Data Engineer",
];

/* ─── CSP-safe PDF text extraction ─────────────────────────────────────────── */
const extractPdfText = async (base64) => {
  try {
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const pdf = await pdfjsLib.getDocument({
      data:            atob(base64),
      useWorkerFetch:  false,
      isEvalSupported: false,
      useSystemFonts:  true,
    }).promise;

    let allText = "";
    const pageCount = Math.min(pdf.numPages, 10);

    for (let i = 1; i <= pageCount; i++) {
      const page    = await pdf.getPage(i);
      const content = await page.getTextContent({ normalizeWhitespace: true });

      // Group items by Y-coordinate to reconstruct natural reading order
      const lines = new Map();
      for (const item of content.items) {
        if (!item.str?.trim()) continue;
        const y = Math.round((item.transform?.[5] || 0) / 2) * 2; // bin to 2px
        if (!lines.has(y)) lines.set(y, []);
        lines.get(y).push(item.str);
      }

      // Sort top-to-bottom, join each line
      const pageText = [...lines.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([, words]) => words.join(" "))
        .join("\n");

      allText += pageText + "\n\n";
    }

    return allText.trim();
  } catch (err) {
    console.warn("[PDF] Text extraction failed:", err.message);
    return "";
  }
};

/* ─── Count meaningful words ────────────────────────────────────────────────── */
const meaningfulWordCount = (text) =>
  (text || "").split(/\s+/).filter(w => w.length > 1).length;

/* ─── UI Components ─────────────────────────────────────────────────────────── */
const ATSRing = ({ score }) => {
  const r = 52, c = 2 * Math.PI * r;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#374151" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
      <text x="70" y="63" textAnchor="middle" fill={color} fontSize="26" fontWeight="bold">{score}</text>
      <text x="70" y="79" textAnchor="middle" fill="#9ca3af" fontSize="11">/ 100</text>
      <text x="70" y="94" textAnchor="middle" fill="#6b7280" fontSize="10">ATS Score</text>
    </svg>
  );
};

const ScoreBar = ({ label, score, icon: Icon, color }) => (
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-white font-bold">{score}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  </div>
);

/* ─── Loading steps ─────────────────────────────────────────────────────────── */
const STEPS = [
  { label: "Reading file",        icon: FileText },
  { label: "Extracting text",     icon: Brain },
  { label: "Validating resume",   icon: Shield },
  { label: "AI ATS analysis",     icon: TrendingUp },
];

const LoadingView = ({ step }) => (
  <div className="py-16 text-center">
    <div className="relative w-16 h-16 mx-auto mb-6">
      <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-neon-purple animate-spin" />
      <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-neon-cyan animate-spin"
        style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
    </div>
    <p className="text-white font-semibold text-lg mb-1">{STEPS[step]?.label || "Processing…"}</p>
    <p className="text-gray-500 text-sm mb-6">Powered by Gemini AI</p>
    <div className="flex justify-center gap-3">
      {STEPS.map((s, i) => (
        <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
          i < step  ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : i === step ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/40 shadow-[0_0_10px_rgba(155,93,229,0.3)]"
          : "bg-gray-800 text-gray-600 border border-gray-700"
        }`}>
          <s.icon className="w-3 h-3" />
          {s.label}
        </div>
      ))}
    </div>
  </div>
);

/* ─── Invalid file screen ───────────────────────────────────────────────────── */
const InvalidScreen = ({ reason, onReset }) => (
  <div className="glass rounded-2xl border border-red-800/40 bg-red-950/20 p-8 text-center">
    <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
      <XCircle className="w-8 h-8 text-red-400" />
    </div>
    <h3 className="text-xl font-bold text-red-300 mb-3">Invalid Resume</h3>
    <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto mb-6 whitespace-pre-line">
      {reason}
    </p>
    <div className="glass rounded-xl border border-[rgba(155,93,229,0.1)] p-4 mb-6 text-left max-w-sm mx-auto">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">What to upload</p>
      <ul className="space-y-1.5 text-xs text-gray-500">
        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> Text-based PDF resume/CV</li>
        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> Word document (.doc / .docx) resume</li>
        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> Plain text (.txt) resume</li>
        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-red-500 flex-shrink-0" /> Scanned image PDFs (no readable text)</li>
        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-red-500 flex-shrink-0" /> Invoices, certificates, assignments</li>
        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-red-500 flex-shrink-0" /> Blank or corrupted files</li>
      </ul>
    </div>
    <button
      onClick={onReset}
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-300 hover:bg-brand-500/30 transition-all text-sm font-medium"
    >
      <RefreshCw className="w-4 h-4" /> Try a Different File
    </button>
  </div>
);

/* ─── Service error screen ──────────────────────────────────────────────────── */
const ServiceError = ({ message, onReset }) => (
  <div className="glass rounded-2xl border border-amber-800/40 bg-amber-950/20 p-8 text-center">
    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
      <AlertTriangle className="w-8 h-8 text-amber-400" />
    </div>
    <h3 className="text-xl font-bold text-amber-300 mb-3">Analysis Unavailable</h3>
    <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto mb-6">{message}</p>
    <button
      onClick={onReset}
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 hover:bg-amber-500/20 transition-all text-sm font-medium"
    >
      <RefreshCw className="w-4 h-4" /> Try Again
    </button>
  </div>
);

/* ─── Main Component ────────────────────────────────────────────────────────── */
export const ResumeAnalyzer = () => {
  const [resume,      setResume]      = useState(null);
  const [analysis,    setAnalysis]    = useState(null);
  const [loadingStep, setLoadingStep] = useState(-1);   // -1 = not loading
  const [dragActive,  setDragActive]  = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [invalidMsg,  setInvalidMsg]  = useState("");   // resume rejection
  const [serviceErr,  setServiceErr]  = useState("");   // API/service errors
  const [targetRole,  setTargetRole]  = useState("");   // for personalized keywords
  const fileRef = useRef(null);

  const isLoading = loadingStep >= 0;

  const reset = () => {
    setResume(null); setAnalysis(null); setPreviewUrl(null);
    setInvalidMsg(""); setServiceErr(""); setLoadingStep(-1);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type !== "dragleave");
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const processFile = async (file) => {
    if (!file) return;

    // ── File type check ────────────────────────────────────────────────────
    const OK_TYPES = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!OK_TYPES.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      toast.error("Only PDF, DOC, DOCX, or TXT files accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB.");
      return;
    }

    reset();
    setLoadingStep(0); // "Reading file"

    try {
      // ── Step 0: Read file ────────────────────────────────────────────────
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload  = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      setResume({ name: file.name, size: file.size, type: file.type });
      setPreviewUrl(URL.createObjectURL(file));

      // ── Step 1: Extract text ─────────────────────────────────────────────
      setLoadingStep(1); // "Extracting text"
      let extractedText = "";

      if (file.type === "application/pdf") {
        extractedText = await extractPdfText(base64);
      } else if (file.type === "text/plain") {
        extractedText = await file.text();
      }
      // DOC/DOCX — server handles extraction from base64

      const wordCount = meaningfulWordCount(extractedText);
      console.log(`[ResumeAnalyzer] Extracted ${extractedText.length} chars, ${wordCount} words from "${file.name}"`);

      // ── Step 2: Pre-check text sufficiency ──────────────────────────────
      setLoadingStep(2); // "Validating resume"

      // For scanned/image PDFs with no extractable text, show clear message
      if (file.type === "application/pdf" && (extractedText.length < 100 || wordCount < 20)) {
        setInvalidMsg(
          "Invalid Resume: Unable to extract sufficient resume content from this PDF.\n\n" +
          "This is likely a scanned image PDF. Please:\n" +
          "• Export your resume as a text-based PDF from Word/Google Docs\n" +
          "• Upload a .docx or .txt version instead\n" +
          "• Ensure the PDF contains selectable text"
        );
        setLoadingStep(-1);
        return;
      }

      // ── Step 3: Send to backend (Gemini validates + analyzes) ────────────
      setLoadingStep(3); // "AI ATS analysis"

      const { data } = await api.post("/api/resume/analyze", {
        extractedText,
        fileName: file.name,
        base64,
        mimeType: file.type,
        targetRole,
      });

      setAnalysis(data.data);
      toast.success("Resume analyzed by Gemini AI!");

    } catch (err) {
      console.error("[ResumeAnalyzer] Error:", err);

      if (err.status === 422) {
        // Invalid resume — Gemini rejected it or insufficient text
        setInvalidMsg(err.data?.message || "Invalid Resume: This does not appear to be a valid resume or CV.");
        setResume(null); setPreviewUrl(null);
      } else if (err.status === 503) {
        // Gemini not configured
        setServiceErr(err.data?.message || "Resume analysis service is not configured. Please contact the administrator.");
      } else if (err.status === 502) {
        // Gemini API error
        setServiceErr(err.data?.message || "Gemini AI is temporarily unavailable. Please try again in a moment.");
      } else {
        setServiceErr("An unexpected error occurred. Please try again.");
      }
      setResume(null); setPreviewUrl(null);
    } finally {
      setLoadingStep(-1);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;
    const lines = [
      "PREPAI — GEMINI AI RESUME ANALYSIS REPORT",
      "=".repeat(45),
      `ATS Score  : ${analysis.atsScore}/100`,
      `Analyzed   : ${new Date().toLocaleDateString()}`,
      `AI Engine  : Google Gemini`,
      `Analysis   : ${(analysis.analysisTime / 1000).toFixed(1)}s`,
      "",
      "SUMMARY:",
      `  ${analysis.summary || ""}`,
      "",
      "OVERALL FEEDBACK:",
      `  ${analysis.overallFeedback || ""}`,
      "",
      "STRENGTHS:",
      ...(analysis.strengths || []).map(s => `  • ${s}`),
      "",
      "IMPROVEMENTS NEEDED:",
      ...(analysis.improvements || []).map(s => `  • ${s}`),
      "",
      "TECHNICAL SKILLS FOUND:",
      `  ${(analysis.technicalSkills || []).join(", ") || "None detected"}`,
      "",
      "SOFT SKILLS:",
      `  ${(analysis.softSkills || []).join(", ") || "None detected"}`,
      "",
      "EDUCATION:",
      `  Score: ${analysis.education?.score ?? "N/A"}/100`,
      `  Details: ${analysis.education?.details || "Not found"}`,
      `  Feedback: ${analysis.education?.feedback || ""}`,
      "",
      "WORK EXPERIENCE:",
      `  Score: ${analysis.experience?.score ?? "N/A"}/100`,
      `  Estimated years: ${analysis.experience?.yearsEstimate || "Unknown"}`,
      `  Feedback: ${analysis.experience?.feedback || ""}`,
      "",
      "PROJECTS:",
      `  Score: ${analysis.projects?.score ?? "N/A"}/100`,
      `  Count: ${analysis.projects?.count ?? "Unknown"}`,
      `  Feedback: ${analysis.projects?.feedback || ""}`,
      "",
      "MISSING ATS KEYWORDS:",
      `  ${(analysis.missingKeywords || []).join(", ") || "None"}`,
      "",
      "RECOMMENDATIONS:",
      ...(analysis.suggestions || []).map((s, i) => `  ${i + 1}. ${s}`),
      "",
      "TRENDING SKILLS IN YOUR FIELD:",
      `  ${(analysis.trendingSkills || []).join(", ")}`,
      "",
      "RECOMMENDED TO LEARN:",
      `  ${(analysis.recommendedTech || []).join(", ")}`,
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    a.download = `prepai-gemini-resume-${Date.now()}.txt`;
    a.click();
    toast.success("Report downloaded!");
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-3xl font-extrabold text-white">Resume Analyzer</h1>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30 flex items-center gap-1.5">
            <Brain className="w-3 h-3" /> Gemini AI
          </span>
        </div>
        <p className="text-gray-400 text-sm">
          Upload your CV — Gemini validates and scores it with AI-powered ATS analysis
        </p>
      </div>

      {/* States */}
      {invalidMsg  && <InvalidScreen  reason={invalidMsg}  onReset={reset} />}
      {serviceErr  && <ServiceError   message={serviceErr} onReset={reset} />}
      {isLoading   && <LoadingView    step={loadingStep} />}

      {/* Target role — personalizes missing keywords & suggestions */}
      {!isLoading && !analysis && !invalidMsg && !serviceErr && (
        <div className="glass rounded-2xl border border-[rgba(155,93,229,0.12)] p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="target-role" className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
            Target Role <span className="text-gray-600 normal-case font-normal">(optional)</span>
          </label>
          <select
            id="target-role"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(155,93,229,0.2)] text-sm text-white focus:outline-none focus:border-neon-purple/50 transition-colors"
          >
            <option value="">Auto-detect from resume</option>
            {TARGET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      {/* Upload zone */}
      {!isLoading && !analysis && !invalidMsg && !serviceErr && (
        <div
          className={`glass rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-neon-purple bg-brand-500/10 scale-[1.01]"
              : "border-[rgba(155,93,229,0.25)] hover:border-neon-purple/60 hover:bg-white/[0.02]"
          }`}
          onDragEnter={handleDrag} onDragLeave={handleDrag}
          onDragOver={handleDrag}  onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="py-16 text-center px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-neon-cyan/20 mb-5 border border-brand-500/20">
              <Upload className="w-9 h-9 text-neon-purple" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload Your Resume</h3>
            <p className="text-gray-400 text-sm mb-1">Drag & drop or click to browse</p>
            <p className="text-xs text-gray-600 mb-3">PDF · DOC · DOCX · TXT · Max 5 MB</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-700">
              <Brain className="w-3.5 h-3.5 text-neon-purple" />
              Gemini AI validates and scores every upload
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={e => processFile(e.target.files?.[0])}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Results */}
      {analysis && !isLoading && (
        <div className="space-y-6">

          {/* ATS Score hero */}
          <div className="glass rounded-2xl border border-[rgba(155,93,229,0.15)] p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ATSRing score={analysis.atsScore} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">
                    {analysis.atsScore >= 85 ? "Exceptional Resume"
                      : analysis.atsScore >= 70 ? "Good Resume"
                      : analysis.atsScore >= 50 ? "Average Resume"
                      : analysis.atsScore >= 30 ? "Needs Work"
                      : "Needs Major Rework"}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    analysis.atsScore >= 80 ? "bg-green-500/20 text-green-300"
                      : analysis.atsScore >= 60 ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-red-500/20 text-red-300"
                  }`}>
                    {analysis.atsScore}/100
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30 flex items-center gap-1.5">
                    <Brain className="w-3 h-3" /> Gemini AI
                  </span>
                </div>

                {analysis.summary && (
                  <p className="text-gray-300 text-sm mb-2 leading-relaxed">{analysis.summary}</p>
                )}
                {analysis.overallFeedback && (
                  <p className="text-gray-400 text-xs leading-relaxed mb-3 italic">"{analysis.overallFeedback}"</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {resume?.name}</span>
                  <span>{(resume?.size / 1024).toFixed(0)} KB</span>
                  {analysis.wordCount && <span>{analysis.wordCount} words</span>}
                  {analysis.analysisTime && <span>{(analysis.analysisTime / 1000).toFixed(1)}s analysis</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
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
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(155,93,229,0.1)]">
                <span className="font-medium text-white text-sm">Resume Preview</span>
                <button onClick={() => setShowPreview(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
              </div>
              <iframe src={previewUrl} className="w-full h-96" title="Resume Preview" />
            </div>
          )}

          {/* Education + Experience + Projects */}
          {(analysis.education || analysis.experience || analysis.projects) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.education && (
                <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> Education
                    <span className={`ml-auto text-xs font-bold ${analysis.education.score >= 70 ? "text-green-400" : analysis.education.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                      {analysis.education.score}/100
                    </span>
                  </h3>
                  {analysis.education.details && <p className="text-white text-sm font-medium mb-1">{analysis.education.details}</p>}
                  {analysis.education.feedback && <p className="text-gray-500 text-xs leading-relaxed">{analysis.education.feedback}</p>}
                </div>
              )}
              {analysis.experience && (
                <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Experience
                    <span className={`ml-auto text-xs font-bold ${analysis.experience.score >= 70 ? "text-green-400" : analysis.experience.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                      {analysis.experience.score}/100
                    </span>
                  </h3>
                  {analysis.experience.yearsEstimate && <p className="text-white text-sm font-medium mb-1">{analysis.experience.yearsEstimate}</p>}
                  {analysis.experience.feedback && <p className="text-gray-500 text-xs leading-relaxed">{analysis.experience.feedback}</p>}
                </div>
              )}
              {analysis.projects && (
                <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" /> Projects
                    <span className={`ml-auto text-xs font-bold ${analysis.projects.score >= 70 ? "text-green-400" : analysis.projects.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                      {analysis.projects.score}/100
                    </span>
                  </h3>
                  {analysis.projects.count !== undefined && <p className="text-white text-sm font-medium mb-1">{analysis.projects.count} project{analysis.projects.count !== 1 ? "s" : ""} found</p>}
                  {analysis.projects.feedback && <p className="text-gray-500 text-xs leading-relaxed">{analysis.projects.feedback}</p>}
                </div>
              )}
            </div>
          )}

          {/* Section scores + radar */}
          {SECTION_BARS.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" /> Section Scores
                </h2>
                <div className="space-y-4">
                  {SECTION_BARS.map(s => <ScoreBar key={s.label} {...s} />)}
                </div>
              </div>
              <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                <h2 className="font-semibold text-white mb-4">Score Radar</h2>
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
                <AlertTriangle className="w-5 h-5 text-orange-400" /> Needs Improvement
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

          {/* Technical Skills */}
          {analysis.technicalSkills?.length > 0 && (
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-neon-purple" />
                Technical Skills
                <span className="ml-auto text-xs text-gray-500">{analysis.technicalSkills.length} detected</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {analysis.technicalSkills.map((s, i) => <Badge key={i} variant="primary">{s}</Badge>)}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {analysis.softSkills?.length > 0 && (
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-neon-cyan" /> Soft Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {analysis.softSkills.map((s, i) => <Badge key={i} variant="default">{s}</Badge>)}
              </div>
            </div>
          )}

          {/* Missing Keywords */}
          {analysis.missingKeywords?.length > 0 && (
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
              <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" /> Missing ATS Keywords
              </h2>
              <p className="text-sm text-gray-500 mb-3">Add these to increase your ATS match rate:</p>
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
                  <TrendingUp className="w-5 h-5 text-neon-cyan" /> Trending in Your Field
                </h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.trendingSkills.map((s, i) => <Badge key={i} variant="default">{s}</Badge>)}
                </div>
              </div>
            )}
            {analysis.recommendedTech?.length > 0 && (
              <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" /> Recommended to Learn
                </h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.recommendedTech.map((s, i) => <Badge key={i} variant="primary">{s}</Badge>)}
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-neon-purple" /> Gemini AI Recommendations
              </h2>
              <div className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-900/20 border border-blue-900/40">
                    <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
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
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue hover:opacity-90 text-white font-semibold text-sm transition-all"
            >
              <Download className="w-4 h-4" /> Download Full Report
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
