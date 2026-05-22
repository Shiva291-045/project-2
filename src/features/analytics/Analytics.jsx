import React, { useState, useEffect } from "react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Container, Spinner, Badge } from "../../components/ui";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import apiClient from "../../services/apiClient";
import { TrendingUp, Target, Zap } from "lucide-react";

export const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, topicsRes] = await Promise.all([
          apiClient.get("/api/analytics"),
          apiClient.get("/api/analytics/topics"),
        ]);

        setAnalytics(analyticsRes.data.data);
        setTopicData(topicsRes.data.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
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
  const interviewTypes = Object.entries(analytics?.interviewsByType || {}).map(
    ([name, count]) => ({
      name,
      value: count,
    })
  );

  const COLORS = ["#9333ea", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

  const topicRadarData = Object.entries(topicData || {}).map(([topic, score]) => ({
    name: topic,
    score: Math.min(score / 100, 100),
  }));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <Container className="py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your interview preparation progress and identify areas for improvement
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Interviews
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics?.totalInterviews || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Problems Solved
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics?.totalProblems || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-cyan-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Success Rate
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics?.totalProblems > 0
                        ? Math.round(
                            (analytics?.passedProblems /
                              analytics?.totalProblems) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Score Trend */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Interview Score Trend
                </h2>
                {scoreData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={scoreData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
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
                        dot={{ fill: "#9333ea" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </Card>

              {/* Interview Types Distribution */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Interview Type Distribution
                </h2>
                {interviewTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={interviewTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {interviewTypes.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </Card>
            </div>

            {/* Topic Radar Chart */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Topic-wise Performance
              </h2>
              {topicRadarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={topicRadarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="name" stroke="#9ca3af" />
                    <PolarRadiusAxis stroke="#9ca3af" />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#9333ea"
                      fill="#9333ea"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </Card>

            {/* Recommendations */}
            <Card className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Performance Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    Strengths
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <li>✅ Strong in Data Structures and Algorithms</li>
                    <li>✅ Good communication and clarity</li>
                    <li>✅ Consistent performance across interviews</li>
                  </ul>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                    Areas to Improve
                  </h3>
                  <ul className="text-sm text-orange-800 dark:text-orange-400 space-y-1">
                    <li>⚠️ System Design concepts need more practice</li>
                    <li>⚠️ Database optimization techniques</li>
                    <li>⚠️ Behavioral interview preparation</li>
                  </ul>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                    Recommended Focus
                  </h3>
                  <ul className="text-sm text-green-800 dark:text-green-400 space-y-1">
                    <li>🎯 System Design interviews (3-4x per week)</li>
                    <li>🎯 Database optimization problems</li>
                    <li>🎯 Mock HR interviews</li>
                  </ul>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                    Next Steps
                  </h3>
                  <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1">
                    <li>📈 Complete 5 more medium-level problems</li>
                    <li>📈 Review System Design fundamentals</li>
                    <li>📈 Schedule mock interviews weekly</li>
                  </ul>
                </div>
              </div>
            </Card>
          </Container>
        </main>
      </div>
    </div>
  );
};
