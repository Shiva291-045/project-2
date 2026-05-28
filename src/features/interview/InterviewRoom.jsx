import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { PageWrapper } from "../../components/PageWrapper";
import { Button, Badge } from "../../components/ui";
import {
  Mic, MicOff, Send, StopCircle, RotateCcw, CheckCircle,
  AlertTriangle, Clock, Brain, MessageSquare, Code2, Users,
  TrendingUp, ChevronRight, Star, Crown, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/apiClient";

/* ─── Modes ────────────────────────────────────────────────────── */
const MODES = [
  { id: "technical",  label: "Technical",  icon: Code2,         color: "from-neon-blue to-neon-cyan",   desc: "DSA, system design, coding" },
  { id: "behavioral", label: "Behavioral", icon: Users,         color: "from-brand-500 to-neon-pink",   desc: "STAR method, leadership" },
  { id: "hr",         label: "HR Round",   icon: MessageSquare, color: "from-neon-cyan to-neon-purple",  desc: "Culture fit, career goals" },
];
const DIFFICULTIES    = ["Easy", "Medium", "Hard"];
const DURATION_OPTIONS = [5, 10, 15, 20];
const STORAGE_KEY      = "prepai_interview_history";

/* ─── Diverse opening question banks ───────────────────────────── */
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
  ],
};

/* ─── AI call ──────────────────────────────────────────────────── */
const callAI = async (messages, system) => {
  const { data } = await api.post("/api/interview/ai", { messages, systemPrompt: system });
  return data?.data?.text || "";
};

const saveHistory = (session) => {
  try {
    const h = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    h.unshift({ ...session, savedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, 20)));
  } catch (e) {}
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

        {/* Role input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.1)] mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Target Role</h3>
          <input
            value={role} onChange={e => setRole(e.target.value)}
            placeholder="e.g. Software Engineer, Data Scientist..."
            className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.15)] text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/50 transition-all"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button variant="primary" size="xl" className="w-full shadow-brand-lg" onClick={() => onStart({ mode, difficulty, duration, role })}>
            <Brain className="w-5 h-5" /> Start Interview Session
            <ChevronRight className="w-5 h-5" />
          </Button>
          <p className="text-center text-xs text-gray-600 mt-3">AI will adapt questions based on your answers — just like a real interviewer</p>
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
  const { userProfile } = useAuth();
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [timeLeft,     setTimeLeft]     = useState(config.duration * 60);
  const [questionCount, setQuestionCount] = useState(0);
  const [scores,       setScores]       = useState([]);
  const [usedQuestions, setUsedQuestions] = useState(new Set());
  const [pendingScore, setPendingScore] = useState(null);
  const bottomRef = useRef(null);
  const timerRef  = useRef(null);

  // Build dynamic system prompt
  const systemPrompt = useMemo(() => `You are an expert ${config.mode} interviewer for a ${config.difficulty.toLowerCase()}-level ${config.role} position.

CRITICAL RULES:
1. NEVER repeat a question that has already been asked in this conversation
2. Ask dynamic FOLLOW-UP questions based on what the candidate just said — probe deeper, challenge assumptions, ask for examples
3. If their answer is vague, ask them to elaborate with specifics
4. If their answer is strong, increase difficulty naturally
5. Validate answer relevance — if they go off-topic, redirect politely
6. Keep a natural conversational tone — don't be robotic
7. After EACH answer, provide:
   - A brief, honest score out of 10
   - One specific improvement tip
   - Then naturally transition to your next question

Format responses as:
FEEDBACK: [1-2 sentence honest assessment]
SCORE: [X/10]
NEXT: [Your follow-up or next question]

Difficulty: ${config.difficulty}
Role: ${config.role}
Type: ${config.mode}
Questions asked so far: ${questionCount}`, [config, questionCount]);

  // Get a random unused opening question
  const getOpeningQuestion = useCallback(() => {
    const bank = QUESTION_BANKS[config.mode] || QUESTION_BANKS.behavioral;
    const available = bank.filter(q => !usedQuestions.has(q));
    const pool = available.length > 0 ? available : bank;
    const q = pool[Math.floor(Math.random() * pool.length)];
    setUsedQuestions(prev => new Set([...prev, q]));
    return q;
  }, [config.mode, usedQuestions]);

  // Start with opening question
  useEffect(() => {
    const opener = getOpeningQuestion();
    setMessages([{ role: "assistant", content: `Hello! I'm your AI interviewer for this ${config.mode} session. Let's begin!\n\n${opener}` }]);
    setQuestionCount(1);
    // Start timer
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
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content: userMsg });

      const aiText = await callAI(history, systemPrompt);

      // Parse score from response
      const scoreMatch  = aiText.match(/SCORE:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
      const feedbackMatch = aiText.match(/FEEDBACK:\s*(.+?)(?:\n|SCORE:)/is);
      const nextMatch   = aiText.match(/NEXT:\s*(.+?)$/is);

      const score    = scoreMatch    ? parseFloat(scoreMatch[1])    : null;
      const feedback = feedbackMatch ? feedbackMatch[1].trim()      : null;
      const nextQ    = nextMatch     ? nextMatch[1].trim()          : null;

      // Clean display text — show full response naturally
      const displayText = nextQ
        ? `${feedback ? feedback + "\n\n" : ""}${nextQ}`
        : aiText.replace(/FEEDBACK:.*?\n/is, "").replace(/SCORE:.*?\n/i, "").replace(/NEXT:/i, "").trim();

      if (score !== null) {
        setScores(prev => [...prev, score]);
        setPendingScore({ score, feedback });
      }

      setMessages(prev => [
        ...prev.slice(0, -1),
        { ...prev[prev.length - 1], score: score || undefined, feedback: feedback?.substring(0, 60) },
        { role: "assistant", content: displayText },
      ]);
      setQuestionCount(q => q + 1);
    } catch (err) {
      toast.error("AI response failed. Check your connection.");
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting. Please try sending your response again." }]);
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

      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="glass-strong border-b border-[rgba(155,93,229,0.1)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant={config.mode === "technical" ? "cyan" : config.mode === "behavioral" ? "primary" : "success"} className="capitalize">
              {config.mode}
            </Badge>
            <Badge variant="default">{config.difficulty}</Badge>
            <span className="text-xs text-gray-500">{config.role}</span>
          </div>
          <div className="flex items-center gap-5">
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
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-neon-purple"
                      animate={{ scale: [1,1.4,1] }} transition={{ delay: i*0.15, repeat: Infinity, duration: 0.9 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="glass-strong border-t border-[rgba(155,93,229,0.1)] px-6 py-4">
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
          <p className="text-xs text-gray-700 mt-2 text-center">AI adapts questions based on your answers · {questionCount} question{questionCount !== 1 ? "s" : ""} so far</p>
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
          <p className="text-gray-400">Here's how you performed</p>
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
  const [phase,   setPhase]   = useState("setup"); // setup | session | results
  const [config,  setConfig]  = useState(null);
  const [results, setResults] = useState(null);

  const handleStart = (cfg) => { setConfig(cfg); setPhase("session"); };
  const handleEnd   = (res) => { setResults(res); setPhase("results"); };
  const handleRestart = () => { setConfig(null); setResults(null); setPhase("setup"); };

  if (phase === "setup")   return <SetupScreen onStart={handleStart} />;
  if (phase === "session") return <InterviewSession config={config} onEnd={handleEnd} />;
  if (phase === "results") return <ResultsScreen session={results} onRestart={handleRestart} />;
  return null;
};
