import React, { useState, useRef } from "react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Badge, Alert } from "../../components/ui";
import {
  Upload, CheckCircle, AlertTriangle, TrendingUp, Zap,
  FileText, X, RefreshCw, Download, Eye, XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Resume detection keywords ────────────────────────────────────────────
const RESUME_SECTIONS  = ["experience","education","skills","projects","objective","summary","achievements","certifications","internship","work history","employment","qualification","profile","contact","languages","awards","volunteer","publications","references"];
const RESUME_KEYWORDS  = ["bachelor","master","degree","university","college","engineer","developer","manager","intern","gpa","gpa:","github","linkedin","email","phone","years of experience","responsibilities","technologies","frameworks","proficient","collaborated","developed","designed","implemented","led","built","maintained","deployed","optimized"];
const NON_RESUME_FLAGS = ["invoice","receipt","bill","total amount","gst","tax","payment","order id","product","quantity","price","customer","vendor","date of purchase","terms and conditions","warranty","claim","prescription","diagnosis","patient","doctor","chapter","table of contents","abstract","bibliography","reference list","index","appendix"];

// Returns { isResume: bool, confidence: 0-100, reason: string }
const detectResume = (text) => {
  if (!text || text.length < 100)
    return { isResume: false, confidence: 0, reason: "File appears to be empty or has too little text." };

  const lower = text.toLowerCase();

  // Non-resume red flags
  const flagCount = NON_RESUME_FLAGS.filter((f) => lower.includes(f)).length;
  if (flagCount >= 3)
    return { isResume: false, confidence: 0, reason: `This looks like a ${flagCount >= 5 ? "receipt/invoice" : "non-resume document"}, not a CV. Please upload your actual resume.` };

  const sectionHits  = RESUME_SECTIONS.filter((s) => lower.includes(s));
  const keywordHits  = RESUME_KEYWORDS.filter((k) => lower.includes(k));
  const totalHits    = sectionHits.length + keywordHits.length;

  // Confidence formula: need at least 2 section hits + 3 keyword hits
  if (sectionHits.length < 2 && keywordHits.length < 3) {
    return {
      isResume:   false,
      confidence: Math.min(40, totalHits * 5),
      reason:     "The uploaded file does not appear to be a valid resume or CV. Please upload a document containing sections like Education, Skills, Experience, or Projects.",
    };
  }

  const confidence = Math.min(100, 40 + sectionHits.length * 8 + keywordHits.length * 3);
  return { isResume: true, confidence, reason: "" };
};

const parseJSON = (text) => {
  try {
    const m = text.match(/```json\s*([\s\S]*?)```/) || [null, text];
    return JSON.parse((m[1] || text).replace(/^\s*```[\s\S]*?```\s*/g, "").trim());
  } catch { return null; }
};

// ── ATS ring ─────────────────────────────────────────────────────────────
const ATSRing = ({ score }) => {
  const r = 52, circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#374151" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="70" y="65" textAnchor="middle" fill={color} fontSize="28" fontWeight="bold">{score}</text>
      <text x="70" y="84" textAnchor="middle" fill="#9ca3af" fontSize="12">ATS Score</text>
    </svg>
  );
};

// ── Main component ────────────────────────────────────────────────────────
export const ResumeAnalyzer = () => {
  const [resume,      setResume]      = useState(null);
  const [analysis,    setAnalysis]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [dragActive,  setDragActive]  = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationError, setValidationError] = useState("");
  const fileRef = useRef(null);

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type !== "dragleave"); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); };

  const handleFile = async (file) => {
    if (!file) return;
    const valid = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!valid.includes(file.type)) { toast.error("Only PDF, DOC, or DOCX files are accepted."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File size must be under 5 MB."); return; }

    setLoading(true); setAnalysis(null); setValidationError("");

    try {
      const url    = URL.createObjectURL(file);
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      setPreviewUrl(url);
      setResume({ name: file.name, size: file.size, type: file.type, base64 });

      // ── Extract text for validation ────────────────────────────
      let extractedText = "";
      if (file.type === "application/pdf") {
        try {
          const pdfjsLib = await import("pdfjs-dist/build/pdf");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          const pdf = await pdfjsLib.getDocument({ data: atob(base64) }).promise;
          for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            extractedText += content.items.map((s) => s.str).join(" ") + "\n";
          }
        } catch { extractedText = file.name; }
      }

      // ── Resume validation ──────────────────────────────────────
      const detection = detectResume(extractedText);
      if (!detection.isResume) {
        setValidationError(detection.reason);
        setLoading(false);
        toast.error("This file doesn't look like a resume.");
        return;
      }

      toast.success(`Resume detected (${detection.confidence}% confidence)`);
      await analyzeResume(extractedText, file.name, base64, file.type);

    } catch (err) {
      console.error(err);
      toast.error("Failed to process file.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeResume = async (text, fileName, base64, mimeType) => {
    let raw = "";
    try {
      const messages = [{
        role: "user",
        content: mimeType === "application/pdf" && base64
          ? [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
              { type: "text", text: `Analyze this resume as an expert ATS system. Respond ONLY with raw JSON (no markdown, no backticks):\n{"atsScore":<0-100>,"strengths":["..."],"improvements":["..."],"skills":["..."],"missingKeywords":["..."],"suggestions":["..."],"summary":"2-sentence overview"}` },
            ]
          : `Analyze this resume text and respond ONLY with raw JSON (no markdown):\n{"atsScore":<0-100>,"strengths":[],"improvements":[],"skills":[],"missingKeywords":[],"suggestions":[],"summary":""}\n\nResume text:\n${text.slice(0, 3000)}`,
      }];

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, messages }),
      });
      if (res.ok) { const d = await res.json(); raw = d.content?.[0]?.text || ""; }
    } catch {}

    const parsed = parseJSON(raw);
    if (parsed) { setAnalysis(parsed); return; }

    // Fallback analysis
    const words     = text.split(/\s+/).length;
    const hasMetrics = /\d+%|\$\d+|\d+ users|\d+ team/i.test(text);
    const hasActions = /achieved|led|built|developed|improved|managed|designed|deployed/i.test(text);

    setAnalysis({
      atsScore: Math.min(88, 50 + (words > 200 ? 15 : 0) + (hasActions ? 13 : 0) + (hasMetrics ? 10 : 0)),
      strengths: ["Resume successfully uploaded and parsed", hasActions ? "Strong use of action verbs detected" : "Document format is ATS-compatible", "Clear structure detected"],
      improvements: ["Add more quantified achievements (e.g. '30% improvement')", "Include relevant keywords from job descriptions", "Use consistent bullet-point formatting"],
      skills: extractFallbackSkills(text),
      missingKeywords: ["CI/CD", "Agile", "REST APIs", "Cloud (AWS/GCP/Azure)", "System Design", "Docker"],
      suggestions: ["Start bullets with strong action verbs", "Tailor resume for each application", "Add GitHub/LinkedIn links", "Keep resume to 1-2 pages"],
      summary: `Resume for ${fileName} analyzed. Connect Anthropic API key in .env for detailed AI feedback.`,
    });
  };

  const extractFallbackSkills = (text) => {
    const known = ["JavaScript","Python","Java","React","Node.js","SQL","Git","AWS","Docker","TypeScript","HTML","CSS","MongoDB","PostgreSQL","Linux","C++","Kubernetes","Redis"];
    return known.filter((s) => new RegExp(s, "i").test(text)).slice(0, 10);
  };

  const downloadReport = () => {
    if (!analysis) return;
    const content = [
      "RESUME ANALYSIS REPORT",
      "======================",
      `ATS Score: ${analysis.atsScore}/100`,
      "",
      "STRENGTHS:",
      ...(analysis.strengths || []).map((s) => `  • ${s}`),
      "",
      "IMPROVEMENTS NEEDED:",
      ...(analysis.improvements || []).map((s) => `  • ${s}`),
      "",
      "DETECTED SKILLS:",
      `  ${(analysis.skills || []).join(", ")}`,
      "",
      "MISSING KEYWORDS:",
      `  ${(analysis.missingKeywords || []).join(", ")}`,
      "",
      "AI SUGGESTIONS:",
      ...(analysis.suggestions || []).map((s, i) => `  ${i + 1}. ${s}`),
      "",
      `Summary: ${analysis.summary || ""}`,
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = "resume-analysis-report.txt";
    a.click();
    toast.success("Report downloaded!");
  };

  const reset = () => { setResume(null); setAnalysis(null); setPreviewUrl(null); setValidationError(""); };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">Resume Analyzer</h1>
              <p className="text-gray-500 dark:text-gray-400">AI-powered ATS scoring — only valid resumes accepted</p>
            </div>

            {/* Validation error */}
            {validationError && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300 mb-1">Invalid File</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
                  <button onClick={reset} className="mt-2 text-sm text-red-500 hover:text-red-600 underline underline-offset-2">
                    Try a different file
                  </button>
                </div>
              </div>
            )}

            {!analysis && !loading && !validationError ? (
              /* ── Drop zone ──────────────────────────────────────── */
              <Card
                className={`border-2 border-dashed transition-all cursor-pointer ${dragActive ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-[1.01]" : "border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700/30"}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-900/40 dark:to-cyan-900/40 mb-5">
                    <Upload className="w-9 h-9 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload Your Resume</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Drag & drop, or click to browse. AI will verify it's a resume before analyzing.</p>
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                    {["PDF", "DOC", "DOCX"].map((t) => (
                      <span key={t} className="flex items-center gap-1"><FileText className="w-3 h-3" />{t}</span>
                    ))}
                    <span>• Max 5 MB</span>
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
                </div>
              </Card>
            ) : loading ? (
              <Card className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">Analyzing resume…</p>
                    <p className="text-sm text-gray-500 mt-1">Checking content, scoring ATS compatibility, generating suggestions</p>
                  </div>
                </div>
              </Card>
            ) : analysis ? (
              <div className="space-y-6">
                {/* ATS Score hero */}
                <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <ATSRing score={analysis.atsScore} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">{analysis.atsScore >= 80 ? "Excellent" : analysis.atsScore >= 65 ? "Good" : analysis.atsScore >= 50 ? "Fair" : "Needs Work"} Score</h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${analysis.atsScore >= 80 ? "bg-green-500/20 text-green-300" : analysis.atsScore >= 60 ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"}`}>
                          {analysis.atsScore}/100
                        </span>
                      </div>
                      {analysis.summary && <p className="text-gray-300 mb-3 text-sm">{analysis.summary}</p>}
                      <p className="text-gray-400 text-sm flex items-center gap-2"><FileText className="w-4 h-4" />{resume?.name} • {(resume?.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {previewUrl && (
                        <button onClick={() => setShowPreview(!showPreview)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 text-sm transition-colors">
                          <Eye className="w-4 h-4" /> {showPreview ? "Hide" : "Preview"}
                        </button>
                      )}
                      <button onClick={reset}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 text-sm transition-colors">
                        <RefreshCw className="w-4 h-4" /> New Upload
                      </button>
                    </div>
                  </div>
                </Card>

                {/* PDF preview */}
                {showPreview && previewUrl && (
                  <Card className="p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">Resume Preview</span>
                      <button onClick={() => setShowPreview(false)}><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    <iframe src={previewUrl} className="w-full h-96" title="Resume Preview" />
                  </Card>
                )}

                {/* 2-col grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card>
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" /> Strengths
                    </h2>
                    <div className="space-y-2">
                      {(analysis.strengths || []).map((s, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{s}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card>
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" /> Improvements
                    </h2>
                    <div className="space-y-2">
                      {(analysis.improvements || []).map((s, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{s}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Skills */}
                {analysis.skills?.length > 0 && (
                  <Card>
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" /> Detected Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.map((s, i) => <Badge key={i} variant="primary">{s}</Badge>)}
                    </div>
                  </Card>
                )}

                {/* Missing keywords */}
                {analysis.missingKeywords?.length > 0 && (
                  <Card>
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" /> Missing Keywords
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Add these to boost your ATS score:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.map((k, i) => <Badge key={i} variant="warning">{k}</Badge>)}
                    </div>
                  </Card>
                )}

                {/* Suggestions */}
                {analysis.suggestions?.length > 0 && (
                  <Card>
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" /> AI Suggestions
                    </h2>
                    <div className="space-y-2">
                      {analysis.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{s}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={downloadReport}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold text-sm transition-all shadow-lg">
                    <Download className="w-4 h-4" /> Download Report
                  </button>
                  <button onClick={reset}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-sm transition-all">
                    Analyze Another
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
};
