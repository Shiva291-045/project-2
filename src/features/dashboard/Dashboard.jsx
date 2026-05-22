import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Container, Spinner, Badge, Button } from "../../components/ui";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  Target,
  Flame,
  BookOpen,
  Brain,
  Award,
  Clock,
} from "lucide-react";
import apiClient from "../../services/apiClient";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interviewLoading, setInterviewLoading] = useState(false);

  const startInterview = async (type = "behavioral") => {
    try {
      setInterviewLoading(true);
      const res = await apiClient.post("/api/interview/start", {
        interviewType: type,
      });

      if (res.data.success) {
        toast.success("Interview started!");
        navigate(`/interview/${res.data.sessionId}`);
      } else {
        toast.error("Failed to start interview");
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error("Error starting interview");
    } finally {
      setInterviewLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user stats
        const statsRes = await apiClient.get("/api/auth/stats");
        setStats(statsRes.data.data);

        // Fetch analytics
        const analyticsRes = await apiClient.get("/api/analytics");
        setAnalytics(analyticsRes.data.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const scoreData = analytics?.scoreByDate || [];
  const topicData = Object.entries(analytics?.interviewsByType || {}).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <Container className="py-8">
            {/* Hero Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {userProfile?.name}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your AI interview coach is ready. Let's prepare for your dream job.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Average Score */}
              <Card className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full group-hover:scale-110 transition-transform duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Average Score
                    </h3>
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.averageScore || "0"}
                    <span className="text-lg text-gray-500">/100</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Based on {stats?.totalInterviews} interviews
                  </p>
                </div>
              </Card>

              {/* Total Interviews */}
              <Card className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full group-hover:scale-110 transition-transform duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Interviews
                    </h3>
                    <Brain className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalInterviews || "0"}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Total practice sessions
                  </p>
                </div>
              </Card>

              {/* Coding Problems */}
              <Card className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full group-hover:scale-110 transition-transform duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Problems Solved
                    </h3>
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.codingProblems || "0"}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Coding practice solutions
                  </p>
                </div>
              </Card>

              {/* Current Streak */}
              <Card className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full group-hover:scale-110 transition-transform duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Current Streak
                    </h3>
                    <Flame className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.streak || "0"}
                    <span className="text-lg text-gray-500"> days</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Keep it going! 🔥
                  </p>
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Interview Score Trend */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Interview Score Trend
                </h2>
                {scoreData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={scoreData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "none",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#9333ea"
                        dot={{ fill: "#9333ea", r: 4 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No data yet
                  </div>
                )}
              </Card>

              {/* Interview Types Distribution */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Interview Types
                </h2>
                {topicData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topicData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "none",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#06b6d4"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No data yet
                  </div>
                )}
              </Card>
            </div>

            {/* Recommendations Section */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🎯 Personalized Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start space-x-3">
                    <Target className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-1">
                        Focus on Weak Areas
                      </h3>
                      <p className="text-sm text-purple-800 dark:text-purple-400">
                        Practice more on DBMS and System Design. You're doing
                        great on DSA!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-900/10 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-cyan-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-cyan-900 dark:text-cyan-300 mb-1">
                        Next Interview
                      </h3>
                      <p className="text-sm text-cyan-800 dark:text-cyan-400">
                        Try a System Design interview to improve architectural
                        thinking
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                        Study Plan
                      </h3>
                      <p className="text-sm text-green-800 dark:text-green-400">
                        30 mins daily on weak topics + 1 coding problem
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start space-x-3">
                    <Flame className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
                        Daily Challenge
                      </h3>
                      <p className="text-sm text-orange-800 dark:text-orange-400">
                        Complete today's coding challenge to maintain your
                        streak!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => startInterview("behavioral")}
                  disabled={interviewLoading}
                  variant="gradient"
                  size="lg"
                  className="w-full"
                >
                  🎤 Start Interview
                </Button>
                <Button
                  onClick={() => navigate("/coding")}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  💻 Coding Practice
                </Button>
                <Button
                  onClick={() => navigate("/resume")}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  📄 Analyze Resume
                </Button>
              </div>
            </Card>
          </Container>
        </main>
      </div>
    </div>
  );
};
