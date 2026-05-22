import React, { useState, useEffect } from "react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Container, Spinner, Badge } from "../../components/ui";
import { Trophy, Flame, Medal, Star } from "lucide-react";
import apiClient from "../../services/apiClient";

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("global");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaderRes, rankRes] = await Promise.all([
          apiClient.get("/api/leaderboard"),
          apiClient.get("/api/leaderboard/rank"),
        ]);

        setLeaderboard(leaderRes.data.data);
        setUserRank(rankRes.data.data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
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

  const getRankMedal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <Container className="py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-3">
                <Trophy className="w-10 h-10 text-yellow-500" />
                <span>Global Leaderboard</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Compete with other candidates and climb the ranks
              </p>
            </div>

            {/* Your Rank Card */}
            {userRank && (
              <Card className="mb-8 bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Your Rank
                    </p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">
                      #{userRank.rank}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      of {userRank.totalUsers} users
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Your XP
                    </p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                      {userRank.xp}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Filter Buttons */}
            <div className="flex gap-3 mb-8">
              {["global", "weekly", "monthly"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === f
                      ? "bg-purple-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Leaderboard Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        XP
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Streak
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Badge
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leaderboard.map((user, index) => (
                      <tr
                        key={user.uid}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl font-bold">
                              {getRankMedal(user.rank)}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              #{user.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="primary">{user.targetRole}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {user.xp}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {user.streak || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            {user.rank <= 3 && (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            )}
                            {user.streak >= 7 && (
                              <span title="7-day streak">🔥</span>
                            )}
                            {user.xp >= 1000 && (
                              <span title="Expert">⭐</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Achievement Badges Info */}
            <Card className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Achievement Badges
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <span className="text-3xl">🥇</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                    Top Ranker
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Rank in top 10
                  </p>
                </div>

                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <span className="text-3xl">🔥</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                    On Fire
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    7-day streak
                  </p>
                </div>

                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <span className="text-3xl">⭐</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                    Expert
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Earn 1000+ XP
                  </p>
                </div>

                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <span className="text-3xl">💎</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                    Master
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Complete 50 interviews
                  </p>
                </div>
              </div>
            </Card>
          </Container>
        </main>
      </div>
    </div>
  );
};
