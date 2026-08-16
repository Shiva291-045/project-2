import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui";
import api from "../../services/apiClient";
import { getWeakTopics, getRecommendedProblems } from "../../utils/dsaRecommendations";
import { Target, TrendingUp, TrendingDown, Code2, Brain, FileText, ArrowRight } from "lucide-react";

const CATEGORY_ICONS = { dsa: Code2, technical: Brain, communication: Brain, resume: FileText, consistency: TrendingUp };

const scoreColor = (score) => {
  if (score == null) return "bg-gray-700";
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
};

const ringColor = (score) => {
  if (score == null) return "#4b5563";
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
};

/**
 * Placement readiness: overall score + category breakdown come from the
 * backend (GET /api/analytics/readiness), which only ever computes from
 * real stored data — categories with nothing recorded yet are shown as
 * "not enough data" rather than a fabricated number.
 *
 * The DSA weak-topic recommendation is computed CLIENT-SIDE (see
 * dsaRecommendations.js) by reusing the same 450-question dataset and the
 * user's solved-problem list already used elsewhere in the app — nothing
 * duplicated, nothing invented.
 */
const ReadinessPanel = () => {
  const [readiness, setReadiness] = useState(null);
  const [solvedIds, setSolvedIds] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [readinessRes, solvedRes] = await Promise.all([
          api.get("/api/analytics/readiness"),
          api.get("/api/coding/solved").catch(() => ({ data: { data: { solvedIds: [] } } })),
        ]);
        if (cancelled) return;
        setReadiness(readinessRes.data.data);
        setSolvedIds(solvedRes.data?.data?.solvedIds || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load readiness data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const weakDsaTopic = useMemo(() => {
    if (!solvedIds) return null;
    const weak = getWeakTopics(solvedIds, 1);
    if (!weak.length) return null;
    const problems = getRecommendedProblems(weak[0].topic, solvedIds, 3);
    return { ...weak[0], problems };
  }, [solvedIds]);

  // Recommended tasks — every entry here is derived from a real signal
  // (a missing category, a weak category, or an actual weak DSA topic).
  const tasks = useMemo(() => {
    if (!readiness) return [];
    const t = [];
    if (!readiness.categories.resume.hasData) {
      t.push({ icon: FileText, text: "Analyze your resume to unlock ATS scoring", href: "/resume" });
    }
    if (!readiness.categories.technical.hasData) {
      t.push({ icon: Brain, text: "Take your first mock interview", href: "/interview" });
    }
    if (weakDsaTopic) {
      t.push({
        icon: Code2,
        text: `You're weak in ${weakDsaTopic.topic} (${weakDsaTopic.solved}/${weakDsaTopic.total} solved) — try ${weakDsaTopic.problems.length} more`,
        href: "/coding",
      });
    }
    if (readiness.categories.communication.hasData && readiness.categories.communication.score < 50) {
      t.push({ icon: Brain, text: "Communication scored low in recent interviews — try a behavioral session", href: "/interview" });
    }
    return t.slice(0, 4);
  }, [readiness, weakDsaTopic]);

  if (loading) {
    return <Card className="p-6"><div className="h-40 flex items-center justify-center text-gray-500 text-sm">Loading readiness score…</div></Card>;
  }
  if (error || !readiness) {
    return <Card className="p-6"><p className="text-sm text-gray-500">Couldn't load your readiness score right now.</p></Card>;
  }

  const { overallReadiness, categories, strongAreas, weakAreas } = readiness;
  const circumference = 2 * Math.PI * 42;
  const dashOffset = overallReadiness != null ? circumference * (1 - overallReadiness / 100) : circumference;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <Target className="w-5 h-5 text-neon-purple" />
        <h3 className="font-display font-bold text-white text-lg">Placement Readiness</h3>
      </div>

      <div className="grid md:grid-cols-[auto_1fr] gap-6">
        {/* Overall score ring */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              {overallReadiness != null && (
                <motion.circle
                  cx="50" cy="50" r="42" fill="none" stroke={ringColor(overallReadiness)} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold text-white">{overallReadiness ?? "—"}</span>
              {overallReadiness != null && <span className="text-[10px] text-gray-500">/ 100</span>}
            </div>
          </div>
          {overallReadiness == null && <p className="text-xs text-gray-600 mt-2 text-center max-w-[140px]">Complete an activity to see your score</p>}
        </div>

        {/* Category breakdown */}
        <div className="space-y-2.5">
          {Object.entries(categories).map(([key, cat]) => {
            const Icon = CATEGORY_ICONS[key] || Target;
            return (
              <div key={key} className="flex items-center gap-3">
                <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-400 w-28 flex-shrink-0">{cat.label}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  {cat.hasData && (
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${cat.score}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${scoreColor(cat.score)}`}
                    />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-300 w-14 text-right flex-shrink-0">
                  {cat.hasData ? `${cat.score}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strong / weak areas */}
      {(strongAreas.length > 0 || weakAreas.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-[rgba(155,93,229,0.08)]">
          {strongAreas.length > 0 && (
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400"><span className="text-gray-300 font-medium">Strong: </span>{strongAreas.join(", ")}</p>
            </div>
          )}
          {weakAreas.length > 0 && (
            <div className="flex items-start gap-2">
              <TrendingDown className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400"><span className="text-gray-300 font-medium">Focus on: </span>{weakAreas.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {/* Recommended tasks */}
      {tasks.length > 0 && (
        <div className="mt-5 pt-5 border-t border-[rgba(155,93,229,0.08)]">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Today's Recommended Tasks</p>
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <Link key={i} to={task.href} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.08)] hover:border-[rgba(155,93,229,0.25)] transition-all group">
                <task.icon className="w-4 h-4 text-neon-purple flex-shrink-0" />
                <span className="text-xs text-gray-300 flex-1">{task.text}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-neon-purple group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReadinessPanel;
