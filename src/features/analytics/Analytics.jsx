import React, { useState, useMemo } from "react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Container, Badge } from "../../components/ui";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Brain, BookOpen, Clock, Award, Zap } from "lucide-react";

const INTERVIEW_HISTORY_KEY = "prepai_interview_history";
const SOLVED_KEY = "prepai_solved_problems";

const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(INTERVIEW_HISTORY_KEY) || "[]"); } catch { return []; }
};
const getSolvedIds = () => {
  try { return JSON.parse(localStorage.getItem(SOLVED_KEY) || "[]"); } catch { return []; }
};

export const Analytics = () => {
  const history = useMemo(getHistory, []);
  const solvedIds = useMemo(getSolvedIds, []);

  const scores = history.flatMap((s) => s.scores || []);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;
  const bestScore = scores.length ? Math.round(Math.max(...scores) * 10) : 0;

  // Score over time
  const scoreOverTime = history.slice(0, 10).reverse().map((s, i) => {
    const sc = s.scores || [];
    return {
      session: `#${i + 1}`,
      score: sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length * 10) : 0,
      date: s.completedAt ? new Date(s.completedAt).toLocaleDateString("en", { month: "short", day: "numeric" }) : "",
    };
  });

  // Mode breakdown
  const modeCounts = {};
  history.forEach((s) => { modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1; });
  const modeData = Object.entries(modeCounts).map(([name, value]) => ({ name, value }));

  // Difficulty breakdown
  const diffData = (() => {
    const d = { Easy: 0, Medium: 0, Hard: 0 };
    history.forEach((s) => { if (s.difficulty) d[s.difficulty] = (d[s.difficulty] || 0) + 1; });
    return Object.entries(d).map(([name, value]) => ({ name, value }));
  })();

  // Radar data for skill areas
  const radarData = [
    { subject: "Technical", score: history.filter(s => s.mode === "technical").length > 0 ? avgScore : 40 },
    { subject: "Behavioral", score: history.filter(s => s.mode === "behavioral").length > 0 ? avgScore + 5 : 50 },
    { subject: "Communication", score: Math.min(avgScore + 10, 95) },
    { subject: "HR", score: history.filter(s => s.mode === "hr").length > 0 ? avgScore - 5 : 35 },
    { subject: "Problem Solving", score: solvedIds.length > 10 ? 70 : 40 },
    { subject: "Confidence", score: Math.min(history.length * 8, 90) },
  ];

  const totalDuration = history.reduce((a, s) => a + (s.duration || 0), 0);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <Container className="py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
              <p className="text-gray-500 dark:text-gray-400">Track your interview preparation progress</p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Interviews", value: history.length, icon: Brain, color: "purple" },
                { label: "Average Score", value: `${avgScore}%`, icon: TrendingUp, color: "cyan" },
                { label: "Problems Solved", value: solvedIds.length, icon: BookOpen, color: "green" },
                { label: "Practice Time", value: `${Math.round(totalDuration / 60)}m`, icon: Clock, color: "orange" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</p>
                      <Icon className={`w-5 h-5 text-${s.color}-600`} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  </Card>
                );
              })}
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Score Progression</h2>
                {scoreOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={scoreOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 8, color: "#fff" }} />
                      <Line type="monotone" dataKey="score" stroke="#9333ea" strokeWidth={2} dot={{ fill: "#9333ea", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-56 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Complete interviews to see your progress</p>
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Skill Radar</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 9 }} />
                    <Radar name="Score" dataKey="score" stroke="#9333ea" fill="#9333ea" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Interview Modes</h2>
                {modeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={modeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 8, color: "#fff" }} />
                      <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-gray-400">No data yet</div>
                )}
              </Card>

              <Card>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Difficulty Breakdown</h2>
                {diffData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={diffData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 8, color: "#fff" }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {diffData.map((d, i) => (
                          <rect key={i} fill={d.name === "Easy" ? "#22c55e" : d.name === "Medium" ? "#eab308" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-gray-400">No data yet</div>
                )}
              </Card>
            </div>

            {/* Recent sessions table */}
            {history.length > 0 && (
              <Card>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" /> Session History
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Mode</th>
                        <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Role</th>
                        <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Difficulty</th>
                        <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Score</th>
                        <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Duration</th>
                        <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 10).map((s, i) => {
                        const sc = s.scores || [];
                        const avg = sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length * 10) : null;
                        return (
                          <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="py-2 px-3 capitalize text-gray-900 dark:text-white">{s.mode}</td>
                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{s.role || "—"}</td>
                            <td className="py-2 px-3">
                              <Badge variant={s.difficulty === "Easy" ? "success" : s.difficulty === "Medium" ? "warning" : "danger"} className="text-xs">
                                {s.difficulty || "—"}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 font-semibold">
                              {avg != null ? <span className={avg >= 70 ? "text-green-500" : avg >= 50 ? "text-yellow-500" : "text-red-500"}>{avg}%</span> : "—"}
                            </td>
                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                              {s.duration ? `${Math.round(s.duration / 60)}m` : "—"}
                            </td>
                            <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-xs">
                              {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </Container>
        </main>
      </div>
    </div>
  );
};
