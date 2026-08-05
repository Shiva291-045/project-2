import Activity from "../models/Activity.js";
import User from "../models/User.js";

// Freezes are granted once per calendar month, but we cap the stockpile so
// unused freezes can't accumulate forever if someone never misses a day.
const MAX_FREEZES = 3;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// UTC "YYYY-MM-DD" — day boundaries are UTC for everyone, which keeps the
// streak math simple (plain string/date comparison, no per-user timezone
// handling). This is a known simplification: a user right at UTC midnight
// could see their "day" roll over earlier/later than their local midnight.
const dateStr = (d = new Date()) => d.toISOString().slice(0, 10);
const monthKey = (d = new Date()) => d.toISOString().slice(0, 7);

const daysBetween = (fromStr, toStr) =>
  Math.round((new Date(`${toStr}T00:00:00Z`) - new Date(`${fromStr}T00:00:00Z`)) / ONE_DAY_MS);

const addDays = (dStr, n) => dateStr(new Date(new Date(`${dStr}T00:00:00Z`).getTime() + n * ONE_DAY_MS));

/** Grant this month's streak freeze if it hasn't been granted yet. Mutates `user` in memory; caller must save(). */
const grantMonthlyFreezeIfDue = (user) => {
  const thisMonth = monthKey();
  if (user.lastFreezeGrantMonth !== thisMonth) {
    user.streakFreezes = Math.min(MAX_FREEZES, (user.streakFreezes || 0) + 1);
    user.lastFreezeGrantMonth = thisMonth;
    return true;
  }
  return false;
};

/**
 * Call this whenever a user does something that should count as "showing up
 * today" — completing/starting an interview, analyzing a resume, solving a
 * coding problem. Idempotent per day: calling it multiple times in one day
 * only logs one activity and only advances the streak once.
 *
 * Streak rules:
 *  - Consecutive day  → streak += 1
 *  - Same day again    → no-op (already logged)
 *  - Exactly one day missed AND a freeze is available → the freeze auto-
 *    covers the missed day (marked `frozen` on the calendar) and the streak
 *    continues rather than resetting
 *  - Two or more days missed, or no freeze available → streak resets to 1
 *
 * Best-effort by design: failures are logged and swallowed so a streak bug
 * never breaks the feature (interview/resume/coding) that triggered it.
 */
export const recordActivity = async (userId) => {
  try {
    const today = dateStr();
    const user = await User.findById(userId);
    if (!user) return;

    grantMonthlyFreezeIfDue(user);

    let created = true;
    try {
      await Activity.create({ userId, date: today });
    } catch (e) {
      if (e.code === 11000) created = false; // already logged today
      else throw e;
    }

    if (created) {
      const last = user.lastActivityDate;
      if (!last) {
        user.streak = 1;
      } else {
        const gap = daysBetween(last, today);
        if (gap <= 0) {
          // clock skew / same day — leave streak as-is
        } else if (gap === 1) {
          user.streak = (user.streak || 0) + 1;
        } else if (gap === 2 && (user.streakFreezes || 0) > 0) {
          const missedDate = addDays(last, 1);
          await Activity.updateOne(
            { userId, date: missedDate },
            { $setOnInsert: { userId, date: missedDate, frozen: true } },
            { upsert: true }
          );
          user.streakFreezes -= 1;
          user.streak = (user.streak || 0) + 1;
        } else {
          user.streak = 1;
        }
      }
      user.longestStreak = Math.max(user.longestStreak || 0, user.streak || 0);
      user.lastActivityDate = today;
    }

    await user.save({ validateBeforeSave: false });
  } catch (err) {
    console.warn("[Streak] recordActivity failed:", err.message);
  }
};

/**
 * Build the calendar heatmap + current stats for the last `days` days.
 * Also lazily grants this month's freeze if the user hasn't been active
 * yet this month (so freezes accrue even during a lapsed streak).
 */
export const getStreakCalendar = async (userId, days = 182) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  if (grantMonthlyFreezeIfDue(user)) {
    await user.save({ validateBeforeSave: false });
  }

  const today = dateStr();
  const start = addDays(today, -(days - 1));

  const activities = await Activity.find({ userId, date: { $gte: start } }).select("date frozen -_id");
  const byDate = new Map(activities.map(a => [a.date, !!a.frozen]));

  const calendar = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const logged = byDate.has(d);
    calendar.push({
      date:   d,
      active: logged && !byDate.get(d),
      frozen: logged && byDate.get(d),
    });
  }

  return {
    currentStreak:    user.streak || 0,
    longestStreak:    user.longestStreak || 0,
    freezesAvailable: user.streakFreezes || 0,
    maxFreezes:       MAX_FREEZES,
    calendar,
  };
};
