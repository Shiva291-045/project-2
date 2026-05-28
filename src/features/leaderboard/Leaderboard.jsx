import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageWrapper } from "../../components/PageWrapper";
import { Badge } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/apiClient";
import { Trophy, Star, Flame, Crown, Medal, TrendingUp, Users } from "lucide-react";

const SEED_DATA = [
  { rank:1,  name:"Arjun Sharma",    score:96, solved:312, streak:42, badge:"Expert",       avatar:"AS" },
  { rank:2,  name:"Priya Verma",     score:93, solved:289, streak:31, badge:"Expert",       avatar:"PV" },
  { rank:3,  name:"Rahul Gupta",     score:91, solved:267, streak:28, badge:"Advanced",     avatar:"RG" },
  { rank:4,  name:"Ananya Singh",    score:88, solved:244, streak:22, badge:"Advanced",     avatar:"AS" },
  { rank:5,  name:"Vikram Nair",     score:85, solved:218, streak:19, badge:"Advanced",     avatar:"VN" },
  { rank:6,  name:"Sneha Patel",     score:83, solved:201, streak:17, badge:"Intermediate", avatar:"SP" },
  { rank:7,  name:"Karan Mehta",     score:80, solved:187, streak:14, badge:"Intermediate", avatar:"KM" },
  { rank:8,  name:"Divya Rao",       score:78, solved:172, streak:12, badge:"Intermediate", avatar:"DR" },
  { rank:9,  name:"Aditya Joshi",    score:75, solved:158, streak:10, badge:"Beginner",     avatar:"AJ" },
  { rank:10, name:"Meera Krishnan",  score:72, solved:143, streak:8,  badge:"Beginner",     avatar:"MK" },
];

const BADGE_STYLES = {
  Expert:       "bg-amber-500/20 text-amber-300 border-amber-400/30",
  Advanced:     "bg-brand-500/20 text-brand-300 border-brand-500/30",
  Intermediate: "bg-neon-blue/20 text-neon-blue border-neon-blue/30",
  Beginner:     "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const RANK_STYLES = [
  "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]",
  "bg-gradient-to-br from-gray-300 to-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.4)]",
  "bg-gradient-to-br from-amber-600 to-orange-600 shadow-[0_0_10px_rgba(180,83,9,0.4)]",
];

const AVATAR_GRADIENTS = [
  "from-brand-500 to-neon-blue","from-neon-blue to-neon-cyan","from-neon-cyan to-neon-pink",
  "from-neon-pink to-brand-500","from-amber-500 to-orange-500","from-green-500 to-neon-cyan",
];

export const Leaderboard = () => {
  const { user, userProfile } = useAuth();
  const [entries, setEntries] = useState(SEED_DATA);
  const [filter,  setFilter]  = useState("all");
  const [loading, setLoading] = useState(true);
  const displayName = userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "You";
  const initials    = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);

  useEffect(() => {
    api.get("/api/leaderboard")
      .then(({ data }) => { if (data?.data?.length) setEntries(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const history = (() => { try { return JSON.parse(localStorage.getItem("prepai_interview_history") || "[]"); } catch (e) { return []; } })();
  const myScore = history.length ? Math.round(history.flatMap(s=>s.scores||[]).reduce((a,b,_,arr)=>a+b/arr.length,0)*10) : 0;

  const top3 = entries.slice(0,3);
  const rest  = entries.slice(3);

  return (
    <PageWrapper>
      {/* Header */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" /> Leaderboard
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Top performers this month · Updated daily</p>
      </motion.div>

      {/* Podium */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="flex items-end justify-center gap-4 mb-10">
        {[top3[1], top3[0], top3[2]].map((entry, i) => {
          if (!entry) return null;
          const heights = ["h-28","h-36","h-24"];
          const sizes   = ["w-14 h-14","w-16 h-16","w-12 h-12"];
          const textSizes = ["text-lg","text-xl","text-base"];
          const rankIdx = i === 1 ? 0 : i === 0 ? 1 : 2;
          return (
            <motion.div key={entry.rank}
              initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: 0.15 + i*0.08 }}
              className="flex flex-col items-center gap-3"
            >
              <div className={`${sizes[i]} rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[rankIdx]} flex items-center justify-center font-bold text-white shadow-lg ${textSizes[i]}`}>
                {entry.avatar}
              </div>
              <p className="text-xs text-gray-300 font-medium text-center max-w-[80px] truncate">{entry.name.split(" ")[0]}</p>
              <div className={`${heights[i]} w-20 rounded-t-2xl ${RANK_STYLES[rankIdx]} flex flex-col items-center justify-start pt-3`}>
                <span className="text-white font-display font-extrabold text-lg">#{entry.rank}</span>
                <span className="text-white/80 text-xs">{entry.score}%</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        className="glass rounded-2xl border border-[rgba(155,93,229,0.1)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(155,93,229,0.08)] flex items-center justify-between">
          <h3 className="font-display font-semibold text-white">Rankings</h3>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">{entries.length} participants</span>
          </div>
        </div>
        <div className="divide-y divide-[rgba(155,93,229,0.06)]">
          {rest.map((entry, i) => (
            <motion.div key={entry.rank}
              initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
              transition={{ delay: 0.35 + i*0.04 }}
              className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
            >
              <div className="w-8 text-center">
                <span className="font-display font-bold text-gray-400 text-sm">#{entry.rank}</span>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white text-sm font-bold`}>
                {entry.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{entry.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-lg border ${BADGE_STYLES[entry.badge]}`}>{entry.badge}</span>
                  <span className="text-xs text-gray-600 flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" />{entry.streak}d</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-white">{entry.score}%</p>
                <p className="text-xs text-gray-500">{entry.solved} solved</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* My position */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
        className="mt-4 flex items-center gap-4 px-6 py-4 glass rounded-2xl border border-brand-500/25 bg-brand-500/5">
        <div className="w-8 text-center">
          <span className="font-display font-bold text-gray-400 text-sm">You</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-neon-blue flex items-center justify-center text-white text-sm font-bold">
          {initials}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{displayName}</p>
          <p className="text-xs text-gray-500 mt-0.5">Your current position</p>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-neon-purple">{myScore || "—"}%</p>
          <p className="text-xs text-gray-500">avg score</p>
        </div>
      </motion.div>
    </PageWrapper>
  );
};
