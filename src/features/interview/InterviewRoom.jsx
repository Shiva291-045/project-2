import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

/* ─── Role-specific opening question banks ──────────────────────── */
const ROLE_QUESTION_BANKS = {
  "AI Engineer": {
    technical: [
      "Explain the transformer architecture and why attention mechanisms were a breakthrough over RNNs.",
      "How would you approach fine-tuning a large language model for a domain-specific task?",
      "What's the difference between RAG and fine-tuning, and when would you choose each?",
      "Describe how you'd design a production ML pipeline for real-time inference.",
      "How do you handle model drift and performance degradation in production?",
    ],
    behavioral: [
      "Tell me about an AI/ML project where results didn't meet expectations and how you responded.",
      "Describe a time you had to explain a complex AI concept to a non-technical stakeholder.",
      "How have you kept up with the rapidly evolving AI landscape?",
    ],
  },
  "Cloud Engineer": {
    technical: [
      "Compare AWS, GCP, and Azure for a microservices-based SaaS product — what would you choose and why?",
      "How would you design a multi-region, highly available architecture with <99.99% downtime tolerance?",
      "Explain Kubernetes pod scheduling and how you'd handle resource constraints.",
      "What's your approach to cloud cost optimization at scale?",
      "Describe how you'd implement a zero-trust security model in a cloud environment.",
    ],
    behavioral: [
      "Tell me about a major outage you managed. What was your incident response process?",
      "Describe a time you had to migrate a legacy system to the cloud.",
    ],
  },
  "DevOps Engineer": {
    technical: [
      "Walk me through a CI/CD pipeline you've built from scratch.",
      "How would you implement blue-green deployments with zero downtime?",
      "Explain the differences between Docker and Kubernetes and when you'd use each.",
      "How do you approach monitoring and observability in a distributed system?",
      "Describe your strategy for secrets management and security in pipelines.",
    ],
    behavioral: [
      "Tell me about a deployment that went wrong and how you handled the rollback.",
      "How do you balance velocity with stability when shipping frequently?",
    ],
  },
};

/* ─── Generic question banks per mode ──────────────────────────── */
const QUESTION_BANKS = {
  technical: [
    "Tell me about yourself and your technical background.",
    "What's a challenging technical problem you've solved recently?",
    "Explain the difference between SQL and NoSQL databases and when you'd choose each.",
    "What is the time complexity of quicksort, and when would you prefer it over mergesort?",
    "How does garbage collection work in your primary programming language?",
    "Describe REST vs GraphQL — what are the trade-offs?",
    "What is the CAP theorem and how does it affect distributed system design?",
    "Walk me through how you'd approach designing a URL shortener like bit.ly.",
    "Explain the difference between a process and a thread.",
    "How would you debug a production performance issue with no prior context?",
    "What design patterns do you use most frequently and why?",
    "Explain microservices vs monolithic architecture — trade-offs for each.",
    "How do you approach code reviews? What do you look for?",
    "Describe your approach to writing testable, maintainable code.",
    "What is eventual consistency and where have you dealt with it?",
  ],
  behavioral: [
    "Tell me about a time you faced a difficult technical challenge and how you solved it.",
    "Describe a situation where you had to work with a very tight deadline.",
    "Give me an example of a time you disagreed with a team decision. What did you do?",
    "Tell me about a project you're most proud of and your specific contribution.",
    "Describe a situation where you had to learn something completely new under pressure.",
    "Tell me about a time you received critical feedback. How did you respond?",
    "Give an example of when you had to influence someone without direct authority.",
    "Describe a failure you experienced. What did you learn from it?",
    "Tell me about a time you mentored or helped a colleague grow.",
    "Give an example of how you prioritize when everything feels urgent.",
    "How did you handle a situation where you had to deliver bad news?",
    "Tell me about a time you improved a process or system significantly.",
  ],
  hr: [
    "Tell me about yourself and what brings you here today.",
    "Why are you interested in this specific role and company?",
    "Where do you see your career in the next 3–5 years?",
    "What are your salary expectations and how did you arrive at that number?",
    "What motivates you most in your work?",
    "How do you handle stress and pressure at work?",
    "What do you consider your greatest professional strength?",
    "What's an area you're actively working to improve?",
    "How do you prefer to receive feedback from managers?",
    "Why are you looking to leave your current role?",
    "What kind of team culture do you thrive in?",
    "How do you approach work-life balance?",
  ],
};

/* ─── AI call with retry ───────────────────────────────────────── */
const callAI = async (messages, system, retries = 2) => {
  const fn = () => api.post("/api/interview/ai", { messages, systemPrompt: system });
  const { data } = await withRetry(fn, retries, 1000);
  return data?.data?.text || "";
};

const saveHistory = (session) => {
  try {
    const h = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    h.unshift({ ...session, savedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, 20)));
  } catch (e) {}
};

/* ─── Role Selector Component ───────────────────────────────────── */
const RoleSelector = ({ value, onChange }) => {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropRef    = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropRef.current    && !dropRef.current.contains(e.target)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Recalculate position whenever open toggles or window resizes
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + window.scrollY + 8, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const filtered = ROLES.filter(r => r.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.15)] text-white focus:outline-none focus:border-neon-purple/50 transition-all text-left flex items-center justify-between"
      >
        <span className={value ? "text-white" : "text-gray-500"}>{value || "Select a role..."}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Portal dropdown — rendered in document.body so it never overlaps siblings */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              top:      coords.top,
              left:     coords.left,
              width:    coords.width,
              zIndex:   9999,
            }}
            className="glass-strong rounded-xl border border-[rgba(155,93,229,0.25)] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-[rgba(155,93,229,0.12)]">
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search roles…"
                className="w-full px-3 py-2 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
              />
            </div>
            {/* List */}
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { onChange(role); setOpen(false); setQuery(""); }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-all ${
                    value === role
                      ? "bg-brand-500/20 text-brand-300 font-medium"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {role}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-600 text-center">No roles found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Setup Screen ──────────────────────────────────────────────── */
const SetupScreen = ({ onStart }) => {
  const [mode,       setMode]       = useState("behavioral");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration,   setDuration]   = useState(10);
  const [role,       setRole]       = useState("Software Engineer");
  const { userProfile } = useAuth();
  const isPremium = userProfile?.isPremium;

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-4xl font-extrabold text-white">AI Interview</h1>
          <p className="text-gray-400 mt-2">Configure your session and practice like it's real</p>
        </motion.div>

        {/* Mode selection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 border border-[rgba(155,93,229,0.1)] mb-5">
          <h2 className="font-display font-semibold text-white mb-4">Interview Type</h2>
          <div className="grid grid-cols-3 gap-3">
            {MODES.map(m => (
              <button
                key={m.id} onClick={() => setMode(m.id)}
                className={`p-4 rounded-xl border transition-all duration-200 text-left ${mode === m.id ? "border-brand-500/50 bg-brand-500/10" : "border-[rgba(155,93,229,0.1)] hover:border-[rgba(155,93,229,0.3)] hover:bg-white/5"}`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center mb-3`}>
                  <m.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">{m.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Difficulty + Duration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 gap-4 mb-5">
          <div className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.1)]">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Difficulty</h3>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d} onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${difficulty === d ? "bg-brand-500/20 text-brand-300 border border-brand-500/40" : "text-gray-500 hover:text-white border border-transparent hover:border-[rgba(155,93,229,0.2)]"}`}
                >{d}</button>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.1)]">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Duration</h3>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d} onClick={() => setDuration(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${duration === d ? "bg-brand-500/20 text-brand-300 border border-brand-500/40" : "text-gray-500 hover:text-white border border-transparent hover:border-[rgba(155,93,229,0.2)]"}`}
                >{d}m</button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Role selector — extra bottom padding so dropdown never overlaps what's below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.1)] mb-6"
          style={{ isolation: "isolate" }}
        >
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Target Role{" "}
            <span className="text-gray-600">(20 roles available)</span>
          </h3>
          {/* Wrapper gives the trigger a stable size; dropdown escapes via fixed positioning */}
          <div className="relative">
            <RoleSelector value={role} onChange={setRole} />
          </div>
        </motion.div>

        {/* ── Start button — always rendered BELOW the role card, never overlapped ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="relative z-0 mt-2"
        >
          <Button
            variant="primary" size="xl"
            className="w-full shadow-brand-lg"
            onClick={() => onStart({ mode, difficulty, duration, role })}
          >
            <Brain className="w-5 h-5" />
            Start Interview Session
            <ChevronRight className="w-5 h-5" />
          </Button>
          <p className="text-center text-xs text-gray-600 mt-3">
            AI remembers your answers, avoids repeated questions, and asks intelligent follow-ups
          </p>
        </motion.div>
      </div>
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
  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [connectionErr,  setConnectionErr]  = useState(false);
  const [timeLeft,       setTimeLeft]       = useState(config.duration * 60);
  const [questionCount,  setQuestionCount]  = useState(0);
  const [scores,         setScores]         = useState([]);
  const [askedQuestions, setAskedQuestions] = useState(new Set());
  const bottomRef = useRef(null);
  const timerRef  = useRef(null);

  // Build rich context-aware system prompt
  const systemPrompt = useMemo(() => {
    const roleBank = ROLE_QUESTION_BANKS[config.role];
    const roleContext = roleBank ? `\nRole-specific focus areas for ${config.role} are available in your context.` : "";
    return `You are an expert ${config.mode} interviewer at a top tech company conducting a ${config.difficulty.toLowerCase()}-level interview for a ${config.role} position.

CORE BEHAVIORAL RULES:
1. NEVER repeat a question that has already been asked — track the full conversation history
2. Ask ONE question at a time — never multiple questions in one response
3. Based on the candidate's last answer, ask an intelligent FOLLOW-UP that:
   - If answer was vague → ask for specifics: "Can you walk me through a concrete example?"
   - If answer was strong → increase difficulty: probe edge cases, trade-offs, or deeper concepts
   - If answer was off-topic → redirect: "I appreciate that, but let's refocus on [topic]"
   - If answer revealed a gap → explore it: ask them to explain the concept they seemed uncertain about
4. Validate answer relevance — if they answer a different question, acknowledge and redirect
5. Maintain conversation memory — reference earlier answers to show you're tracking

RESPONSE FORMAT (strictly follow this):
FEEDBACK: [2-3 sentence honest assessment of their specific answer — be constructive, not generic]
SCORE: [X/10]
NEXT: [Your next question — make it a natural follow-up to what they just said]

Difficulty: ${config.difficulty}
Role: ${config.role}
Interview Type: ${config.mode}
Questions asked: ${questionCount}${roleContext}

Remember: Great interviewers make candidates feel heard while probing for depth.`;
  }, [config, questionCount]);

  // Get opening question — role-specific if available, else from generic bank
  const getOpeningQuestion = useCallback(() => {
    const roleBank = ROLE_QUESTION_BANKS[config.role];
    const modeBank = roleBank?.[config.mode] || QUESTION_BANKS[config.mode] || QUESTION_BANKS.behavioral;
    const available = modeBank.filter(q => !askedQuestions.has(q));
    const pool = available.length > 0 ? available : modeBank;
    const q = pool[Math.floor(Math.random() * pool.length)];
    setAskedQuestions(prev => new Set([...prev, q]));
    return q;
  }, [config.mode, config.role, askedQuestions]);

  // Start session
  useEffect(() => {
    const opener = getOpeningQuestion();
    const greeting = `Hello! I'm your AI interviewer for this ${config.mode} session for the ${config.role} role. Let's make this feel like a real interview — be as detailed as you'd be with a hiring manager.\n\n${opener}`;
    setMessages([{ role: "assistant", content: greeting }]);
    setQuestionCount(1);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleEnd(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setConnectionErr(false);
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      // Full conversation history for context
      const history = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg },
      ];

      const aiText = await callAI(history, systemPrompt);

      // Parse structured response
      const scoreMatch   = aiText.match(/SCORE:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
      const feedbackMatch = aiText.match(/FEEDBACK:\s*(.+?)(?=\nSCORE:|SCORE:)/is);
      const nextMatch    = aiText.match(/NEXT:\s*([\s\S]+?)$/i);

      const score    = scoreMatch    ? parseFloat(scoreMatch[1])   : null;
      const feedback = feedbackMatch ? feedbackMatch[1].trim()     : null;
      const nextQ    = nextMatch     ? nextMatch[1].trim()         : null;

      // Track the new question to avoid repeats
      if (nextQ) setAskedQuestions(prev => new Set([...prev, nextQ]));

      // Build clean display text
      let displayText = "";
      if (feedback) displayText += feedback + "\n\n";
      if (nextQ)    displayText += nextQ;
      if (!displayText) displayText = aiText.replace(/FEEDBACK:.*?\n/is, "").replace(/SCORE:.*?\n/i, "").replace(/NEXT:/i, "").trim();

      if (score !== null) setScores(prev => [...prev, score]);

      setMessages(prev => [
        ...prev.slice(0, -1),
        { ...prev[prev.length - 1], score: score ?? undefined, feedback: feedback?.substring(0, 70) },
        { role: "assistant", content: displayText },
      ]);
      setQuestionCount(q => q + 1);
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
    clearInterval(timerRef.current);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const session = {
      mode: config.mode, difficulty: config.difficulty, role: config.role,
      duration: config.duration, scores, avgScore,
      questionsAnswered: questionCount,
      completedAt: new Date().toISOString(),
      transcript: messages.map(m => `${m.role === "user" ? "You" : "AI"}: ${m.content}`).join("\n\n"),
    };
    saveHistory(session);
    onEnd(session);
  }, [scores, config, questionCount, messages, onEnd]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const timerColor = timeLeft < 60 ? "text-red-400" : timeLeft < 180 ? "text-amber-400" : "text-neon-cyan";
  const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10 : 0;

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
