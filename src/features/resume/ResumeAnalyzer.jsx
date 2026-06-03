import { PageWrapper } from "../../components/PageWrapper";
import { Badge } from "../../components/ui";
import React, { useState, useRef } from "react";
import api from "../../services/apiClient";
import {
  Upload, CheckCircle, AlertTriangle, TrendingUp, Zap,
  FileText, X, RefreshCw, Download, Eye, XCircle,
  Star, Code2, Briefcase, FolderOpen, Layout,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

/* ─── Client-side resume pre-check ─────────────────────────────────────────────
   Catches obvious non-resume files BEFORE hitting the server.
   The server does the authoritative check — this is just a fast early exit.
──────────────────────────────────────────────────────────────────────────────── */
const NON_RESUME_SIGNALS = [
  "tax invoice", "gst invoice", "total amount due", "unit price", "date of purchase",
  "purchase order", "invoice number", "receipt number", "billing address",
  "shipping address", "subtotal", "grand total", "payment received",
  "patient name", "doctor name", "prescription date", "diagnosis", "medication",
  "table of contents", "bibliography", "chapter ", "plaintiff", "defendant",
];

const RESUME_SIGNALS = [
  "experience", "education", "skills", "projects", "objective", "summary",
  "certifications", "internship", "work history", "employment", "achievements",
  "qualifications", "professional", "technologies", "responsibilities",
];

const quickValidate = (text) => {
  if (!text || text.trim().length < 40) {
    // Too short to validate — let server decide
    return { valid: true };
  }

  const lower = text.toLowerCase();

  // Count non-resume flags
  const badHits = NON_RESUME_SIGNALS.filter(s => lower.includes(s)).length;
  // Count resume signals
  const goodHits = RESUME_SIGNALS.filter(s => lower.includes(s)).length;

  // Strong non-resume signals and no resume signals → reject
  if (badHits >= 3 && goodHits === 0) {
    const type = ["tax invoice","gst invoice","invoice number","billing"].some(s => lower.includes(s))
      ? "invoice or financial document"
      : ["patient","prescription","diagnosis","medication"].some(s => lower.includes(s))
      ? "medical document"
      : ["table of contents","bibliography","chapter"].some(s => lower.includes(s))
      ? "academic or reference document"
      : "non-resume document";
    return {
      valid: false,
      reason: `This appears to be a ${type}, not a resume. Please upload your CV or resume file.`,
    };
  }

  // Long document with zero resume signals → likely wrong file
  if (text.trim().length > 500 && goodHits === 0 && badHits === 0) {
    // Check for at least one resume-like pattern
    const hasName    = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text); // "First Last"
    const hasEmail   = /\b[\w.]+@[\w.]+\.[a-z]{2,}\b/i.test(text);
    const hasYear    = /\b(19|20)\d{2}\b/.test(text);
    if (!hasName && !hasEmail && !hasYear) {
      return {
        valid: false,
        reason: "This file does not appear to be a resume. Could not find typical resume content like names, dates, or section headings.",
      };
    }
  }

  return { valid: true };
};

/* ─── CSP-safe pdfjs text extraction ───────────────────────────────────────── */
const extractPdfText = async (base64) => {
  try {
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    const pdf = await pdfjsLib.getDocument({
      data: atob(base64),
      useWorkerFetch:  false,
      isEvalSupported: false,
      useSystemFonts:  true,
    }).promise;

    let allText = "";
    const pageCount = Math.min(pdf.numPages, 10);

    for (let i = 1; i <= pageCount; i++) {
      const page    = await pdf.getPage(i);
      const content = await page.getTextContent({ normalizeWhitespace: true });

      // Group items by vertical position to reconstruct lines
      const lines = new Map();
      for (const item of content.items) {
        if (!item.str?.trim()) continue;
        const y = Math.round(item.transform?.[5] || 0);
        if (!lines.has(y)) lines.set(y, []);
        lines.get(y).push(item.str);
      }

      // Sort lines top-to-bottom and join words
      const sorted = [...lines.entries()].sort((a, b) => b[0] - a[0]);
      const pageText = sorted.map(([, words]) => words.join(" ")).join("\n");
      allText += pageText + "\n";
    }

    return allText.trim();
  } catch (err) {
    console.warn("PDF text extraction failed:", err.message);
    return "";
  }
};

/* ─── UI sub-components ─────────────────────────────────────────────────────── */
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

/* ─── Invalid File Screen ───────────────────────────────────────────────────── */
const InvalidFile = ({ reason, onReset }) => (
  <div className="glass rounded-2xl border border-red-800/50 bg-red-900/10 p-8 text-center">
    <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
      <XCircle className="w-8 h-8 text-red-400" />
    </div>
    <h3 className="text-xl font-bold text-red-300 mb-3">Not a Valid Resume</h3>
    <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto mb-6">{reason}</p>
    <div className="glass rounded-xl border border-[rgba(155,93,229,0.1)] p-4 mb-6 text-left max-w-sm mx-auto">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Valid resume formats</p>
      <ul className="space-y-1 text-xs text-gray-500">
        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> PDF with sections like Education, Skills, Experience</li>
        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Word document (.doc / .docx) resume</li>
        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Plain text (.txt) resume</li>
        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-red-500" /> Invoices, receipts, ID cards, medical records</li>
        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-red-500" /> Academic papers, presentations, certificates</li>
      </ul>
    </div>
    <button
      onClick={onReset}
      className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-300 hover:bg-brand-500/30 transition-all text-sm font-medium"
    >
      <RefreshCw className="w-4 h-4" /> Try a Different File
    </button>
  </div>
);

/* ─── Main Component ────────────────────────────────────────────────────────── */
export const ResumeAnalyzer = () => {
  const [resume,      setResume]      = useState(null);
  const [analysis,    setAnalysis]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [loadingMsg,  setLoadingMsg]  = useState("Analyzing resume…");
  const [dragActive,  setDragActive]  = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [invalidMsg,  setInvalidMsg]  = useState("");   // non-empty = show invalid screen
  const fileRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type !== "dragleave");
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    setResume(null); setAnalysis(null);
    setPreviewUrl(null); setInvalidMsg("");
  };

  const processFile = async (file) => {
    if (!file) return;

    // File type check
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

    setLoading(true);
    setAnalysis(null);
    setInvalidMsg("");
    setLoadingMsg("Reading file…");

    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      // Extract text for validation
      let extractedText = "";
      if (file.type === "application/pdf") {
        setLoadingMsg("Extracting text from PDF…");
        extractedText = await extractPdfText(base64);
      } else if (file.type === "text/plain") {
        extractedText = await file.text();
      }

      // ── Client-side pre-check ──────────────────────────────────────────────
      const preCheck = quickValidate(extractedText);
      if (!preCheck.valid) {
        setInvalidMsg(preCheck.reason);
        setLoading(false);
        return;
      }

      setPreviewUrl(URL.createObjectURL(file));
      setResume({ name: file.name, size: file.size, type: file.type });

      // ── Send to backend ─────────────────────────────────────────────────────
      setLoadingMsg("AI is analyzing your resume…");
      try {
        const { data } = await api.post("/api/resume/analyze", {
          extractedText,
          fileName: file.name,
          base64,
          mimeType: file.type,
        });
        setAnalysis(data.data);
        toast.success("Resume analyzed!");
      } catch (err) {
        if (err.status === 422) {
          // Server confirmed it's NOT a resume → show invalid screen, no fake scores
          setInvalidMsg(err.data?.message || "This file does not appear to be a resume.");
          setResume(null);
          setPreviewUrl(null);
        } else {
          // Real backend error (500, network, etc.) → show error, do NOT show fake scores
          toast.error("Analysis failed. Please try again or check your connection.");
          setResume(null);
        }
      }
    } catch (err) {
      console.error("processFile error:", err);
      toast.error("Failed to read file. Please try again.");
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
      `Analysis  : ${analysis.source === "ai" ? "AI-powered (Anthropic Claude)" : "Keyword-based"}`,
      "",
      "STRENGTHS:",
      ...(analysis.strengths || []).map(s => `  • ${s}`),
      "",
      "IMPROVEMENTS NEEDED:",
      ...(analysis.improvements || []).map(s => `  • ${s}`),
      "",
      "DETECTED SKILLS:",
      `  ${(analysis.skills || []).join(", ") || "None detected"}`,
      "",
      "MISSING KEYWORDS:",
      `  ${(analysis.missingKeywords || []).join(", ") || "None"}`,
      "",
      "SECTION SCORES:",
      ...(analysis.sections ? Object.entries(analysis.sections).map(([k, v]) => `  ${k}: ${v}%`) : []),
      "",
      "AI RECOMMENDATIONS:",
      ...(analysis.suggestions || []).map((s, i) => `  ${i + 1}. ${s}`),
      "",
      "SUMMARY:",
      `  ${analysis.summary || ""}`,
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    a.download = `prepai-resume-${Date.now()}.txt`;
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
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-white mb-1">Resume Analyzer</h1>
        <p className="text-gray-400 text-sm">Upload your CV — get ATS score, skill gaps, and AI improvement tips</p>
      </div>

      {/* ── Invalid file state ── */}
      {invalidMsg && <InvalidFile reason={invalidMsg} onReset={reset} />}

      {/* ── Upload zone ── */}
      {!analysis && !loading && !invalidMsg && (
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
          <div className="py-20 text-center px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-neon-cyan/20 mb-5 border border-brand-500/20">
              <Upload className="w-9 h-9 text-neon-purple" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload Your Resume</h3>
            <p className="text-gray-400 text-sm mb-1">Drag & drop or click to browse</p>
            <p className="text-xs text-gray-600">PDF · DOC · DOCX · TXT · Max 5 MB</p>
            <p className="text-xs text-gray-700 mt-2">Only CV/resume files accepted · invoices and other documents will be rejected</p>
            <input
              ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt"
              onChange={e => processFile(e.target.files?.[0])}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="py-20 text-center">
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-neon-purple animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-neon-cyan animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{loadingMsg}</p>
              <p className="text-sm text-gray-500 mt-1">Validating document · Scoring ATS · Generating feedback</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {analysis && (
        <div className="space-y-6">

          {/* ATS Score hero */}
          <div className="glass rounded-2xl border border-[rgba(155,93,229,0.15)] p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ATSRing score={analysis.atsScore} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">
                    {analysis.atsScore >= 80 ? "Excellent Resume"
                      : analysis.atsScore >= 65 ? "Good Resume"
                      : analysis.atsScore >= 50 ? "Average Resume"
                      : "Needs Improvement"}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    analysis.atsScore >= 80 ? "bg-green-500/20 text-green-300"
                      : analysis.atsScore >= 60 ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-red-500/20 text-red-300"
                  }`}>
                    {analysis.atsScore}/100
                  </span>
                  {analysis.source === "ai" ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-neon-purple/20 text-neon-purple border border-neon-purple/30 font-medium">
                      ✦ AI Analysis
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium" title="Set ANTHROPIC_API_KEY on the backend for AI-powered analysis">
                      ⚡ Keyword Analysis
                    </span>
                  )}
                </div>

                {/* Extraction warning */}
                {analysis.extractionWarning && (
                  <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg bg-amber-900/20 border border-amber-800/40">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-300 leading-relaxed">
                      Text extraction from this PDF was limited (possibly scanned or image-based).
                      For best results, upload a text-based PDF or copy-paste your resume as a .txt file.
                    </p>
                  </div>
                )}

                {analysis.summary && (
                  <p className="text-gray-300 text-sm mb-3">{analysis.summary}</p>
                )}
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {resume?.name} · {(resume?.size / 1024).toFixed(0)} KB
                  {analysis.analysisTime && (
                    <span className="text-gray-700">· {(analysis.analysisTime / 1000).toFixed(1)}s</span>
                  )}
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
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(155,93,229,0.1)]">
                <span className="font-medium text-white text-sm">Resume Preview</span>
                <button onClick={() => setShowPreview(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
              </div>
              <iframe src={previewUrl} className="w-full h-96" title="Resume Preview" />
            </div>
          )}

          {/* Section breakdown + radar */}
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

          {/* Skills */}
          {analysis.skills?.length > 0 && (
            <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-neon-purple" />
                Detected Skills ({analysis.skills.length})
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
              <p className="text-sm text-gray-500 mb-3">Add these to boost your ATS score:</p>
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
                  <Code2 className="w-5 h-5 text-neon-blue" /> Recommended to Learn
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
                <Star className="w-5 h-5 text-neon-purple" /> AI Recommendations
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

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={downloadReport}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue hover:opacity-90 text-white font-semibold text-sm transition-all"
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
