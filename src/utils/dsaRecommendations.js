import rawData from "../data/450DSA.json";

/**
 * DSA weak-topic + recommendation logic
 * ─────────────────────────────────────────────────────────────────────────
 * Deliberately reuses the SAME 450-question dataset CodingPractice.jsx
 * already loads (no duplicate question data anywhere) plus whichever
 * problems the user has solved, to answer two questions used across the
 * app: "which topics is this user weakest in?" and "what should they
 * solve next?" Both the Dashboard and the AI Interview setup screen use
 * this so a user's actual DSA history — not a guess — drives what gets
 * recommended/asked.
 */

const MIN_TOPIC_SIZE = 5; // ignore tiny topics (e.g. Trie, 6 problems) — one solve/miss swings % too much to call it "weak"

let _allProblems = null;
const getAllProblems = () => {
  if (_allProblems) return _allProblems;
  try {
    _allProblems = (rawData["Sheet1"] || [])
      .filter((p) => p["Problem: "] && p["Topic:"])
      .map((p, i) => ({
        id:    `dsa-${i}`,
        title: (p["Problem: "] || "").trim(),
        topic: (p["Topic:"]    || "").trim(),
        url:   p["URL"] || "",
      }));
  } catch {
    _allProblems = [];
  }
  return _allProblems;
};

/** Per-topic { total, solved, percent } for every topic in the dataset. */
export const getTopicStats = (solvedIds) => {
  const solved = solvedIds instanceof Set ? solvedIds : new Set(solvedIds || []);
  const problems = getAllProblems();
  const byTopic = {};
  problems.forEach((p) => {
    if (!byTopic[p.topic]) byTopic[p.topic] = { total: 0, solved: 0 };
    byTopic[p.topic].total += 1;
    if (solved.has(p.id)) byTopic[p.topic].solved += 1;
  });
  Object.values(byTopic).forEach((t) => { t.percent = t.total ? Math.round((t.solved / t.total) * 100) : 0; });
  return byTopic;
};

/**
 * Returns up to `count` topics the user is weakest in — lowest solve %,
 * among topics large enough for the percentage to be meaningful, and only
 * topics with at least one unsolved problem left to recommend.
 */
export const getWeakTopics = (solvedIds, count = 3) => {
  const stats = getTopicStats(solvedIds);
  return Object.entries(stats)
    .filter(([, s]) => s.total >= MIN_TOPIC_SIZE && s.solved < s.total)
    .sort((a, b) => a[1].percent - b[1].percent)
    .slice(0, count)
    .map(([topic, s]) => ({ topic, ...s }));
};

/** `count` unsolved problems from a specific topic, for "solve these next" recommendations. */
export const getRecommendedProblems = (topic, solvedIds, count = 3) => {
  const solved = solvedIds instanceof Set ? solvedIds : new Set(solvedIds || []);
  return getAllProblems()
    .filter((p) => p.topic === topic && !solved.has(p.id))
    .slice(0, count);
};

export { getAllProblems };
