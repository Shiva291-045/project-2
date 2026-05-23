import React, { useState, useMemo } from "react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Container, Badge } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import { Trophy, Medal, Star, Flame, TrendingUp, Crown } from "lucide-react";

// Deterministic leaderboard seed (no API needed)
const LEADERBOARD_DATA = [
  { rank: 1,  name: "Arjun Sharma",   score: 96, solved: 312, streak: 42, badge: "Expert",      avatar: "AS" },
  { rank: 2,  name: "Priya Verma",    score: 93, solved: 289, streak: 31, badge: "Expert",      avatar: "PV" },
  { rank: 3,  name: "Rahul Gupta",    score: 91, solved: 267, streak: 28, badge: "Advanced",    avatar: "RG" },
  { rank: 4,  name: "Ananya Singh",   score: 88, solved: 244, streak: 22, badge: "Advanced",    avatar: "AS" },
  { rank: 5,  name: "Vikram Nair",    score: 85, solved: 218, streak: 19, badge: "Advanced",    avatar: "VN" },
  { rank: 6,  name: "Sneha Patel",    score: 83, solved: 201, streak: 17, badge: "Intermediate", avatar: "SP" },
  { rank: 7,  name: "Karan Mehta",    score: 80, solved: 187, streak: 14, badge: "Intermediate", avatar: "KM" },
  { rank: 8,  name: "Divya Rao",      score: 78, solved: 172, streak: 12, badge: "Intermediate", avatar: "DR" },
  { rank: 9,  name: "Aditya Joshi",   score: 75, solved: 158, streak: 10, badge: "Beginner",    avatar: "AJ" },
  { rank: 10, name: "Meera Krishnan", score: 72, solved: 143, streak: 8,  badge: "Beginner",    avatar: "MK" },
];

const BADGE_COLOR = {
  Expert:       "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  Advanced:     "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Beginner:     "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const RANK_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-600"];
const RANK_ICONS = [Crown, Medal, Star];

export const Leaderboard = () => {
  const { userProfile, user } = useAuth();
  const [tab, setTab] = useState("global"); // global | weekly

  // Build a "You" entry from local data
  const myEntry = useMemo(() => {
    try {
      const history = JSON.parse(localStorage.getItem("prepai_interview_history") || "[]");
      const solved = JSON.parse(localStorage.getItem("prepai_solved_problems") || "[]").length;
      const scores = history.flatMap(s => s.scores || []);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;
      return {
        rank: "—",
        name: userProfile?.name || user?.displayName || "You",
        score: avg,
        solved,
        streak: Math.min(history.length, 7),
        badge: avg >= 80 ? "Advanced" : avg >= 60 ? "Intermediate" : "Beginner",
        avatar: (userProfile?.name || "You")[0].toUpperCase(),
        isMe: true,
      };
    } catch { return null; }
  }, [userProfile, user]);

  const data = tab === "weekly"
    ? LEADERBOARD_DATA.slice(0, 5).map(d => ({ ...d, score: Math.max(d.score - 10, 50), solved: Math.round(d.solved * 0.3) }))
    : LEADERBOARD_DATA;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <Container className="py-8 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Trophy className="w-9 h-9 text-yellow-500" /> Leaderboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400">Top performers in the PrepAI community</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {["global", "weekly"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                    tab === t
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300"
                  }`}
                >
                  {t} Rankings
                </button>
              ))}
            </div>

            {/* Top 3 podium */}
            <div className="flex items-end justify-center gap-4 mb-8">
              {[data[1], data[0], data[2]].map((player, podiumIdx) => {
                const heights = ["h-28", "h-36", "h-24"];
                const colors = ["from-gray-400 to-gray-500", "from-yellow-400 to-yellow-600", "from-amber-500 to-amber-700"];
                const posLabels = ["2nd", "1st", "3rd"];
                return (
                  <div key={player.rank} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {player.avatar}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white text-center max-w-[80px] truncate">{player.name}</p>
                    <p className="text-xs text-gray-500">{player.score}%</p>
                    <div className={`w-20 ${heights[podiumIdx]} rounded-t-xl bg-gradient-to-t ${colors[podiumIdx]} flex items-start justify-center pt-2`}>
                      <span className="text-white font-bold text-lg">{posLabels[podiumIdx]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full table */}
            <Card className="p-0 overflow-hidden">
              {/* Your rank (if logged in) */}
              {myEntry && myEntry.score > 0 && (
                <div className="flex items-center gap-4 px-6 py-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                  <span className="text-sm font-bold text-purple-600 w-8 text-center">{myEntry.rank}</span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                    {myEntry.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{myEntry.name} <span className="text-purple-500 text-xs">(You)</span></p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_COLOR[myEntry.badge]}`}>{myEntry.badge}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-right">
                    <div><p className="font-bold text-gray-900 dark:text-white">{myEntry.score}%</p><p className="text-xs text-gray-500">Avg Score</p></div>
                    <div><p className="font-bold text-gray-900 dark:text-white">{myEntry.solved}</p><p className="text-xs text-gray-500">Solved</p></div>
                    <div className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /><p className="font-bold text-gray-900 dark:text-white">{myEntry.streak}</p></div>
                  </div>
                </div>
              )}

              {/* Table header */}
              <div className="grid grid-cols-[2.5rem_1fr_6rem_6rem_6rem] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <span className="text-center">#</span>
                <span>Player</span>
                <span className="text-right">Avg Score</span>
                <span className="text-right">Solved</span>
                <span className="text-right">Streak</span>
              </div>

              {data.map((player, i) => {
                const RankIcon = i < 3 ? RANK_ICONS[i] : null;
                return (
                  <div
                    key={player.rank}
                    className="grid grid-cols-[2.5rem_1fr_6rem_6rem_6rem] gap-4 items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex justify-center">
                      {RankIcon
                        ? <RankIcon className={`w-5 h-5 ${RANK_COLORS[i]}`} />
                        : <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{player.rank}</span>
                      }
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {player.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{player.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_COLOR[player.badge]}`}>{player.badge}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${player.score >= 90 ? "text-green-500" : player.score >= 75 ? "text-yellow-500" : "text-gray-700 dark:text-gray-300"}`}>
                        {player.score}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{player.solved}</p>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{player.streak}</p>
                    </div>
                  </div>
                );
              })}
            </Card>
          </Container>
        </main>
      </div>
    </div>
  );
};
