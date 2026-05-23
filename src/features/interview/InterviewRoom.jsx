import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Button, Badge, Spinner } from "../../components/ui";
import {
  Mic, MicOff, Send, StopCircle, RotateCcw, CheckCircle,
  AlertTriangle, Clock, Brain, MessageSquare, Code2, Users,
  TrendingUp, ChevronRight, Star, Volume2
} from "lucide-react";
import toast from "react-hot-toast";

/* ─── Constants ────────────────────────────────────────────────────── */
const MODES = [
  { id: "technical",   label: "Technical",   icon: Code2,         color: "from-blue-500 to-cyan-500",    desc: "DSA, system design, coding problems" },
  { id: "behavioral",  label: "Behavioral",  icon: Users,         color: "from-purple-500 to-pink-500",  desc: "STAR method, teamwork, leadership" },
  { id: "hr",          label: "HR Round",    icon: MessageSquare, color: "from-green-500 to-emerald-500", desc: "Salary, culture fit, career goals" },
];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DURATION_OPTIONS = [5, 10, 15, 20]; // minutes

const OPENING_QUESTIONS = {
  technical: [
    "Tell me about yourself and your technical background.",
    "What's a challenging technical problem you've solved recently?",
    "Explain the difference between SQL and NoSQL databases.",
    "What is the time complexity of quicksort and when would you use it?",
    "Describe the concept of RESTful APIs.",
  ],
  behavioral: [
    "Tell me about a time you faced a difficult challenge at work.",
    "Describe a situation where you had to work under tight deadlines.",
    "Tell me about a time you disagreed with your manager.",
    "Describe a project you're most proud of.",
    "Give an example of when you showed leadership.",
  ],
  hr: [
    "Tell me about yourself.",
    "Why do you want to work at our company?",
    "Where do you see yourself in 5 years?",
    "What are your salary expectations?",
    "Why are you leaving your current job?",
  ],
};

const STORAGE_KEY = "prepai_interview_history";

const saveHistory = (session) => {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    history.unshift({ ...session, savedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
  } catch {}
};

const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};

/* ─── AI call ───────────────────────────────────────────────────────── */
const callClaude = async (messages, systemPrompt) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
};

const parseJSON = (text) => {
  try {
    const m = text.match(/```json\s*([\s\S]*?)```/) || [null, text];
    return JSON.parse(m[1] || text);
  } catch { return null; }
};

/* ─── Setup Screen ──────────────────────────────────────────────────── */
const SetupScreen = ({ onStart }) => {
  const [mode, setMode] = useState("behavioral");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState(10);
  const [role, setRole] = useState("Software Engineer");

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">AI Interview</h1>
              <p className="text-gray-500 dark:text-gray-400">Configure your mock interview session</p>
            </div>

            {/* Mode selection */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Interview Mode</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        mode === m.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-800"
                      }`}
                    >
                      <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${m.color} mb-3`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{m.label}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Target Role</h2>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer, Data Scientist..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Difficulty + Duration */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Difficulty</h2>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                        difficulty === d
                          ? d === "Easy" ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : d === "Medium" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                            : "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Duration</h2>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                        duration === d
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800"
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onStart({ mode, difficulty, duration, role })}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-lg hover:from-purple-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <Brain className="w-6 h-6" />
              Start Interview
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ─── Analysis Screen ───────────────────────────────────────────────── */
const AnalysisScreen = ({ session, onNew }) => {
  const navigate = useNavigate();
  const scores = session.scores || [];
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const getColor = (s) => s >= 8 ? "text-green-500" : s >= 6 ? "text-yellow-500" : "text-red-500";
  const getBg = (s) => s >= 8 ? "bg-green-500" : s >= 6 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 text-white text-4xl font-bold mb-4 shadow-xl">
                {avg}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Interview Complete!</h1>
              <p className="text-gray-500 dark:text-gray-400">
                {session.mode} • {session.difficulty} • {session.role}
              </p>
            </div>

            {/* Score breakdown */}
            {session.transcript?.length > 0 && (
              <Card className="mb-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" /> Question Scores
                </h2>
                <div className="space-y-3">
                  {session.transcript.filter(m => m.role === "assistant" && m.score).map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-6">{i + 1}</span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getBg(m.score)}`}
                          style={{ width: `${m.score * 10}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold w-8 ${getColor(m.score)}`}>{m.score}/10</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AI Analysis */}
            {session.analysis && (
              <div className="space-y-4 mb-6">
                {session.analysis.strengths?.length > 0 && (
                  <Card>
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" /> Strengths
                    </h2>
                    <ul className="space-y-2">
                      {session.analysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {session.analysis.improvements?.length > 0 && (
                  <Card>
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" /> Areas to Improve
                    </h2>
                    <ul className="space-y-2">
                      {session.analysis.improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="gradient" className="flex-1" onClick={onNew}>
                <RotateCcw className="w-4 h-4 mr-2" /> New Interview
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ─── Main InterviewRoom ────────────────────────────────────────────── */
export const InterviewRoom = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("setup"); // setup | interview | analysis
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [timer, setTimer] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [history, setHistory] = useState(getHistory);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const sessionRef = useRef({ transcript: [], scores: [] });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Timer
  useEffect(() => {
    if (phase === "interview") {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Auto-end by duration
  useEffect(() => {
    if (config && timer >= config.duration * 60 && phase === "interview") {
      handleEndInterview();
    }
  }, [timer, config, phase]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Speech recognition ─────────────────────────────────────────── */
  const setupSpeech = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += t + " ") : (interim += t);
      }
      setInterimText(interim);
      if (final) { setUserInput((p) => p + final); setInterimText(""); }
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
  }, []);

  useEffect(() => { setupSpeech(); return () => recognitionRef.current?.abort(); }, [setupSpeech]);

  const toggleRecording = () => {
    if (!recognitionRef.current) { toast.error("Speech recognition not supported"); return; }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setUserInput("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  /* ── Start interview ────────────────────────────────────────────── */
  const handleStart = useCallback(async (cfg) => {
    setConfig(cfg);
    setPhase("interview");
    setTimer(0);
    setMessages([]);
    sessionRef.current = { transcript: [], scores: [], mode: cfg.mode, difficulty: cfg.difficulty, role: cfg.role };

    setIsLoading(true);
    try {
      const pool = OPENING_QUESTIONS[cfg.mode] || OPENING_QUESTIONS.behavioral;
      const q = pool[Math.floor(Math.random() * pool.length)];

      let aiQ = q;
      try {
        const prompt = `You are an expert interviewer conducting a ${cfg.mode} interview for a ${cfg.role} role (${cfg.difficulty} difficulty). Start the interview with a welcoming message and ask: "${q}". Keep it to 3 sentences max.`;
        aiQ = await callClaude([{ role: "user", content: "Start the interview." }], prompt);
      } catch {}

      const msg = { role: "assistant", content: aiQ, timestamp: new Date().toISOString() };
      setMessages([msg]);
      sessionRef.current.transcript.push(msg);
    } catch (err) {
      toast.error("Failed to start interview");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ── Send answer ────────────────────────────────────────────────── */
  const handleSend = useCallback(async () => {
    if (!userInput.trim() || isLoading) return;
    const answer = userInput.trim();
    setUserInput("");
    setInterimText("");
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); }

    const userMsg = { role: "user", content: answer, timestamp: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    sessionRef.current.transcript.push(userMsg);

    setIsLoading(true);
    try {
      const history = sessionRef.current.transcript.map((m) => ({
        role: m.role, content: m.content,
      }));

      const systemPrompt = `You are an expert ${config.mode} interviewer for a ${config.role} role (${config.difficulty} difficulty). 
After each user answer:
1. Briefly acknowledge their answer (1 sentence)
2. Give a score out of 10 and short feedback
3. Ask the next relevant question

Format your response as JSON:
{"acknowledgment":"...","score":8,"feedback":"...","nextQuestion":"..."}`;

      let raw = "";
      try {
        raw = await callClaude(history, systemPrompt);
      } catch {}

      const parsed = parseJSON(raw);
      let content, score;

      if (parsed) {
        content = `${parsed.acknowledgment}\n\n📊 Score: ${parsed.score}/10 — ${parsed.feedback}\n\n${parsed.nextQuestion}`;
        score = parsed.score;
      } else {
        // Fallback
        const fallbacks = {
          technical: "Good answer! Let me ask you about time complexity — what's the Big-O of binary search and why?",
          behavioral: "Great example! Now tell me about a time you had to learn something new very quickly.",
          hr: "That's helpful to know. What motivates you most in your work?",
        };
        content = raw || fallbacks[config.mode];
      }

      const aiMsg = { role: "assistant", content, score, timestamp: new Date().toISOString() };
      setMessages((p) => [...p, aiMsg]);
      sessionRef.current.transcript.push(aiMsg);
      if (score) sessionRef.current.scores.push(score);
    } catch {
      toast.error("Failed to get response");
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, isRecording, config]);

  /* ── End interview ──────────────────────────────────────────────── */
  const handleEndInterview = useCallback(async () => {
    clearInterval(timerRef.current);
    setIsLoading(true);

    try {
      const transcript = sessionRef.current.transcript;
      let analysis = null;

      try {
        const raw = await callClaude(
          [{ role: "user", content: `Analyze this interview transcript and provide feedback. Transcript: ${JSON.stringify(transcript)}` }],
          `You are an expert interviewer. Analyze the transcript and respond ONLY as JSON:
{"strengths":["..."],"improvements":["..."],"overallFeedback":"..."}`
        );
        analysis = parseJSON(raw);
      } catch {}

      const session = {
        ...sessionRef.current,
        analysis,
        duration: timer,
        completedAt: new Date().toISOString(),
      };
      saveHistory(session);
      setHistory(getHistory());
      setSessionData(session);
      setPhase("analysis");
    } catch {
      setPhase("analysis");
    } finally {
      setIsLoading(false);
    }
  }, [timer]);

  /* ── Render phases ──────────────────────────────────────────────── */
  if (phase === "setup") {
    return (
      <SetupScreen
        onStart={handleStart}
        history={history}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
      />
    );
  }

  if (phase === "analysis") {
    return (
      <AnalysisScreen
        session={sessionData || sessionRef.current}
        onNew={() => { setPhase("setup"); setMessages([]); setTimer(0); }}
      />
    );
  }

  /* ── Interview phase UI ─────────────────────────────────────────── */
  const timeLeft = config ? config.duration * 60 - timer : 0;
  const progress = config ? (timer / (config.duration * 60)) * 100 : 0;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64 overflow-hidden">
        <Header />

        {/* Interview header bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold text-gray-900 dark:text-white capitalize">{config?.mode} Interview</span>
            <Badge variant={config?.difficulty === "Easy" ? "success" : config?.difficulty === "Medium" ? "warning" : "danger"}>
              {config?.difficulty}
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">{config?.role}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-sm font-mono font-bold ${timeLeft < 60 ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft > 0 ? timeLeft : 0)}
            </div>
            <Button
              size="sm"
              variant="danger"
              onClick={handleEndInterview}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <StopCircle className="w-4 h-4" /> End
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-cyan-600 transition-all duration-1000"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-lg rounded-2xl px-5 py-3 ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.role === "user" ? "text-purple-200" : "text-gray-400"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center mr-3">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((n) => (
                    <div key={n} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${n * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {interimText && (
            <p className="text-sm text-purple-500 dark:text-purple-400 mb-2 italic">
              🎤 {interimText}...
            </p>
          )}
          <div className="flex items-end gap-3">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Type your answer (Enter to send, Shift+Enter for new line)..."
              disabled={isLoading}
              rows={3}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleRecording}
                disabled={isLoading}
                className={`p-3 rounded-xl transition-all ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
                title={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !userInput.trim()}
                className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <Spinner size="sm" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {messages.filter(m => m.role === "user").length} responses · {formatTime(timer)} elapsed
          </p>
        </div>
      </div>
    </div>
  );
};
