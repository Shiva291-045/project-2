import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, TrendingUp, MessageSquare, Code2, BookOpen, ArrowRight,
  Flame, Target, Clock, Star, ChevronRight, Zap, Play,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { MOCK_INTERVIEW_HISTORY, MOCK_WEEKLY_DATA, MOCK_TOPIC_PERFORMANCE } from "../services/mockData";

// Animated score ring
const ScoreRing = ({ score, size=80, stroke=7, color="#7c3aed" }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(circ);
  useEffect(() => { setTimeout(() => setDash(circ * (1 - score / 100)), 200); }, [score, circ]);
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
        style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)", transformOrigin:"50% 50%", transform:"rotate(-90deg)" }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fontSize:`${size*0.22}px`, fontWeight:800, fill:"white", fontFamily:"'Plus Jakarta Sans'" }}>
        {score}%
      </text>
    </svg>
  );
};

const typeColor = { Technical:"#7c3aed", HR:"#10b981", Mixed:"#06b6d4", "Rapid Fire":"#f59e0b", "System Design":"#ec4899" };
const typeBg   = { Technical:"rgba(124,58,237,0.12)", HR:"rgba(16,185,129,0.1)", Mixed:"rgba(6,182,212,0.1)", "Rapid Fire":"rgba(245,158,11,0.1)", "System Design":"rgba(236,72,153,0.1)" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-[12px]" style={{ background:"var(--bg-elevated)", border:"1px solid var(--border-light)" }}>
      <p className="font-bold text-white mb-1">{label}</p>
      <p style={{ color:"#a78bfa" }}>Score: {payload[0]?.value}%</p>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const radarData = [
    { topic:"React",     score:88 },{ topic:"JS",       score:82 },
    { topic:"DSA",       score:62 },{ topic:"DBMS",     score:55 },
    { topic:"OS",        score:53 },{ topic:"Networks", score:60 },
  ];

  const QUICK_ACTIONS = [
    { icon:MessageSquare, label:"Start Interview",  desc:"AI mock interview",  path:"/interview",  color:"#7c3aed", bg:"rgba(124,58,237,0.12)" },
    { icon:Code2,         label:"Solve a Problem",  desc:"Coding practice",   path:"/coding",     color:"#06b6d4", bg:"rgba(6,182,212,0.1)"   },
    { icon:BookOpen,      label:"Topic Practice",   desc:"Curated questions", path:"/topics",     color:"#10b981", bg:"rgba(16,185,129,0.1)"  },
    { icon:BarChart3,     label:"View Analytics",   desc:"Track progress",    path:"/analytics",  color:"#f59e0b", bg:"rgba(245,158,11,0.1)"  },
  ];

  const weakTopics  = MOCK_TOPIC_PERFORMANCE.filter(t => t.score < 65).slice(0,3);
  const strongTopics = MOCK_TOPIC_PERFORMANCE.filter(t => t.score >= 75).slice(0,3);

  return (
    <div className="space-y-6 anim-fade-up">
      {/* ─── Welcome ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-white">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-[14px] mt-1" style={{ color:"var(--text-secondary)" }}>
            Ready for today's interview practice?
          </p>
        </div>
        <button className="btn-primary self-start gap-2" onClick={()=>navigate("/interview")}>
          <Play size={14} style={{ fill:"white" }} /> Start Practicing
        </button>
      </div>

      {/* ─── Stat cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Overall Score",    value:`${user?.avgScore||78}%`, sub:"↑ 12% vs last week", color:"#7c3aed", ring:user?.avgScore||78, icon:Target },
          { label:"Interviews Taken", value:user?.interviewCount||32,  sub:"↑ 8 this month",     color:"#06b6d4", icon:MessageSquare },
          { label:"Current Streak",   value:`${user?.streak||7}`,     sub:"days",               color:"#f59e0b", emoji:"🔥", icon:Flame },
          { label:"Total XP",         value:`${user?.xp||2450}`,      sub:`Level ${user?.level||5}`, color:"#10b981", icon:Star },
        ].map((s,i) => (
          <div key={s.label} className={`card p-5 anim-fade-up delay-${(i+1)*100}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[12px] font-medium mb-3" style={{ color:"var(--text-muted)" }}>{s.label}</p>
                <p className="text-[28px] font-extrabold leading-none" style={{ color:s.color }}>
                  {s.value}{s.emoji}
                </p>
                <p className="text-[12px] mt-2" style={{ color:s.color }}>{s.sub}</p>
              </div>
              {s.ring ? (
                <ScoreRing score={s.ring} size={64} stroke={6} color={s.color} />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background:`${s.color}15`, border:`1px solid ${s.color}25` }}>
                  <s.icon size={22} style={{ color:s.color }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main grid ─── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[16px] font-bold text-white">Performance Overview</h2>
              <p className="text-[12px] mt-0.5" style={{ color:"var(--text-muted)" }}>Weekly score trend</p>
            </div>
            <div className="text-[12px] px-3 py-1.5 rounded-lg font-semibold"
              style={{ background:"rgba(124,58,237,0.12)", color:"#a78bfa", border:"1px solid rgba(124,58,237,0.2)" }}>
              This Week
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MOCK_WEEKLY_DATA}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[50,100]} tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="url(#lineGrad)" strokeWidth={2.5}
                dot={{ fill:"#7c3aed", strokeWidth:2, r:4, stroke:"var(--bg-card)" }}
                activeDot={{ r:6, fill:"#a78bfa" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weak areas panel */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-white">Weak Areas</h2>
            <button className="text-[12px] font-semibold flex items-center gap-1" style={{ color:"#a78bfa" }}
              onClick={()=>navigate("/analytics")}>
              View all <ChevronRight size={13}/>
            </button>
          </div>
          <div className="space-y-4">
            {weakTopics.map(t => (
              <div key={t.topic}>
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="font-medium text-white">{t.topic}</span>
                  <span style={{ color: t.score<50 ? "#ef4444" : "#f59e0b" }}>{t.score}%</span>
                </div>
                <div className="progress-track">
                  <div className={t.score<50 ? "progress-fill-red" : "progress-fill"}
                    style={{ width:`${t.score}%`, height:"6px", borderRadius:"99px",
                      background: t.score<50 ? "linear-gradient(90deg,#dc2626,#ef4444)" : "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
                </div>
              </div>
            ))}
          </div>
          <button className="btn-primary w-full justify-center mt-5 text-[13px] py-2.5"
            onClick={()=>navigate("/topics")}>
            Practice Now <ArrowRight size={13}/>
          </button>
        </div>
      </div>

      {/* ─── Quick actions ─── */}
      <div>
        <h2 className="text-[16px] font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(({ icon:Icon, label, desc, path, color, bg }) => (
            <button key={label} onClick={()=>navigate(path)}
              className="card p-5 text-left group hover:scale-[1.01] transition-transform">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{ background:bg, border:`1px solid ${color}20` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <p className="text-[14px] font-bold text-white">{label}</p>
              <p className="text-[12px] mt-1" style={{ color:"var(--text-muted)" }}>{desc}</p>
              <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold" style={{ color }}>
                Start <ArrowRight size={12}/>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Bottom grid: Recent + Radar ─── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent interviews */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-white">Recent Interviews</h2>
            <button className="text-[12px] font-semibold flex items-center gap-1" style={{ color:"#a78bfa" }}
              onClick={()=>navigate("/analytics")}>
              View all <ChevronRight size={13}/>
            </button>
          </div>
          <div className="space-y-3">
            {MOCK_INTERVIEW_HISTORY.slice(0,4).map(iv => (
              <div key={iv.id} className="flex items-center gap-4 p-3.5 rounded-xl transition-colors cursor-pointer"
                style={{ background:"var(--bg-elevated)" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(124,58,237,0.3)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:typeBg[iv.type]||"rgba(124,58,237,0.1)" }}>
                  <MessageSquare size={16} style={{ color:typeColor[iv.type]||"#7c3aed" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-white">{iv.type} Interview</p>
                  <p className="text-[12px] mt-0.5" style={{ color:"var(--text-muted)" }}>
                    {iv.topics.join(" · ")} · {iv.duration}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[16px] font-bold" style={{ color: iv.score>=80?"#10b981":iv.score>=65?"#f59e0b":"#ef4444" }}>
                    {iv.score}%
                  </p>
                  <p className="text-[11px]" style={{ color:"var(--text-muted)" }}>{iv.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic radar */}
        <div className="card p-6">
          <h2 className="text-[16px] font-bold text-white mb-4">Skill Radar</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border-light)" />
              <PolarAngleAxis dataKey="topic" tick={{ fill:"var(--text-muted)", fontSize:11 }} />
              <Radar dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          {/* Strong topics */}
          <div className="mt-2">
            <p className="text-[12px] font-semibold mb-2" style={{ color:"var(--text-muted)" }}>STRONG TOPICS</p>
            <div className="flex flex-wrap gap-2">
              {strongTopics.map(t => (
                <span key={t.topic} className="tag-pill">{t.topic} {t.score}%</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Badges ─── */}
      {user?.badges?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-[16px] font-bold text-white mb-4">🏆 Your Badges</h2>
          <div className="flex flex-wrap gap-3">
            {user.badges.map(b => (
              <div key={b} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold badge-glow"
                style={{ background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.25)", color:"#a78bfa" }}>
                <Zap size={13}/> {b}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}