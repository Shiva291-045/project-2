import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { PageWrapper } from "../../components/PageWrapper";
import { Badge } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/apiClient";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Legend,
} from "recharts";
import { TrendingUp, Brain, Code2, Target, Award, Calendar, Zap, BarChart3 } from "lucide-react";

const INTERVIEW_KEY = "prepai_interview_history";
const SOLVED_KEY    = "prepai_solved_problems";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 border border-[rgba(155,93,229,0.2)] shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: {p.value}{p.name.includes("Score") ? "%" : ""}</p>
      ))}
    </div>
  );
};

export const Analytics = () => {
  const { userProfile } = useAuth();
  const [apiStats, setApiStats] = useState(null);
  const [loading, setLoading]   = useState(true);

  const history = useMemo(() => { try { return JSON.parse(localStorage.getItem(INTERVIEW_KEY) || "[]"); } catch (e) { return []; } }, []);
  const solved  = useMemo(() => { try { return JSON.parse(localStorage.getItem(SOLVED_KEY) || "[]").length; } catch (e) { return 0; } }, []);

  useEffect(() => {
    api.get("/api/analytics").then(({ data }) => { if (data?.data) setApiStats(data.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const scoreData = useMemo(() => history.slice(0, 10).reverse().map((s, i) => {
    const sc = s.scores || [];
    const avg = sc.length ? Math.round(sc.reduce((a,b)=>a+b,0)/sc.length*10) : 0;
    return { session: `S${i+1}`, score: avg, mode: s.mode };
  }), [history]);

  const modeData = useMemo(() => {
    const modes = { technical: [], behavioral: [], hr: [] };
    history.forEach(s => {
      const sc = s.scores || [];
      const avg = sc.length ? Math.round(sc.reduce((a,b)=>a+b,0)/sc.length*10) : 0;
      if (modes[s.mode]) modes[s.mode].push(avg);
    });
    return [
      { subject: "Technical",  score: modes.technical.length ? Math.round(modes.technical.reduce((a,b)=>a+b,0)/modes.technical.length) : 0,  fullMark: 100 },
      { subject: "Behavioral", score: modes.behavioral.length ? Math.round(modes.behavioral.reduce((a,b)=>a+b,0)/modes.behavioral.length) : 0, fullMark: 100 },
      { subject: "HR",         score: modes.hr.length ? Math.round(modes.hr.reduce((a,b)=>a+b,0)/modes.hr.length) : 0,                        fullMark: 100 },
    ];
  }, [history]);

  // Trend narration — built ONLY from real per-category scores already
  // stored in interview history (session.report.technicalScore etc., saved
  // since the AI report was extended to include them). Never fabricates a
  // trend when there isn't enough data to support one.
  const trendInsight = useMemo(() => {
    const withReport = history.filter(s => s.report && typeof s.report.technicalScore === "number");
    if (!withReport.length) return null;

    const CATS = [
      { key: "technicalScore",      label: "Technical" },
      { key: "communicationScore",  label: "Communication" },
      { key: "problemSolvingScore", label: "Problem solving" },
    ];
    const avgOf = (arr, key) => {
      const vals = arr.map(s => s.report[key]).filter(v => typeof v === "number");
      return vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : null;
    };

    // Weakest category from the most recent sessions (up to 5)
    const recent = withReport.slice(0, 5);
    const recentAverages = CATS.map(c => ({ ...c, avg: avgOf(recent, c.key) })).filter(c => c.avg != null);
    const weakest = recentAverages.length ? [...recentAverages].sort((a,b) => a.avg - b.avg)[0] : null;

    // Most frequently recommended DSA topic across recent reports
    const topicCounts = {};
    recent.forEach(s => (s.report.recommendedDsaTopics || []).forEach(t => { topicCounts[t] = (topicCounts[t] || 0) + 1; }));
    const topTopic = Object.entries(topicCounts).sort((a,b) => b[1]-a[1])[0]?.[0];

    let trendSentence = "";
    if (withReport.length >= 4) {
      const older = withReport.slice(Math.ceil(withReport.length/2));
      CATS.forEach(c => {
        const recentAvg = avgOf(recent, c.key);
        const olderAvg = avgOf(older, c.key);
        if (recentAvg != null && olderAvg != null) {
          const delta = Math.round(recentAvg - olderAvg);
          if (Math.abs(delta) >= 5 && !trendSentence) {
            trendSentence = `Your ${c.label.toLowerCase()} score has ${delta > 0 ? "improved" : "dropped"} by ${Math.abs(delta)} points over your recent sessions. `;
          }
        }
      });
    }

    const weakestSentence = weakest
      ? `${trendSentence ? "" : "Based on your recent sessions, "}${weakest.label} is currently your weakest area at ${Math.round(weakest.avg)}%.`
      : "";
    const topicSentence = topTopic ? ` The AI has repeatedly flagged ${topTopic} as worth revisiting.` : "";

    return {
      text: (trendSentence + weakestSentence + topicSentence).trim(),
      sessionCount: withReport.length,
    };
  }, [history]);

  const totalSessions = apiStats?.totalInterviews || history.length;
  const avgScore      = apiStats?.avgScore || (scoreData.length ? Math.round(scoreData.reduce((a,s)=>a+s.score,0)/scoreData.length) : 0);
  const xp            = apiStats?.xp || (totalSessions * 50);
  const streak        = apiStats?.streak || Math.min(history.length, 7);

  const summaryStats = [
    { icon: Brain,     label: "Total Sessions",    value: totalSessions,      color: "from-brand-500 to-neon-blue",  sub: "Mock interviews" },
    { icon: Target,    label: "Avg Score",         value: avgScore ? `${avgScore}%` : "—", color: "from-neon-cyan to-green-500", sub: "Overall performance" },
    { icon: Code2,     label: "Problems Solved",   value: solved,             color: "from-neon-pink to-brand-500",  sub: "DSA practice" },
    { icon: Zap,       label: "XP Earned",         value: xp,                 color: "from-amber-500 to-orange-500", sub: "Total points" },
  ];

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1 text-sm">Track your preparation progress over time</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryStats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.08 }}
            className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.1)]">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-display text-2xl font-bold text-white">{s.value}</p>
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Trend narration — real, computed insight, not decoration */}
      {trendInsight?.text && (
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}
          className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.15)] mb-8 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-300 leading-relaxed">{trendInsight.text}</p>
            <p className="text-xs text-gray-600 mt-1">Based on your last {trendInsight.sessionCount} scored interview{trendInsight.sessionCount === 1 ? "" : "s"}</p>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Score trend */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="lg:col-span-2 glass rounded-2xl p-6 border border-[rgba(155,93,229,0.1)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-white">Score Trend</h3>
              <p className="text-xs text-gray-500">Last 10 sessions</p>
            </div>
            <Badge variant="primary"><TrendingUp className="w-3 h-3" /> Progress</Badge>
          </div>
          {scoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={scoreData}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7b2ff7" /><stop offset="100%" stopColor="#4ea8de" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(155,93,229,0.08)" />
                <XAxis dataKey="session" tick={{ fill:"#6b7280", fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fill:"#6b7280", fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" name="Score" stroke="url(#lineGrad)" strokeWidth={2.5}
                  dot={{ fill:"#7b2ff7", r:4, strokeWidth:2 }} activeDot={{ r:6, fill:"#9b5de5" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center">
              <BarChart3 className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">Complete interviews to see your score trend</p>
            </div>
          )}
        </motion.div>

        {/* Radar chart */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
          className="glass rounded-2xl p-6 border border-[rgba(155,93,229,0.1)]">
          <h3 className="font-display font-semibold text-white mb-1">Skill Breakdown</h3>
          <p className="text-xs text-gray-500 mb-4">Performance by interview type</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={modeData}>
              <PolarGrid stroke="rgba(155,93,229,0.15)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:"#9ca3af", fontSize:11 }} />
              <Radar name="Score" dataKey="score" stroke="#7b2ff7" fill="#7b2ff7" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent sessions table */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
        className="glass rounded-2xl p-6 border border-[rgba(155,93,229,0.1)]">
        <h3 className="font-display font-semibold text-white mb-5">Recent Sessions</h3>
        {history.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p>No interview sessions yet. Start one from the Interview page!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-4">Mode</th>
                  <th className="pb-3 pr-4">Difficulty</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Score</th>
                  <th className="pb-3 pr-4">Questions</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(155,93,229,0.06)]">
                {history.slice(0, 10).map((s, i) => {
                  const sc = s.scores || [];
                  const avg = sc.length ? Math.round(sc.reduce((a,b)=>a+b,0)/sc.length*10) : 0;
                  return (
                    <tr key={i} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 pr-4"><span className="capitalize text-gray-300">{s.mode || "—"}</span></td>
                      <td className="py-3 pr-4"><span className="text-gray-400">{s.difficulty || "—"}</span></td>
                      <td className="py-3 pr-4"><span className="text-gray-400 truncate max-w-[120px] block">{s.role || "—"}</span></td>
                      <td className="py-3 pr-4">
                        <span className={`font-semibold ${avg >= 70 ? "text-neon-cyan" : avg >= 50 ? "text-amber-400" : "text-red-400"}`}>{avg}%</span>
                      </td>
                      <td className="py-3 pr-4"><span className="text-gray-400">{s.questionsAnswered || sc.length || "—"}</span></td>
                      <td className="py-3"><span className="text-gray-500">{new Date(s.completedAt || s.savedAt || Date.now()).toLocaleDateString()}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
};
