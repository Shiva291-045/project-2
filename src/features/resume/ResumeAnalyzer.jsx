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

/* ── Fallback client-side detection (lenient) ──────────────────────────── */
const SECTIONS  = ["experience","education","skills","projects","objective","summary","achievements","certifications","internship","work history","employment","profile","languages","awards","references","work experience","professional experience","technical skills","core competencies","career objective","accomplishments","responsibilities"];
const KEYWORDS  = ["bachelor","master","degree","university","college","engineer","developer","manager","intern","github","linkedin","email","phone","years","responsibilities","technologies","frameworks","proficient","collaborated","developed","designed","implemented","led","built","maintained","deployed","optimized","created","managed","achieved","improved","launched","delivered","coordinated","worked","contributed","team","project","experience","skills"];
const NORESUME  = ["invoice","receipt","bill","total amount","gst","tax invoice","payment received","order id","unit price","date of purchase","terms and conditions","prescription","diagnosis","patient name","doctor","chapter","table of contents","bibliography","appendix","yours sincerely","dear sir"];

const detectClient = (text) => {
  // If text extraction failed or too short, still allow — server will do deeper check
  if (!text || text.trim().length < 20)
    return { ok: false, reason: "Could not read file content. Please ensure the PDF is not password-protected or try a .docx/.txt file." };
  const lower = text.toLowerCase();
  // Hard reject only obvious non-resumes with many commercial flags
  const flags = NORESUME.filter((f) => lower.includes(f)).length;
  if (flags >= 5) return { ok: false, reason: "This file looks like an invoice, receipt, or non-resume document. Please upload your CV or resume." };
  // Very lenient — if the file has any text at all (PDF extraction often misses sections)
  // let the server do the real validation
  const sHits = SECTIONS.filter((s) => lower.includes(s));
  const kHits = KEYWORDS.filter((k) => lower.includes(k));
  // Accept if: ≥1 section OR ≥2 keywords OR file name looks like resume OR text > 200 chars
  const looksLikeResume = /resume|cv|curriculum/i.test(text) || text.trim().length > 200;
  if (sHits.length < 1 && kHits.length < 2 && !looksLikeResume)
    return { ok: false, reason: "The uploaded file does not appear to be a resume. Please upload a document with sections like Education, Skills, or Experience." };
  return { ok: true, confidence: Math.min(100, 40 + sHits.length * 7 + kHits.length * 2), sections: sHits.slice(0,5) };
};

/* ── ATS ring SVG ──────────────────────────────────────────────────────── */
const ATSRing = ({ score }) => {
  const r = 52, c = 2 * Math.PI * r;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#374151" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${(score/100)*c} ${c}`} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: "stroke-dasharray 1.2s ease" }} />
      <text x="70" y="64" textAnchor="middle" fill={color} fontSize="28" fontWeight="bold">{score}</text>
      <text x="70" y="83" textAnchor="middle" fill="#9ca3af" fontSize="12">ATS Score</text>
    </svg>
  );
};

/* ── Section score bar ─────────────────────────────────────────────────── */
const ScoreBar = ({ label, score, icon: Icon, color }) => (
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
        <span className="text-gray-900 dark:text-white font-bold">{score}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  </div>
);

/* ── Main component ────────────────────────────────────────────────────── */
export const ResumeAnalyzer = () => {
  const [resume,      setResume]      = useState(null);
  const [analysis,    setAnalysis]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [dragActive,  setDragActive]  = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [valError,    setValError]    = useState("");
  const fileRef = useRef(null);

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type !== "dragleave"); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); processFile(e.dataTransfer.files?.[0]); };

  const processFile = async (file) => {
    if (!file) return;
    const okTypes = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!okTypes.includes(file.type)) { toast.error("Only PDF, DOC, or DOCX files accepted."); return; }
    if (file.size > 5*1024*1024)      { toast.error("File must be under 5 MB.");               return; }

    setLoading(true); setAnalysis(null); setValError("");

    try {
      const url    = URL.createObjectURL(file);
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      setPreviewUrl(url);
      setResume({ name: file.name, size: file.size, type: file.type });

      /* ── Extract text from PDF for client-side validation ── */
      let extractedText = "";
      if (file.type === "application/pdf") {
        try {
          const pdfjsLib = await import("pdfjs-dist/build/pdf");
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const pdf = await pdfjsLib.getDocument({ data: atob(base64) }).promise;
          for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            extractedText += content.items.map((s) => s.str).join(" ") + "\n";
          }
        } catch (e) { extractedText = file.name; }
      }

      /* ── Client-side resume check (lenient gate) ── */
      const detection = detectClient(extractedText);
      if (!detection.ok) {
        setValError(detection.reason);
        setLoading(false);
        toast.error("File rejected: not a valid resume.");
        return;
      }

      toast.success(`Resume detected (${detection.confidence || 70}% confidence). Analyzing…`);

      /* ── Send to backend for full analysis ── */
      try {
        const { data } = await api.post("/api/resume/analyze", {
          extractedText,
          fileName: file.name,
          base64,
          mimeType: file.type,
        });
        setAnalysis(data.data);
      } catch (backendErr) {
        // Fallback: run simple client-side analysis
        setAnalysis(buildFallback(extractedText, file.name));
        toast("Backend not connected — showing local analysis.", { icon: "ℹ️" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to process file.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Fallback when backend is unavailable ── */
  const buildFallback = (text, name) => {
    const TECH = ["JavaScript","Python","Java","React","Node.js","SQL","Git","AWS","Docker","TypeScript","HTML","CSS","MongoDB","PostgreSQL","Linux","C++","Kubernetes","Redis","GraphQL","REST"];
    const skills = TECH.filter((s) => new RegExp(s,"i").test(text)).slice(0, 10);
    const hasMetrics = /\d+%|\$\d+|\d+ (users|team)/i.test(text);
    const hasActions = /achieved|led|built|developed|improved|managed/i.test(text);
    const score = Math.min(88, 48 + (skills.length*2) + (hasMetrics?10:0) + (hasActions?8:0));
    return {
      atsScore: score,
      strengths: [hasActions?"Strong action verbs used":"Document structure is ATS-compatible", skills.length>3?"Good technical skills section":"Contact info present", "Format is readable by ATS", "Document parsed successfully"],
      improvements: ["Add quantified achievements (e.g. '30% improvement')", "Include target job keywords", "Add a professional summary", "Expand project descriptions"],
      skills, missingKeywords: ["CI/CD","Agile","System Design","DevOps","Docker","Kubernetes"].filter(k => !text.includes(k)).slice(0,5),
      suggestions: ["Start bullets with action verbs","Tailor resume per job description","Keep to 1-2 pages","Add GitHub/LinkedIn links"],
      summary: `${name} analyzed locally. Connect backend for AI-powered analysis.`,
      sections: { skillsScore: skills.length>5?80:50, experienceScore: hasMetrics?80:55, projectsScore: /project/i.test(text)?70:30, formatScore: 70 },
      trendingSkills: ["LLMs/AI Integration","TypeScript","Docker","Kubernetes","React Native"],
      recommendedTech: ["Next.js","FastAPI","Terraform","Redis","GraphQL"],
    };
  };

  const downloadReport = () => {
    if (!analysis) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[
      "PREPAI RESUME ANALYSIS REPORT","=".repeat(30),
      `ATS Score: ${analysis.atsScore}/100`,`File: ${resume?.name}`,`Date: ${new Date().toLocaleDateString()}`,
      "","STRENGTHS:", ...(analysis.strengths||[]).map(s=>`  • ${s}`),
      "","IMPROVEMENTS:", ...(analysis.improvements||[]).map(s=>`  • ${s}`),
      "","SKILLS FOUND:", `  ${(analysis.skills||[]).join(", ")}`,
      "","MISSING KEYWORDS:", `  ${(analysis.missingKeywords||[]).join(", ")}`,
      "","SECTION SCORES:", ...(analysis.sections?Object.entries(analysis.sections).map(([k,v])=>`  ${k}: ${v}%`):[]),
      "","TRENDING SKILLS:", `  ${(analysis.trendingSkills||[]).join(", ")}`,
      "","RECOMMENDATIONS:", ...(analysis.suggestions||[]).map((s,i)=>`  ${i+1}. ${s}`),
      "","SUMMARY:", `  ${analysis.summary||""}`,
    ].join("\n")], { type: "text/plain" }));
    a.download = "prepai-resume-report.txt"; a.click();
    toast.success("Report downloaded!");
  };

  const reset = () => { setResume(null); setAnalysis(null); setPreviewUrl(null); setValError(""); };

  // Radar chart data
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

            {/* Validation error */}
            {valError && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300 mb-1">Invalid File</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{valError}</p>
                  <button onClick={reset} className="mt-2 text-sm text-red-500 underline underline-offset-2">Try a different file</button>
                </div>
              </div>
            )}

            {!analysis && !loading && !valError ? (
              <div className={`glass rounded-2xl border-2 border-dashed cursor-pointer transition-all ${dragActive ? "border-neon-purple bg-brand-500/10 scale-[1.01]" : "border-[rgba(155,93,229,0.2)] hover:border-neon-purple/60"}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileRef.current?.click()}>
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-900/40 dark:to-cyan-900/40 mb-5">
                    <Upload className="w-9 h-9 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload Your Resume</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Drag & drop, or click to browse</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">PDF · DOC · DOCX · Max 5MB · AI validates before analyzing</p>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={(e) => processFile(e.target.files?.[0])} className="hidden" />
                </div>
              </div>
            ) : loading ? (
              <div className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">Analyzing resume…</p>
                    <p className="text-sm text-gray-500 mt-1">Extracting skills · Scoring ATS compatibility · Generating suggestions</p>
                  </div>
                </div>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                {/* Hero: ATS score + preview controls */}
                <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-6">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <ATSRing score={analysis.atsScore} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">
                          {analysis.atsScore >= 80 ? "Excellent" : analysis.atsScore >= 65 ? "Good" : analysis.atsScore >= 50 ? "Fair" : "Needs Work"} Score
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${analysis.atsScore>=80?"bg-green-500/20 text-green-300":analysis.atsScore>=60?"bg-yellow-500/20 text-yellow-300":"bg-red-500/20 text-red-300"}`}>
                          {analysis.atsScore}/100
                        </span>
                      </div>
                      {analysis.summary && <p className="text-gray-300 text-sm mb-3">{analysis.summary}</p>}
                      <p className="text-gray-400 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4" />{resume?.name} · {(resume?.size/1024).toFixed(0)} KB
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {previewUrl && (
                        <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 text-sm">
                          <Eye className="w-4 h-4" /> {showPreview?"Hide":"Preview"}
                        </button>
                      )}
                      <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 text-sm">
                        <RefreshCw className="w-4 h-4" /> New Upload
                      </button>
                    </div>
                  </div>
                </div>

                {showPreview && previewUrl && (
                  <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">Resume Preview</span>
                      <button onClick={() => setShowPreview(false)}><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    <iframe src={previewUrl} className="w-full h-96" title="Resume Preview" />
                  </div>
                )}

                {/* Section scores + radar */}
                {SECTION_BARS.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                      <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" /> Section Breakdown
                      </h2>
                      <div className="space-y-4">
                        {SECTION_BARS.map((s) => <ScoreBar key={s.label} {...s} />)}
                      </div>
                    </div>
                    <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Skill Radar</h2>
                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#374151" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                          <PolarRadiusAxis domain={[0,100]} tick={{ fontSize: 9, fill: "#6b7280" }} />
                          <Radar dataKey="score" stroke="#9333ea" fill="#9333ea" fillOpacity={0.3} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Strengths + Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" /> Strengths
                    </h2>
                    <div className="space-y-2">
                      {(analysis.strengths||[]).map((s,i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" /> Improvements
                    </h2>
                    <div className="space-y-2">
                      {(analysis.improvements||[]).map((s,i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Skills found */}
                {analysis.skills?.length > 0 && (
                  <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" /> Detected Skills ({analysis.skills.length})
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.map((s,i) => <Badge key={i} variant="primary">{s}</Badge>)}
                    </div>
                  </div>
                )}

                {/* Missing keywords */}
                {analysis.missingKeywords?.length > 0 && (
                  <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" /> Missing Keywords
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Add these to boost your ATS score:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.map((k,i) => <Badge key={i} variant="warning">{k}</Badge>)}
                    </div>
                  </div>
                )}

                {/* Trending skills + recommended tech */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {analysis.trendingSkills?.length > 0 && (
                    <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                      <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-500" /> Trending Industry Skills
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {analysis.trendingSkills.map((s,i) => <Badge key={i} variant="default">{s}</Badge>)}
                      </div>
                    </div>
                  )}
                  {analysis.recommendedTech?.length > 0 && (
                    <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                      <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-blue-500" /> Recommended Technologies
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {analysis.recommendedTech.map((s,i) => <Badge key={i} variant="primary">{s}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI suggestions */}
                {analysis.suggestions?.length > 0 && (
                  <div className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-500" /> AI Improvement Suggestions
                    </h2>
                    <div className="space-y-2">
                      {analysis.suggestions.map((s,i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={downloadReport} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold text-sm shadow-lg transition-all">
                    <Download className="w-4 h-4" /> Download Full Report
                  </button>
                  <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-sm transition-all">
                    Analyze Another Resume
                  </button>
                </div>
              </div>
            ) : null}
    </PageWrapper>
  );
};
