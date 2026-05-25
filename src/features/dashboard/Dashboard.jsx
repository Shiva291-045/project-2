import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Container, Badge, Button } from "../../components/ui";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/apiClient";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Target, Flame, BookOpen, Brain, Award,
  Clock, Code2, FileText, MessageSquare, ChevronRight,
  CheckCircle, Calendar, Zap,
} from "lucide-react";

const INTERVIEW_HISTORY_KEY = "prepai_interview_history";
const SOLVED_KEY = "prepai_solved_problems";

const getInterviewHistory = () => {
  try { return JSON.parse(localStorage.getItem(INTERVIEW_HISTORY_KEY) || "[]"); } catch { return []; }
};
const getSolvedCount = () => {
  try { return JSON.parse(localStorage.getItem(SOLVED_KEY) || "[]").length; } catch { return 0; }
};

const QUICK_ACTIONS = [
  { label: "Start Interview", icon: Brain, href: "/interview", color: "from-purple-600 to-cyan-600", desc: "AI mock interview" },
  { label: "Coding Practice", icon: Code2, href: "/coding",    color: "from-blue-600 to-indigo-600", desc: "450 DSA problems" },
  { label: "Resume Analyzer", icon: FileText, href: "/resume", color: "from-green-600 to-emerald-600", desc: "ATS score & tips" },
  { label: "Analytics",       icon: TrendingUp, href: "/analytics", color: "from-orange-600 to-red-600", desc: "Track progress" },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [solvedCount, setSolvedCount] = useState(0);
  const [apiStats, setApiStats] = useState(null);

  useEffect(() => {
    // Always load from localStorage immediately for instant UI
    setInterviewHistory(getInterviewHistory());
    setSolvedCount(getSolvedCount());
    // Then try to enrich with server-side analytics
    api.get("/api/analytics")
      .then(({ data }) => { if (data?.data) setApiStats(data.data); })
      .catch(() => {}); // silent fallback to localStorage data
  }, []);

  const stats = useMemo(() => {
    // Prefer real server-side stats when available
    if (apiStats) {
      return {
        avgScore:        apiStats.avgScore        || 0,
        totalInterviews: apiStats.totalInterviews || interviewHistory.length,
        solvedProblems:  apiStats.solvedProblems  || solvedCount,
        streak:          apiStats.streak          || Math.min(interviewHistory.length, 7),
        xp:              apiStats.xp              || 0,
      };
    }
    const scores = interviewHistory.flatMap((s) => s.scores || []);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;
    return {
      avgScore: avg,
      totalInterviews: interviewHistory.length,
      solvedProblems: solvedCount,
      streak: Math.min(interviewHistory.length, 7),
      xp: 0,
    };
  }, [interviewHistory, solvedCount, apiStats]);

  // Build score trend from history
  const scoreData = useMemo(() => {
    return interviewHistory.slice(0, 7).reverse().map((s, i) => {
      const scores = s.scores || [];
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;
      return {
        day: new Date(s.completedAt || Date.now()).toLocaleDateString("en", { weekday: "short" }),
        score: avg,
      };
    });
  }, [interviewHistory]);

  // Mode distribution
  const modeData = useMemo(() => {
    const counts = {};
    interviewHistory.forEach((s) => { counts[s.mode] = (counts[s.mode] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [interviewHistory]);

  const STAT_CARDS = [
    { label: "Avg Score", value: stats.avgScore, suffix: "/100", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-500/10" },
    { label: "Interviews", value: stats.totalInterviews, suffix: "", icon: Brain, color: "text-cyan-600", bg: "bg-cyan-500/10" },
    { label: "Problems Solved", value: stats.solvedProblems, suffix: "/448", icon: BookOpen, color: "text-green-600", bg: "bg-green-500/10" },
    { label: "Day Streak", value: stats.streak, suffix: " 🔥", icon: Flame, color: "text-orange-600", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <Container className="py-8">
            {/* Welcome */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome back{userProfile?.name ? `, ${userProfile.name}` : ""}! 👋
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Your AI interview coach is ready. Let's land that dream job.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {STAT_CARDS.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label} className="relative overflow-hidden group hover:scale-[1.02] transition-transform">
                    <div className={`absolute top-0 right-0 w-20 h-20 ${s.bg} rounded-full -translate-y-4 translate-x-4`} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</p>
                        <Icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {s.value}<span className="text-base text-gray-400 font-normal">{s.suffix}</span>
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {QUICK_ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Link
                      key={a.href}
                      to={a.href}
                      className="group relative overflow-hidden rounded-2xl p-5 text-white hover:scale-[1.02] transition-all shadow-md hover:shadow-xl"
                      style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${a.color}`} />
                      <div className="relative">
                        <Icon className="w-8 h-8 mb-3 opacity-90" />
                        <h3 className="font-bold text-base">{a.label}</h3>
                        <p className="text-xs opacity-75 mt-0.5">{a.desc}</p>
                        <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" /> Score Trend
                </h2>
                {scoreData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={scoreData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                      <XAxis dataKey="day" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 8, color: "#fff" }} />
                      <Line type="monotone" dataKey="score" stroke="#9333ea" strokeWidth={2} dot={{ fill: "#9333ea", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Brain className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Complete interviews to see your trend</p>
                    <Link to="/interview" className="text-purple-600 text-sm hover:underline">Start your first interview →</Link>
                  </div>
                )}
              </Card>

              <Card>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-600" /> Interview Modes
                </h2>
                {modeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={modeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 8, color: "#fff" }} />
                      <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <MessageSquare className="w-10 h-10 opacity-30" />
                    <p className="text-sm">No interviews yet</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Recent interviews */}
            {interviewHistory.length > 0 && (
              <Card className="mb-8">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" /> Recent Interviews
                </h2>
                <div className="space-y-3">
                  {interviewHistory.slice(0, 5).map((s, i) => {
                    const scores = s.scores || [];
                    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : "—";
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{s.mode} Interview</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {s.role} · {s.difficulty} · {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${avg >= 70 ? "text-green-500" : avg >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                            {avg}{typeof avg === "number" ? "/100" : ""}
                          </p>
                          <p className="text-xs text-gray-400">{scores.length} questions</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Recommendations */}
            <Card>
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Personalized Tips
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Target, color: "purple", title: "Practice Daily", body: "Even 20 minutes of daily practice improves confidence significantly." },
                  { icon: Code2, color: "blue", title: "DSA Focus", body: "Arrays, Trees, and DP cover 80% of technical interview questions." },
                  { icon: Award, color: "green", title: "ATS Optimization", body: "Use your Resume Analyzer to boost your ATS score above 80%." },
                  { icon: Flame, color: "orange", title: "Mock Interviews", body: "Schedule regular mock interviews to reduce anxiety and improve delivery." },
                ].map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <div key={tip.title} className={`p-4 rounded-xl bg-${tip.color}-50 dark:bg-${tip.color}-900/20 border border-${tip.color}-100 dark:border-${tip.color}-900/40`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 text-${tip.color}-600 mt-0.5`} />
                        <div>
                          <h3 className={`font-semibold text-${tip.color}-900 dark:text-${tip.color}-300 mb-1 text-sm`}>{tip.title}</h3>
                          <p className={`text-xs text-${tip.color}-800 dark:text-${tip.color}-400`}>{tip.body}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Container>
        </main>
      </div>
    </div>
  );
};
