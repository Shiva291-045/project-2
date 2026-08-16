import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { PageWrapper } from "../../components/PageWrapper";
import { Button, Badge } from "../../components/ui";
import {
  Mic, MicOff, Send, StopCircle, RotateCcw, CheckCircle,
  AlertTriangle, Clock, Brain, MessageSquare, Code2, Users,
  TrendingUp, ChevronRight, Star, Crown, Sparkles, ChevronDown,
  Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import api, { withRetry } from "../../services/apiClient";
import { getWeakTopics } from "../../utils/dsaRecommendations";

/* ─── Interview Modes ──────────────────────────────────────────── */
const MODES = [
  { id: "technical",  label: "Technical",  icon: Code2,         color: "from-neon-blue to-neon-cyan",   desc: "DSA, system design, coding" },
  { id: "behavioral", label: "Behavioral", icon: Users,         color: "from-brand-500 to-neon-pink",   desc: "STAR method, leadership" },
  { id: "hr",         label: "HR Round",   icon: MessageSquare, color: "from-neon-cyan to-neon-purple",  desc: "Culture fit, career goals" },
];

const DIFFICULTIES    = ["Easy", "Medium", "Hard"];
const DURATION_OPTIONS = [5, 10, 15, 20];
const STORAGE_KEY      = "prepai_interview_history";

/* ─── 20 Interview Roles ────────────────────────────────────────── */
const ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "AI Engineer",
  "Machine Learning Engineer",
  "Data Scientist",
  "Cloud Engineer",
  "DevOps Engineer",
  "Cybersecurity Analyst",
  "UI/UX Designer",
  "Mobile App Developer",
  "Blockchain Developer",
  "Product Manager",
  "QA Engineer",
  "System Design Engineer",
  "Site Reliability Engineer",
  "Data Engineer",
  "Solutions Architect",
  "Engineering Manager",
];

/* ─── Server-side interview session API ──────────────────────────
   All session state (asked questions, difficulty progression, scoring,
   final report) now lives on the backend. The frontend just calls these
   three endpoints and renders whatever comes back. ─────────────────── */
const startInterviewSession = async (config) => {
  const fn = () => api.post("/api/interview/session/start", {
    mode: config.mode, role: config.role, difficulty: config.difficulty, duration: config.duration,
    company: config.company || "", weakTopics: config.weakTopics || [],
  });
  const { data } = await withRetry(fn, 2, 1000);
  return data?.data;
};

const answerInterviewSession = async (sessionId, answer) => {
  const fn = () => api.post(`/api/interview/session/${sessionId}/answer`, { answer });
  const { data } = await withRetry(fn, 2, 1000);
  return data?.data;
};

const endInterviewSession = async (sessionId) => {
  const fn = () => api.post(`/api/interview/session/${sessionId}/end`, {});
  const { data } = await withRetry(fn, 2, 1000);
  return data?.data;
};

const saveHistory = (session) => {
  try {
    const h = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    h.unshift({ ...session, savedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, 20)));
  } catch (e) {}
};

/* ─── Role Selector ─────────────────────────────────────────────────────────
   Design: the dropdown is part of normal document flow — no absolute/fixed/
   z-index tricks. When open, the list simply renders below the trigger inside
   the same block, pushing every sibling below it downward naturally.
   The page is scrollable so no clipping ever occurs.
──────────────────────────────────────────────────────────────────────────── */
const RoleSelector = ({ value, onChange }) => {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = ROLES.filter(r =>
    r.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (r) => { onChange(r); setOpen(false); setQuery(""); };

  return (
    <div ref={wrapRef} className="w-full">

      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={[
          "w-full flex items-center justify-between px-4 py-3 text-sm font-medium",
          "border transition-colors duration-150",
          open
            ? "bg-[rgba(123,47,247,0.08)] border-neon-purple/50 rounded-t-xl rounded-b-none"
            : "bg-[rgba(255,255,255,0.04)] border-[rgba(155,93,229,0.2)] rounded-xl",
          "hover:bg-[rgba(255,255,255,0.06)] focus:outline-none",
        ].join(" ")}
      >
        <span className={value ? "text-white" : "text-gray-500"}>
          {value || "Select a role…"}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* ── Inline panel — part of document flow, pushes siblings down ── */}
      {open && (
        <div className="w-full border border-t-0 border-neon-purple/30 rounded-b-xl bg-[rgba(10,10,28,0.97)] backdrop-blur-lg">

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-[rgba(155,93,229,0.12)]">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search roles…"
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 bg-[rgba(255,255,255,0.05)] border border-[rgba(155,93,229,0.15)] focus:border-neon-purple/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Scrollable list — fixed height so it never grows beyond viewport */}
          <div
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: "216px" }}
          >
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-sm text-center text-gray-600">No roles found</p>
            ) : (
              filtered.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className={[
                    "w-full text-left px-4 py-2.5 text-sm transition-colors duration-100",
                    value === r
                      ? "bg-brand-500/20 text-brand-300 font-semibold"
                      : "text-gray-300 hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")}
                >
                  {r}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Setup Screen ───────────────────────────────────────────────────────────
   Layout: plain vertical stack — header, type, difficulty/duration, role, button.
   No overlap is possible because nothing uses absolute/fixed/z-index.
   Page is scrollable so the button is always reachable below the role panel.
──────────────────────────────────────────────────────────────────────────── */
const SetupScreen = ({ onStart }) => {
  const [mode,       setMode]       = useState("behavioral");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration,   setDuration]   = useState(10);
  const [role,       setRole]       = useState("Software Engineer");
  const [company,    setCompany]    = useState("");
  const { userProfile } = useAuth();

  // Pre-fill from the user's saved profile (target role / first target
  // company) if they've set one — still fully editable per-session.
  useEffect(() => {
    if (userProfile?.targetRole) setRole(userProfile.targetRole);
    if (userProfile?.targetCompanies?.length) setCompany(userProfile.targetCompanies[0]);
  }, [userProfile]);

  // Weak DSA topics, computed client-side from the same 450-question
  // dataset + solved-problem list the Coding page and Dashboard use — sent
  // along at session start so the interviewer can (lightly) probe them.
  const [weakTopics, setWeakTopics] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/api/coding/solved");
        if (cancelled) return;
        const solvedIds = data?.data?.solvedIds || [];
        setWeakTopics(getWeakTopics(solvedIds, 3).map(t => t.topic));
      } catch {
        // Non-critical — interview still works without weak-topic context
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto w-full px-1 pb-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-7"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            AI Interview
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Configure your session and practice like it&apos;s real
          </p>
        </motion.div>

        {/* ── 1. Interview Type ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="glass rounded-2xl p-5 sm:p-6 border border-[rgba(155,93,229,0.12)] mb-4"
        >
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Interview Type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MODES.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={[
                  "p-4 rounded-xl border text-left transition-all duration-200",
                  mode === m.id
                    ? "border-brand-500/50 bg-brand-500/10"
                    : "border-[rgba(155,93,229,0.1)] hover:border-[rgba(155,93,229,0.3)] hover:bg-white/5",
                ].join(" ")}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center mb-3`}>
                  <m.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">{m.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </motion.section>

        {/* ── 2. Difficulty + Duration ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"
        >
          <div className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.12)]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Difficulty</h3>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d} type="button" onClick={() => setDifficulty(d)}
                  className={[
                    "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border",
                    difficulty === d
                      ? "bg-brand-500/20 text-brand-300 border-brand-500/40"
                      : "text-gray-500 border-transparent hover:text-white hover:border-[rgba(155,93,229,0.2)] hover:bg-white/5",
                  ].join(" ")}
                >{d}</button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.12)]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Duration</h3>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d} type="button" onClick={() => setDuration(d)}
                  className={[
                    "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border",
                    duration === d
                      ? "bg-brand-500/20 text-brand-300 border-brand-500/40"
                      : "text-gray-500 border-transparent hover:text-white hover:border-[rgba(155,93,229,0.2)] hover:bg-white/5",
                  ].join(" ")}
                >{d}m</button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── 3. Target Role ──
            RoleSelector opens DOWNWARD inside this card.
            The card grows in height to contain the open list.
            The button below is pushed down by the natural document flow — zero overlap. */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.12)] mb-4"
        >
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Target Role
            <span className="ml-2 normal-case font-normal text-gray-600">— 20 roles</span>
          </h3>
          <RoleSelector value={role} onChange={setRole} />
        </motion.section>

        {/* ── 3b. Target Company (optional) ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.12)] mb-4"
        >
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Target Company <span className="normal-case font-normal text-gray-600">(optional)</span>
          </h3>
          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="e.g. Amazon, Google, TCS — matches their typical interview style"
            className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.15)] text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/50 transition-all text-sm"
          />
        </motion.section>

        {/* ── 4. Start Button — always the last block, always below everything ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <Button
            variant="primary"
            size="xl"
            className="w-full shadow-brand-lg"
            onClick={() => onStart({ mode, difficulty, duration, role, company, weakTopics })}
          >
            <Brain className="w-5 h-5" />
            Start Interview Session
            <ChevronRight className="w-5 h-5" />
          </Button>
          <p className="text-center text-xs text-gray-600 mt-3 leading-relaxed">
            AI remembers your answers · avoids repeated questions · asks intelligent follow-ups
          </p>
        </motion.div>

      </div>{/* /max-w-2xl */}
    </PageWrapper>
  );
};

/* ─── Chat Message ──────────────────────────────────────────────── */
const Message = ({ role, content, score, feedback }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex gap-3 ${role === "user" ? "justify-end" : "justify-start"}`}
  >
    {role === "assistant" && (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-neon-blue flex-shrink-0 flex items-center justify-center shadow-[0_0_10px_rgba(123,47,247,0.3)]">
        <Brain className="w-4 h-4 text-white" />
      </div>
    )}
    <div className={`max-w-[80%] ${role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        role === "assistant"
          ? "glass border border-[rgba(155,93,229,0.15)] text-gray-200 rounded-tl-sm"
          : "bg-brand-500/20 border border-brand-500/30 text-white rounded-tr-sm"
      }`}>
        {content}
      </div>
      {score !== undefined && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs ${score >= 7 ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20" : score >= 5 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          <Star className="w-3 h-3" />
          Score: {score}/10
          {feedback && <span className="ml-1 text-gray-500">· {feedback}</span>}
        </div>
      )}
    </div>
    {role === "user" && (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-cyan flex-shrink-0 flex items-center justify-center">
        <span className="text-white text-xs font-bold">U</span>
      </div>
    )}
  </motion.div>
);

/* ─── Interview Session ─────────────────────────────────────────── */
const InterviewSession = ({ config, onEnd }) => {
  const [messages,        setMessages]        = useState([]);
  const [input,           setInput]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [connectionErr,   setConnectionErr]   = useState(false);
  const [timeLeft,        setTimeLeft]        = useState(config.duration * 60);
  const [questionCount,   setQuestionCount]   = useState(0);
  const [scores,          setScores]          = useState([]);
  const [sessionId,       setSessionId]       = useState(null);
  const [targetQuestions, setTargetQuestions] = useState(null);
  const [initError,       setInitError]       = useState("");
  const bottomRef  = useRef(null);
  const timerRef   = useRef(null);
  const endingRef  = useRef(false); // guards against double-finalizing
  const messagesRef = useRef(messages);
  const scoresRef   = useRef(scores);
  const questionCountRef = useRef(questionCount);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { questionCountRef.current = questionCount; }, [questionCount]);

  const finalize = useCallback(async (finalMessages, finalScores, report, questionsAnswered) => {
    if (endingRef.current) return;
    endingRef.current = true;
    clearInterval(timerRef.current);

    const avgScore = finalScores.length ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length : 0;
    const session = {
      mode: config.mode, difficulty: config.difficulty, role: config.role, company: config.company,
      duration: config.duration, scores: finalScores, avgScore,
      questionsAnswered,
      sessionId,
      completedAt: new Date().toISOString(),
      transcript: finalMessages.map(m => `${m.role === "user" ? "You" : "AI"}: ${m.content}`).join("\n\n"),
      report: report || null,
    };
    saveHistory(session);

    // Persist to the durable Interview collection (best-effort — the
    // in-progress InterviewSession document already holds the full record).
    try {
      await api.post("/api/interview/save", {
        mode: config.mode, difficulty: config.difficulty, role: config.role, company: config.company,
        duration: config.duration, scores: finalScores, transcript: session.transcript,
        sessionId, questionCount: questionsAnswered,
        analysis: report ? {
          strengths: report.strengths, weaknesses: report.weaknesses,
          overall: report.summary, topicBreakdown: report.topicBreakdown,
          technicalScore: report.technicalScore, communicationScore: report.communicationScore,
          problemSolvingScore: report.problemSolvingScore, recommendedDsaTopics: report.recommendedDsaTopics,
        } : undefined,
      });
    } catch (e) {
      console.warn("[Interview] Failed to persist final record:", e.message);
    }

    onEnd(session);
  }, [config, sessionId, onEnd]);

  // Start session on the backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await startInterviewSession(config);
        if (cancelled) return;
        setSessionId(data.sessionId);
        setTargetQuestions(data.targetQuestions);
        const greeting = `Hello! I'm your AI interviewer for this ${config.mode} session for the ${config.role} role. Let's make this feel like a real interview — be as detailed as you'd be with a hiring manager.\n\n${data.question}`;
        setMessages([{ role: "assistant", content: greeting }]);
        setQuestionCount(1);

        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) {
              clearInterval(timerRef.current);
              // Time's up — finalize with whatever was covered so far
              (async () => {
                try {
                  const result = await endInterviewSession(data.sessionId);
                  finalize(messagesRef.current, scoresRef.current, result?.report, questionCountRef.current);
                } catch {
                  finalize(messagesRef.current, scoresRef.current, null, questionCountRef.current);
                }
              })();
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to start interview session:", err);
        setInitError(err.message || "Failed to start the interview. Please try again.");
      }
    })();
    return () => { cancelled = true; clearInterval(timerRef.current); };
    // eslint-disable-next-line
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !sessionId) return;
    const userMsg = input.trim();
    setInput("");
    setConnectionErr(false);
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const result = await answerInterviewSession(sessionId, userMsg);
      const newScores = result.score != null ? [...scores, result.score] : scores;
      if (result.score != null) setScores(newScores);

      // Attach score/feedback to the just-answered user message
      const withScore = messagesRef.current.map((m, i, arr) =>
        i === arr.length - 1
          ? { ...m, score: result.score ?? undefined, feedback: result.feedback?.substring(0, 90) }
          : m
      );
      const nextMessages = result.done ? withScore : [...withScore, { role: "assistant", content: result.question }];
      setMessages(nextMessages);

      if (result.done) {
        finalize(nextMessages, newScores, result.report, questionCount);
      } else {
        setQuestionCount(q => q + 1);
      }
    } catch (err) {
      console.error("AI call failed:", err);
      setConnectionErr(true);
      toast.error(err.message || "AI response failed. Tap retry or check connection.");
      // Remove the user message on failure so they can retry
      setMessages(prev => [...prev.slice(0, -1)]);
      setInput(userMsg);
    }
    setLoading(false);
  };

  const handleEnd = useCallback(() => {
    if (endingRef.current) return;
    if (!sessionId) { finalize(messages, scores, null, questionCount); return; }
    (async () => {
      try {
        const result = await endInterviewSession(sessionId);
        finalize(messages, scores, result?.report, questionCount);
      } catch (err) {
        console.warn("[Interview] endSession failed, finalizing locally:", err.message);
        finalize(messages, scores, null, questionCount);
      }
    })();
    // eslint-disable-next-line
  }, [sessionId, messages, scores, questionCount]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const timerColor = timeLeft < 60 ? "text-red-400" : timeLeft < 180 ? "text-amber-400" : "text-neon-cyan";
  const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10 : 0;

  if (initError) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto text-center py-16">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Couldn't start the interview</h3>
          <p className="text-gray-400 text-sm mb-6">{initError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <div className="flex h-screen bg-surface">
      {/* Minimal sidebar strip */}
      <div className="w-16 flex-shrink-0 flex flex-col items-center py-4 gap-4 glass-strong border-r border-[rgba(155,93,229,0.1)]">
        <img src="/logo.png" alt="PrepAI" className="w-9 h-9 rounded-xl" />
        <div className="flex-1" />
        <button onClick={handleEnd} className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all" title="End Interview">
          <StopCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="glass-strong border-b border-[rgba(155,93,229,0.1)] px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant={config.mode === "technical" ? "cyan" : config.mode === "behavioral" ? "primary" : "success"} className="capitalize">
              {config.mode}
            </Badge>
            <Badge variant="default">{config.difficulty}</Badge>
            <span className="text-xs text-gray-500 hidden sm:block">{config.role}</span>
          </div>
          <div className="flex items-center gap-5">
            {connectionErr && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <WifiOff className="w-3.5 h-3.5" /> Connection issue
              </div>
            )}
            {scores.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">{avgScore}/10</span>
              </div>
            )}
            <div className={`font-display text-lg font-bold tabular-nums ${timerColor}`}>
              <Clock className="w-4 h-4 inline mr-1.5" />{fmt(timeLeft)}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.map((m, i) => (
            <Message key={i} {...m} />
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-neon-blue flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="glass rounded-2xl px-4 py-3 border border-[rgba(155,93,229,0.15)]">
                <div className="flex gap-1.5 items-center">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-neon-purple"
                      animate={{ scale: [1,1.4,1] }} transition={{ delay: i*0.15, repeat: Infinity, duration: 0.9 }} />
                  ))}
                  <span className="text-xs text-gray-600 ml-2">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="glass-strong border-t border-[rgba(155,93,229,0.1)] px-6 py-4 flex-shrink-0">
          {connectionErr && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-400"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Connection issue — your answer was restored. Check your network and try again.
              <button onClick={() => setConnectionErr(false)} className="ml-auto text-gray-500 hover:text-white"><RefreshCw className="w-3.5 h-3.5" /></button>
            </motion.div>
          )}
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
              rows={3}
              className="flex-1 px-4 py-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.15)] text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/50 resize-none text-sm leading-relaxed transition-all"
            />
            <div className="flex flex-col gap-2">
              <Button variant="primary" size="md" onClick={handleSend} disabled={loading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
              <Button variant="danger" size="md" onClick={handleEnd}>
                <StopCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-700 mt-2 text-center">AI tracks context and adapts questions · {questionCount} question{questionCount !== 1 ? "s" : ""} so far · {config.role}</p>
        </div>
      </div>
    </div>
  );
};

/* ─── Results ───────────────────────────────────────────────────── */
const ResultsScreen = ({ session, onRestart }) => {
  const navigate = useNavigate();
  const avg = session.scores?.length
    ? Math.round(session.scores.reduce((a,b)=>a+b,0)/session.scores.length*10)
    : 0;

  const grade = avg >= 85 ? { label: "Excellent!", color: "text-neon-cyan", bg: "from-neon-cyan/20 to-green-500/10" }
    : avg >= 70 ? { label: "Good Job!", color: "text-brand-300", bg: "from-brand-500/20 to-neon-blue/10" }
    : avg >= 55 ? { label: "Keep Practicing", color: "text-amber-400", bg: "from-amber-500/20 to-orange-500/10" }
    : { label: "Needs Improvement", color: "text-red-400", bg: "from-red-500/20 to-rose-500/10" };

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
          <motion.div animate={{ y: [0,-8,0] }} transition={{ duration:3, repeat:Infinity }}>
            <img src="/logo.png" alt="PrepAI" className="w-20 h-20 mx-auto rounded-2xl shadow-brand mb-6" />
          </motion.div>
          <h2 className="font-display text-4xl font-extrabold text-white mb-2">Session Complete!</h2>
          <p className="text-gray-400">Here's how you performed as {session.role}</p>
        </motion.div>

        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className={`glass rounded-3xl p-10 border border-[rgba(155,93,229,0.2)] bg-gradient-to-br ${grade.bg} mb-6`}
        >
          <p className={`font-display text-7xl font-extrabold ${grade.color} mb-2`}>{avg}%</p>
          <p className={`text-xl font-semibold ${grade.color} mb-4`}>{grade.label}</p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: "Questions", value: session.questionsAnswered || session.scores?.length || 0 },
              { label: "Duration",  value: `${session.duration}min` },
              { label: "Mode",      value: session.mode },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl py-3 px-2 border border-[rgba(155,93,229,0.1)]">
                <p className="font-display text-xl font-bold text-white capitalize">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button variant="primary" size="lg" className="flex-1 shadow-brand" onClick={onRestart}>
            <RotateCcw className="w-5 h-5" /> New Session
          </Button>
          <Button variant="secondary" size="lg" className="flex-1" onClick={() => navigate("/analytics")}>
            <TrendingUp className="w-5 h-5" /> View Analytics
          </Button>
          <Button variant="secondary" size="lg" className="flex-1" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

/* ─── Main component ────────────────────────────────────────────── */
export const InterviewRoom = () => {
  const [phase,   setPhase]   = useState("setup");
  const [config,  setConfig]  = useState(null);
  const [results, setResults] = useState(null);

  const handleStart   = (cfg) => { setConfig(cfg); setPhase("session"); };
  const handleEnd     = (res) => { setResults(res); setPhase("results"); };
  const handleRestart = () => { setConfig(null); setResults(null); setPhase("setup"); };

  if (phase === "setup")   return <SetupScreen onStart={handleStart} />;
  if (phase === "session") return <InterviewSession config={config} onEnd={handleEnd} />;
  if (phase === "results") return <ResultsScreen session={results} onRestart={handleRestart} />;
  return null;
};
