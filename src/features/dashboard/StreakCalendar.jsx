import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "../../components/ui";
import api from "../../services/apiClient";
import { Flame, Snowflake, Trophy } from "lucide-react";

/* ─── Streak calendar (GitHub-contribution-style heatmap) ────────────────────
 * - Dark green cell  = a real day of activity (interview / resume / coding)
 * - Ice-blue cell    = day covered by a streak freeze (missed, but protected)
 * - Dark gray cell   = no activity, no freeze
 * Cells are grouped into weeks (columns), Sun→Sat top-to-bottom, matching
 * the familiar GitHub layout. ──────────────────────────────────────────── */

const DAY_MS = 24 * 60 * 60 * 1000;

const cellClass = (day) => {
  if (!day) return "bg-transparent";
  if (day.active) return "bg-green-600 hover:bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]";
  if (day.frozen) return "bg-sky-400/70 hover:bg-sky-400";
  return "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.09)]";
};

const formatDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });

const StreakCalendar = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: res } = await api.get("/api/analytics/streak?days=182");
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load streak data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Group the flat day list into weeks (columns), padded so the first
  // column starts on a Sunday — same convention GitHub's graph uses.
  const weeks = useMemo(() => {
    if (!data?.calendar?.length) return [];
    const firstDow = new Date(`${data.calendar[0].date}T00:00:00Z`).getUTCDay(); // 0=Sun
    const padded = [...Array(firstDow).fill(null), ...data.calendar];
    const cols = [];
    for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));
    return cols;
  }, [data]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-32 flex items-center justify-center text-gray-500 text-sm">Loading streak…</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Couldn't load your streak calendar right now.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="font-display font-bold text-white text-lg">Activity Streak</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-display font-bold text-orange-400">{data.currentStreak}</span>
            <span className="text-gray-500">day streak</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{data.longestStreak} best</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400" title="Streak freezes auto-protect your streak if you miss a day — 1 is granted every month">
            <Snowflake className="w-4 h-4 text-sky-400" />
            <span>{data.freezesAvailable}/{data.maxFreezes} freeze{data.freezesAvailable === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-[3px] min-w-max pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <motion.div
                  key={di}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(wi * 0.01, 0.4) }}
                  onMouseEnter={() => day && setHovered(day)}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-[11px] h-[11px] rounded-[2px] transition-colors cursor-default ${cellClass(day)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-500 h-4">
          {hovered
            ? `${formatDate(hovered.date)} — ${hovered.active ? "Active" : hovered.frozen ? "Streak freeze used" : "No activity"}`
            : "Hover a day for details"}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-600 inline-block" /> Active</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-sky-400/70 inline-block" /> Frozen</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[rgba(255,255,255,0.05)] inline-block" /> None</span>
        </div>
      </div>
    </Card>
  );
};

export default StreakCalendar;
