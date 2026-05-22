import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, Send, Mic, MicOff, RotateCcw, ChevronRight,
  Brain, Star, Clock, Zap, CheckCircle, AlertCircle, ChevronDown,
} from "lucide-react";
import { conductInterviewTurn, evaluateAnswer } from "../services/aiService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const MODES = [
  { id:"Technical",    label:"Technical",    desc:"Algorithms, System Design, CS fundamentals", color:"#7c3aed", icon:"💻" },
  { id:"HR",           label:"HR",           desc:"Behavioral, situational, culture fit",        color:"#10b981", icon:"🤝" },
  { id:"System Design",label:"System Design",desc:"Architecture, scalability, databases",        color:"#06b6d4", icon:"🏗️" },
  { id:"Rapid Fire",   label:"Rapid Fire",   desc:"Quick-fire short answer round",              color:"#f59e0b", icon:"⚡" },
];

const OPENING_MESSAGES = {
  Technical:    "Hello! I'm your technical interviewer today. Let's start with a classic — **Can you explain the difference between a stack and a queue, and give a real-world use case for each?**",
  HR:           "Hi there! Welcome to your HR round. Let's begin — **Tell me about yourself and what motivated you to pursue a career in software engineering.**",
  "System Design":"Good to meet you! Let's dive into system design. **How would you design a URL shortener like bit.ly? Walk me through your approach.**",
  "Rapid Fire": "⚡ Rapid Fire round! Quick short answers. Ready? Go! **What is the time complexity of binary search?**",
};

const FeedbackCard = ({ feedback, onClose }) => {
  if (!feedback) return null;
  const colors = { Excellent:"#10b981", Good:"#06b6d4", Average:"#f59e0b", "Needs Work":"#ef4444" };
  const c = colors[feedback.verdict] || "#7c3aed";
  return (
    <div className="rounded-2xl p-5 anim-scale-in" style={{ background:"var(--bg-elevated)", border:`1px solid ${c}30` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background:`${c}15`, border:`1px solid ${c}30` }}>
            <Brain size={18} style={{ color:c }} />
          </div>
          <div>
            <p className="font-bold text-white text-[14px]">AI Feedback</p>
            <p className="text-[12px]" style={{ color:c }}>{feedback.verdict}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[28px] font-extrabold" style={{ color:c }}>{feedback.score}</p>
          <p className="text-[10px]" style={{ color:"var(--text-muted)" }}>/ 100</p>
        </div>
      </div>

      {/* Score bars */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[["Clarity",feedback.clarity,"#7c3aed"],["Accuracy",feedback.accuracy,"#06b6d4"],["Communication",feedback.communication,"#10b981"]].map(([l,v,cl])=>(
          <div key={l}>
            <div className="flex justify-between text-[11px] mb-1">
              <span style={{ color:"var(--text-muted)" }}>{l}</span>
              <span style={{ color:cl }}>{v}%</span>
            </div>
            <div className="progress-track">
              <div style={{ width:`${v}%`, height:"6px", borderRadius:"99px", background:cl }} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[13px] mb-3" style={{ color:"var(--text-secondary)" }}>{feedback.summary}</p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] font-bold mb-2" style={{ color:"#10b981" }}>✅ STRENGTHS</p>
          {feedback.strengths?.map((s,i) => (
            <p key={i} className="text-[12px] mb-1 flex gap-2" style={{ color:"var(--text-secondary)" }}>
              <CheckCircle size={12} style={{ color:"#10b981", flexShrink:0, marginTop:2 }} />{s}
            </p>
          ))}
        </div>
        <div>
          <p className="text-[11px] font-bold mb-2" style={{ color:"#f59e0b" }}>💡 IMPROVE</p>
          {feedback.improvements?.map((s,i) => (
            <p key={i} className="text-[12px] mb-1 flex gap-2" style={{ color:"var(--text-secondary)" }}>
              <AlertCircle size={12} style={{ color:"#f59e0b", flexShrink:0, marginTop:2 }} />{s}
            </p>
          ))}
        </div>
      </div>
      <button onClick={onClose} className="btn-secondary w-full justify-center mt-4 text-[13px] py-2">
        Continue Interview
      </button>
    </div>
  );
};

export default function InterviewRoom() {
  const { user } = useAuth();
  const [mode, setMode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [listening, setListening] = useState(false);
  const [totalScore, setTotalScore] = useState(null);
  const [scores, setScores] = useState([]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, feedback, loading]);

  // Timer
  useEffect(() => {
    if (mode) { timerRef.current = setInterval(() => setElapsed(e => e+1), 1000); }
    return () => clearInterval(timerRef.current);
  }, [mode]);

  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const startInterview = (m) => {
    setMode(m);
    setMessages([{ role:"assistant", content:OPENING_MESSAGES[m.id], timestamp:new Date() }]);
    setLastQuestion(OPENING_MESSAGES[m.id]);
    setElapsed(0); setScores([]);
    toast.success(`${m.label} interview started!`);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");

    const newMessages = [...messages, { role:"user", content:userMsg, timestamp:new Date() }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Evaluate the answer
      setEvaluating(true);
      const evalResult = await evaluateAnswer(lastQuestion, userMsg, mode.id);
      setScores(s => [...s, evalResult.score]);
      setFeedback(evalResult);
      setEvaluating(false);

      // Get next question from AI
      const aiHistory = newMessages.map(m => ({ role:m.role, content:m.content }));
      const aiReply = await conductInterviewTurn(aiHistory, mode.id, userMsg);
      setLastQuestion(aiReply);
      setMessages(m => [...m, { role:"assistant", content:aiReply, timestamp:new Date() }]);
    } catch (err) {
      toast.error("AI response failed. Check your API connection.");
      setMessages(m => [...m, { role:"assistant", content:"Sorry, I had a connection issue. Please try again.", timestamp:new Date() }]);
    } finally {
      setLoading(false); setEvaluating(false);
    }
  }, [input, messages, mode, loading, lastQuestion]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const endInterview = () => {
    if (scores.length === 0) { setMode(null); return; }
    const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
    setTotalScore(avg);
    toast.success(`Interview complete! Average score: ${avg}%`);
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return toast.error("Voice recognition not supported in this browser");
    }
    if (listening) {
      recognitionRef.current?.stop(); setListening(false); return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r=>r[0].transcript).join("");
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { toast.error("Voice error"); setListening(false); };
    recognitionRef.current = rec;
    rec.start(); setListening(true);
  };

  // ─── Mode selection ───
  if (!mode && !totalScore) return (
    <div className="max-w-3xl mx-auto space-y-6 anim-fade-up">
      <div>
        <h1 className="text-[24px] font-extrabold text-white mb-1">Interview Room</h1>
        <p className="text-[14px]" style={{ color:"var(--text-secondary)" }}>
          Select your interview mode to begin
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {MODES.map(m => (
          <button key={m.id} onClick={()=>startInterview(m)}
            className="card p-6 text-left group hover:scale-[1.01] transition-transform">
            <div className="flex items-start gap-4 mb-3">
              <div className="text-3xl">{m.icon}</div>
              <div>
                <h3 className="text-[16px] font-bold text-white">{m.label}</h3>
                <p className="text-[13px] mt-0.5" style={{ color:"var(--text-secondary)" }}>{m.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[13px] font-semibold mt-2" style={{ color:m.color }}>
              Start Interview <ChevronRight size={14}/>
            </div>
          </button>
        ))}
      </div>

      {/* Tips */}
      <div className="card p-5">
        <h3 className="text-[14px] font-bold text-white mb-3">💡 Tips for best results</h3>
        <div className="grid sm:grid-cols-2 gap-2 text-[13px]" style={{ color:"var(--text-secondary)" }}>
          {["Speak clearly and in full sentences","Use the STAR method for behavioral questions",
            "Take a moment to think before answering","Ask clarifying questions when needed"].map(t=>(
            <p key={t} className="flex gap-2"><CheckCircle size={14} style={{ color:"#10b981", flexShrink:0, marginTop:2 }}/>{t}</p>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Score summary ───
  if (totalScore) return (
    <div className="max-w-xl mx-auto text-center space-y-6 anim-fade-up pt-8">
      <div className="card p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-[26px] font-extrabold text-white mb-2">Interview Complete!</h2>
        <p className="text-[14px] mb-6" style={{ color:"var(--text-secondary)" }}>
          {mode.label} Interview · {formatTime(elapsed)} · {scores.length} questions answered
        </p>
        <div className="w-36 h-36 mx-auto mb-6">
          <svg viewBox="0 0 100 100" width="144" height="144">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none"
              stroke={totalScore>=80?"#10b981":totalScore>=65?"#f59e0b":"#ef4444"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2*Math.PI*44}`}
              strokeDashoffset={`${2*Math.PI*44*(1-totalScore/100)}`}
              transform="rotate(-90 50 50)"
              style={{ transition:"stroke-dashoffset 1.5s ease" }} />
            <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize:"22px", fontWeight:800, fill:"white", fontFamily:"'Plus Jakarta Sans'" }}>
              {totalScore}%
            </text>
            <text x="50" y="62" textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize:"10px", fill:"var(--text-muted)", fontFamily:"'Plus Jakarta Sans'" }}>
              Avg Score
            </text>
          </svg>
        </div>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary gap-2" onClick={()=>{setMode(null);setTotalScore(null);setMessages([]);setScores([]);}}>
            <RotateCcw size={14}/> Try Again
          </button>
          <button className="btn-secondary" onClick={()=>window.location.href="/analytics"}>
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Interview chat ───
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background:`${mode.color}15`, border:`1px solid ${mode.color}25` }}>
            {mode.icon}
          </div>
          <div>
            <h2 className="font-bold text-white text-[15px]">{mode.label} Interview</h2>
            <div className="flex items-center gap-3 text-[12px]" style={{ color:"var(--text-muted)" }}>
              <span className="flex items-center gap-1"><Clock size={11}/> {formatTime(elapsed)}</span>
              <span>{scores.length} answered</span>
              {scores.length>0 && <span style={{ color:"#10b981" }}>Avg: {Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)}%</span>}
            </div>
          </div>
        </div>
        <button onClick={endInterview} className="btn-secondary text-[13px] py-2 px-4">
          End Interview
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
            {msg.role==="assistant" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-1"
                style={{ background:"linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
                <Brain size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[78%] p-4 ${msg.role==="assistant"?"bubble-ai":"bubble-user"}`}>
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color:"var(--text-primary)" }}>
                {msg.content}
              </p>
              <p className="text-[10px] mt-2" style={{ color:"var(--text-muted)" }}>
                {msg.timestamp?.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && !evaluating && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
              style={{ background:"linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
              <Brain size={14} className="text-white" />
            </div>
            <div className="bubble-ai p-4 flex items-center gap-1">
              <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
            </div>
          </div>
        )}

        {/* Feedback card */}
        {feedback && !loading && (
          <FeedbackCard feedback={feedback} onClose={()=>setFeedback(null)} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <div className="flex gap-3 p-4 rounded-2xl" style={{ background:"var(--bg-card)", border:"1px solid var(--border-light)" }}>
          <textarea ref={textareaRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
            rows={2} disabled={loading}
            className="flex-1 bg-transparent outline-none resize-none text-[14px] leading-relaxed"
            style={{ color:"var(--text-primary)", fontFamily:"'Plus Jakarta Sans'" }} />
          <div className="flex flex-col gap-2 justify-end">
            <button onClick={toggleVoice}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: listening ? "rgba(239,68,68,0.15)" : "var(--bg-elevated)",
                border: listening ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border-light)",
                color: listening ? "#ef4444" : "var(--text-muted)" }}>
              {listening ? <MicOff size={15}/> : <Mic size={15}/>}
            </button>
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: input.trim()&&!loading ? "linear-gradient(135deg,#7c3aed,#5b21b6)" : "var(--bg-elevated)",
                color: input.trim()&&!loading ? "white" : "var(--text-muted)",
                border: "1px solid var(--border-light)", opacity: loading ? 0.5 : 1 }}>
              <Send size={14}/>
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] mt-2" style={{ color:"var(--text-muted)" }}>
          🎙️ Press mic for voice input · Powered by Claude AI
        </p>
      </div>
    </div>
  );
}