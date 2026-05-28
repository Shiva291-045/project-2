import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageWrapper } from "../../components/PageWrapper";
import { Card, Badge, Button } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/apiClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp, Target, Flame, Brain, Award, Clock, Code2,
  FileText, MessageSquare, ChevronRight, Crown, Zap, Star,
  BarChart3, Users, Sparkles, ArrowUpRight,
} from "lucide-react";

const INTERVIEW_HISTORY_KEY = "prepai_interview_history";
const SOLVED_KEY            = "prepai_solved_problems";
const getInterviewHistory   = () => { try { return JSON.parse(localStorage.getItem(INTERVIEW_HISTORY_KEY) || "[]"); } catch { return []; } };
const getSolvedCount        = () => { try { return JSON.parse(localStorage.getItem(SOLVED_KEY) || "[]").length; } catch { return 0; } };

const QUICK_ACTIONS = [
  { label: "AI Interview",     icon: Brain,     href: "/interview",   gradient: "from-brand-500 to-neon-blue", glow: "rgba(123,47,247,0.4)", desc: "Start mock session" },
  { label: "Coding Practice",  icon: Code2,     href: "/coding",      gradient: "from-neon-blue to-neon-cyan", glow: "rgba(0,245,212,0.3)", desc: "450 DSA problems" },
  { label: "Resume Analyzer",  icon: FileText,  href: "/resume",      gradient: "from-neon-pink to-brand-500", glow: "rgba(241,91,181,0.3)", desc: "ATS score & tips" },
  { label: "Analytics",        icon: TrendingUp, href: "/analytics",  gradient: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.3)", desc: "Track progress" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 border border-[rgba(155,93,229,0.2)] shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-display font-bold text-neon-purple">{payload[0].value}%</p>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.1)] hover:border-[rgba(155,93,229,0.25)] transition-all duration-300 group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
    </div>
    <p className="font-display text-2xl font-bold text-white">{value}</p>
    <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </motion.div>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [solvedCount, setSolvedCount]           = useState(0);
  const [apiStats, setApiStats]                 = useState(null);
  const isPremium = userProfile?.isPremium || false;

  useEffect(() => {
    setInterviewHistory(getInterviewHistory());
    setSolvedCount(getSolvedCount());
    api.get("/api/analytics").then(({ data }) => { if (data?.data) setApiStats(data.data); }).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    if (apiStats) return {
      avgScore:        apiStats.avgScore        || 0,
      totalInterviews: apiStats.totalInterviews || interviewHistory.length,
      solvedProblems:  apiStats.solvedProblems  || solvedCount,
      streak:          apiStats.streak          || Math.min(interviewHistory.length, 7),
      xp:              apiStats.xp              || 0,
    };
    const scores = interviewHistory.flatMap(s => s.scores || []);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;
    return { avgScore: avg, totalInterviews: interviewHistory.length, solvedProblems: solvedCount, streak: Math.min(interviewHistory.length, 7), xp: 0 };
  }, [interviewHistory, solvedCount, apiStats]);

  const scoreData = useMemo(() => interviewHistory.slice(0, 7).reverse().map(s => {
    const scores = s.scores || [];
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;
    return { day: new Date(s.completedAt || Date.now()).toLocaleDateString("en", { weekday: "short" }), score: avg };
  }), [interviewHistory]);

  const displayName = userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statCards = [
    { icon: Target,     label: "Avg Interview Score", value: stats.avgScore ? `${stats.avgScore}%` : "—",   color: "from-brand-500 to-neon-blue",  sub: "Across all sessions" },
    { icon: Brain,      label: "Interviews Completed", value: stats.totalInterviews,                         color: "from-neon-blue to-neon-cyan",  sub: "Mock sessions done" },
    { icon: Code2,      label: "Problems Solved",      value: stats.solvedProblems,                          color: "from-neon-cyan to-neon-pink",  sub: "Out of 450 total" },
    { icon: Flame,      label: "Day Streak",           value: `${stats.streak}🔥`,                           color: "from-amber-500 to-orange-500", sub: "Keep it going!" },
  ];

  return (
    <PageWrapper>
      {/* Header row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <p className="text-gray-500 text-sm">{greeting},</p>
          <h1 className="font-display text-3xl font-extrabold text-white mt-0.5">
            {displayName} <span className="wave">👋</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {stats.totalInterviews === 0 ? "Ready to start your prep journey?" : `You've completed ${stats.totalInterviews} interview${stats.totalInterviews !== 1 ? "s" : ""}. Keep it up!`}
          </p>
        </div>
        {!isPremium && (
          <Link to="/pricing">
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-yellow-500/10 border border-amber-400/30 hover:border-amber-400/60 transition-all duration-200 cursor-pointer"
            >
              <Crown className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Go Premium</p>
                <p className="text-xs text-amber-600">Unlock unlimited AI sessions</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </motion.div>
          </Link>
        )}
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.08} />)}
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="font-display text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div
              key={action.label}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.href)}
              className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.1)] hover:border-[rgba(155,93,229,0.3)] cursor-pointer transition-all duration-200 group"
              style={{ '--glow': action.glow }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-white text-sm">{action.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Score chart + Recent history */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 glass rounded-2xl p-6 border border-[rgba(155,93,229,0.1)]"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-white">Score Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 interview sessions</p>
            </div>
            <Badge variant="primary"><TrendingUp className="w-3 h-3" /> Progress</Badge>
          </div>
          {scoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={scoreData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7b2ff7" />
                    <stop offset="100%" stopColor="#4ea8de" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(155,93,229,0.08)" />
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="url(#scoreGrad)" strokeWidth={2.5} dot={{ fill: "#7b2ff7", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "#9b5de5" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-center">
              <BarChart3 className="w-10 h-10 text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">Complete your first interview to see trends</p>
              <Button variant="neon" size="sm" className="mt-4" onClick={() => navigate("/interview")}>
                <Brain className="w-4 h-4" /> Start Interview
              </Button>
            </div>
          )}
        </motion.div>

        {/* Recent interviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="lg:col-span-2 glass rounded-2xl p-6 border border-[rgba(155,93,229,0.1)]"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-white">Recent Sessions</h3>
            <Link to="/analytics" className="text-xs text-neon-purple hover:text-brand-300 transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {interviewHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageSquare className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">No sessions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviewHistory.slice(0, 5).map((s, i) => {
                const scores = s.scores || [];
                const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.06)] hover:border-[rgba(155,93,229,0.15)] transition-all duration-200">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.mode === "technical" ? "bg-blue-500/20" : s.mode === "behavioral" ? "bg-purple-500/20" : "bg-green-500/20"}`}>
                      <Brain className={`w-4 h-4 ${s.mode === "technical" ? "text-blue-400" : s.mode === "behavioral" ? "text-purple-400" : "text-green-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-300 capitalize truncate">{s.mode || "Interview"}</p>
                      <p className="text-xs text-gray-600">{new Date(s.completedAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div className={`text-sm font-bold ${avg >= 70 ? "text-neon-cyan" : avg >= 50 ? "text-amber-400" : "text-red-400"}`}>
                      {avg}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
};
