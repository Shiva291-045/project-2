import React, { useState, useMemo, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Badge, Button, Spinner } from "../../components/ui";
import {
  CheckCircle, Play, ExternalLink, RotateCcw, Search,
  BookOpen, X, ChevronRight, ArrowLeft, List, Code2,
  Filter, LayoutGrid,
} from "lucide-react";
import toast from "react-hot-toast";
import rawData from "../../data/450DSA.json";

// ── Parse + enrich 450DSA data ────────────────────────────────────────────
const ALL_PROBLEMS = (() => {
  try {
    return (rawData["Sheet1"] || [])
      .filter((p) => p["Problem: "] && p["Topic:"])
      .map((p, i) => ({
        id:         `dsa-${i}`,
        title:      (p["Problem: "] || "").trim(),
        topic:      (p["Topic:"]    || "").trim(),
        url:        p["URL"] || "",
        difficulty: assignDifficulty(i, (p["Topic:"] || "").trim()),
      }));
  } catch { return []; }
})();

function assignDifficulty(idx, topic) {
  const hardTopics = ["Dynamic Programming","Graph","Trie","BackTracking"];
  const easyTopics = ["Array","String","Bit Manipulation"];
  if (hardTopics.includes(topic)) return idx % 5 === 0 ? "Easy" : idx % 3 === 0 ? "Hard" : "Medium";
  if (easyTopics.includes(topic)) return idx % 4 === 0 ? "Medium" : "Easy";
  return idx % 5 === 0 ? "Hard" : idx % 2 === 0 ? "Medium" : "Easy";
}

// ── Topic metadata (icon colours) ────────────────────────────────────────
const TOPIC_META = {
  "Array":              { color: "from-blue-500 to-blue-600",     emoji: "📊" },
  "String":             { color: "from-green-500 to-green-600",   emoji: "🔤" },
  "LinkedList":         { color: "from-yellow-500 to-yellow-600", emoji: "🔗" },
  "Binary Trees":       { color: "from-emerald-500 to-teal-600",  emoji: "🌳" },
  "Binary Search Trees":{ color: "from-teal-500 to-cyan-600",     emoji: "🌲" },
  "Dynamic Programming":{ color: "from-purple-500 to-purple-600", emoji: "🧠" },
  "Graph":              { color: "from-red-500 to-rose-600",      emoji: "🕸️" },
  "Stacks & Queues":    { color: "from-orange-500 to-amber-600",  emoji: "📚" },
  "Heap":               { color: "from-pink-500 to-rose-500",     emoji: "⛰️" },
  "Matrix":             { color: "from-indigo-500 to-indigo-600", emoji: "🔢" },
  "Searching & Sorting":{ color: "from-cyan-500 to-sky-600",      emoji: "🔍" },
  "BackTracking":       { color: "from-violet-500 to-purple-600", emoji: "↩️" },
  "Bit Manipulation":   { color: "from-lime-500 to-green-600",    emoji: "⚙️" },
  "Greedy":             { color: "from-amber-500 to-orange-600",  emoji: "💰" },
  "Trie":               { color: "from-fuchsia-500 to-pink-600",  emoji: "🔠" },
};
const DEFAULT_META = { color: "from-gray-500 to-gray-600", emoji: "💡" };

const DIFF_COLOR = { Easy: "success", Medium: "warning", Hard: "danger" };
const DIFF_TEXT  = { Easy: "text-green-500", Medium: "text-yellow-500", Hard: "text-red-500" };

const STARTER = {
  javascript: `// Write your solution here\nfunction solution() {\n  \n}`,
  python:     `# Write your solution here\ndef solution():\n    pass`,
  java:       `public class Solution {\n    public static void main(String[] args) {\n        // Your code\n    }\n}`,
  cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code\n    return 0;\n}`,
  c:          `#include <stdio.h>\n\nint main() {\n    // Your code\n    return 0;\n}`,
};

const SOLVED_KEY = "prepai_solved_problems";
const getSolved  = () => { try { return new Set(JSON.parse(localStorage.getItem(SOLVED_KEY) || "[]")); } catch { return new Set(); } };
const saveSolved = (s) => localStorage.setItem(SOLVED_KEY, JSON.stringify([...s]));

// ── Topic grid card ───────────────────────────────────────────────────────
const TopicCard = ({ topic, problems, solvedCount, onClick }) => {
  const meta  = TOPIC_META[topic] || DEFAULT_META;
  const total = problems.length;
  const pct   = total ? Math.round((solvedCount / total) * 100) : 0;
  const easy   = problems.filter((p) => p.difficulty === "Easy").length;
  const medium = problems.filter((p) => p.difficulty === "Medium").length;
  const hard   = problems.filter((p) => p.difficulty === "Hard").length;

  return (
    <button
      onClick={() => onClick(topic)}
      className="group text-left w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 overflow-hidden hover:scale-[1.01]"
    >
      {/* Gradient top strip */}
      <div className={`h-2 w-full bg-gradient-to-r ${meta.color}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.emoji}</span>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{topic}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{total} problems</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">{solvedCount}/{total} solved</span>
            <span className={`font-medium ${pct === 100 ? "text-green-500" : "text-purple-500"}`}>{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all bg-gradient-to-r ${meta.color}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Difficulty pills */}
        <div className="flex gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{easy}E</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">{medium}M</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{hard}H</span>
        </div>
      </div>
    </button>
  );
};

// ── Main component ────────────────────────────────────────────────────────
export const CodingPractice = () => {
  // ── Views: "topics" → "problems" → "editor"
  const [view,     setView]     = useState("topics");
  const [selTopic, setSelTopic] = useState(null);
  const [selProb,  setSelProb]  = useState(null);

  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [difficulty,  setDifficulty]  = useState("All");

  const [code,        setCode]        = useState(STARTER["javascript"]);
  const [language,    setLanguage]    = useState("javascript");
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [customInput, setCustomInput] = useState("");
  const [output,      setOutput]      = useState("");
  const [running,     setRunning]     = useState(false);
  const [solved,      setSolved]      = useState(getSolved);

  // ── Computed data ─────────────────────────────────────────────────
  const topics = useMemo(() => [...new Set(ALL_PROBLEMS.map((p) => p.topic))].sort(), []);

  const topicStats = useMemo(() => {
    const map = {};
    topics.forEach((t) => {
      const probs = ALL_PROBLEMS.filter((p) => p.topic === t);
      map[t] = { problems: probs, solvedCount: probs.filter((p) => solved.has(p.id)).length };
    });
    return map;
  }, [topics, solved]);

  // Problems for selected topic, filtered
  const topicProblems = useMemo(() => {
    if (!selTopic) return [];
    return ALL_PROBLEMS.filter((p) => {
      const matchTopic = p.topic === selTopic;
      const matchDiff  = difficulty === "All" || p.difficulty === difficulty;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
      return matchTopic && matchDiff && matchSearch;
    });
  }, [selTopic, difficulty, search]);

  // Global summary stats
  const globalStats = useMemo(() => ({
    total:       ALL_PROBLEMS.length,
    solved:      ALL_PROBLEMS.filter((p) => solved.has(p.id)).length,
    easy:        ALL_PROBLEMS.filter((p) => p.difficulty === "Easy").length,
    medium:      ALL_PROBLEMS.filter((p) => p.difficulty === "Medium").length,
    hard:        ALL_PROBLEMS.filter((p) => p.difficulty === "Hard").length,
    solvedEasy:  ALL_PROBLEMS.filter((p) => p.difficulty === "Easy"   && solved.has(p.id)).length,
    solvedMedium:ALL_PROBLEMS.filter((p) => p.difficulty === "Medium" && solved.has(p.id)).length,
    solvedHard:  ALL_PROBLEMS.filter((p) => p.difficulty === "Hard"   && solved.has(p.id)).length,
  }), [solved]);

  const toggleSolved = useCallback((id, e) => {
    e?.stopPropagation();
    setSolved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveSolved(next);
      return next;
    });
  }, []);

  const openEditor = (prob) => {
    setSelProb(prob);
    setCode(STARTER[language] || "");
    setOutput("");
    setView("editor");
  };

  // ── Code execution ────────────────────────────────────────────────
  const handleRun = async () => {
    setRunning(true); setOutput("");
    try {
      const langMap = { javascript: 63, python: 71, java: 62, cpp: 54, c: 50 };
      const res = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-RapidAPI-Key": process.env.REACT_APP_JUDGE0_KEY || "demo", "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com" },
        body: JSON.stringify({ source_code: btoa(unescape(encodeURIComponent(code))), language_id: langMap[language] || 63, stdin: btoa(unescape(encodeURIComponent(customInput))) }),
      });
      if (!res.ok) throw new Error("Judge0 unavailable");
      const r = await res.json();
      const dec = (b64) => b64 ? decodeURIComponent(escape(atob(b64))) : "";
      setOutput(dec(r.stdout) || dec(r.stderr) || dec(r.compile_output) || r.status?.description || "No output");
      if (dec(r.stderr) || dec(r.compile_output)) toast.error("Errors in output");
      else toast.success("Executed!");
    } catch {
      if (language === "javascript") {
        try {
          const logs = [];
          // eslint-disable-next-line no-new-func
          new Function("console", code)({ log: (...a) => logs.push(a.map(String).join(" ")) });
          setOutput(logs.join("\n") || "(no output)");
          toast.success("Executed (browser JS)");
        } catch (err) { setOutput(`Error: ${err.message}`); toast.error("Runtime error"); }
      } else {
        setOutput("⚠️ Set REACT_APP_JUDGE0_KEY for multi-language execution.\nJavaScript runs in the browser without a key.");
      }
    } finally { setRunning(false); }
  };

  // ── Renders ───────────────────────────────────────────────────────

  // TOPICS VIEW
  if (view === "topics") return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Title + global stats */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">Coding Practice</h1>
              <p className="text-gray-500 dark:text-gray-400">450 DSA problems — pick a topic to get started</p>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-6 mb-8 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Total Solved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{globalStats.solved}<span className="text-sm text-gray-400 font-normal">/{globalStats.total}</span></p>
              </div>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700 hidden md:block" />
              {[
                { label: "Easy",   val: globalStats.solvedEasy,   total: globalStats.easy,   cls: DIFF_TEXT["Easy"]   },
                { label: "Medium", val: globalStats.solvedMedium, total: globalStats.medium, cls: DIFF_TEXT["Medium"] },
                { label: "Hard",   val: globalStats.solvedHard,   total: globalStats.hard,   cls: DIFF_TEXT["Hard"]   },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{s.label}</p>
                  <p className={`text-lg font-bold ${s.cls}`}>{s.val}<span className="text-gray-400 text-sm font-normal">/{s.total}</span></p>
                </div>
              ))}
              <div className="flex-1 min-w-[120px]">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{globalStats.total ? Math.round((globalStats.solved / globalStats.total) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full transition-all" style={{ width: `${globalStats.total ? (globalStats.solved / globalStats.total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>

            {/* Topic grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((topic) => (
                <TopicCard
                  key={topic}
                  topic={topic}
                  problems={topicStats[topic]?.problems || []}
                  solvedCount={topicStats[topic]?.solvedCount || 0}
                  onClick={(t) => { setSelTopic(t); setDifficulty("All"); setSearch(""); setSearchInput(""); setView("problems"); }}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  // PROBLEMS VIEW
  if (view === "problems") {
    const meta = TOPIC_META[selTopic] || DEFAULT_META;
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-20 md:ml-64 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              {/* Back + title */}
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView("topics")} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> All Topics
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meta.emoji}</span>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selTopic}</h1>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-6">
                {/* Search */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={searchInput}
                      onChange={(e) => { setSearchInput(e.target.value); if (!e.target.value) setSearch(""); }}
                      onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
                      placeholder="Search problems…"
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {search && (
                    <button onClick={() => { setSearch(""); setSearchInput(""); }} className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Difficulty filter */}
                <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
                  {["All", "Easy", "Medium", "Hard"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        difficulty === d
                          ? d === "Easy"   ? "bg-green-500 text-white"
                            : d === "Medium" ? "bg-yellow-500 text-white"
                            : d === "Hard"   ? "bg-red-500 text-white"
                            : "bg-purple-600 text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Problems list */}
              <Card className="p-0 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{topicProblems.length} problems</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {topicProblems.filter((p) => solved.has(p.id)).length} solved
                  </span>
                </div>

                {topicProblems.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No problems match your filters.</p>
                    <button onClick={() => { setDifficulty("All"); setSearch(""); setSearchInput(""); }} className="text-purple-500 text-sm mt-2 hover:underline">
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {topicProblems.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                        {/* Solved toggle */}
                        <button
                          onClick={(e) => toggleSolved(p.id, e)}
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                            solved.has(p.id) ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-600 hover:border-green-400"
                          } flex items-center justify-center`}
                          title={solved.has(p.id) ? "Mark unsolved" : "Mark solved"}
                        >
                          {solved.has(p.id) && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>

                        {/* Index */}
                        <span className="text-xs text-gray-400 w-6 flex-shrink-0 font-mono">{idx + 1}</span>

                        {/* Title */}
                        <span className={`flex-1 text-sm font-medium truncate ${solved.has(p.id) ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>
                          {p.title}
                        </span>

                        {/* Difficulty */}
                        <Badge variant={DIFF_COLOR[p.difficulty]} className="text-xs flex-shrink-0">{p.difficulty}</Badge>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                              title="Open problem">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => openEditor(p)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
                          >
                            <Code2 className="w-3 h-3" /> Solve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // EDITOR VIEW
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64 overflow-hidden">
        <Header />
        {/* Editor toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("problems")} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {selTopic}
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-xs">{selProb?.title}</h2>
              <Badge variant={DIFF_COLOR[selProb?.difficulty]} className="text-xs">{selProb?.difficulty}</Badge>
              {solved.has(selProb?.id) && <Badge variant="success" className="text-xs">✓ Solved</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select value={language} onChange={(e) => { setLanguage(e.target.value); setCode(STARTER[e.target.value] || ""); }}
              className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 focus:outline-none">
              {Object.keys(STARTER).map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <button onClick={() => setEditorTheme(t => t === "vs-dark" ? "light" : "vs-dark")}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {editorTheme === "vs-dark" ? "☀️ Light" : "🌙 Dark"}
            </button>
            {selProb?.url && (
              <a href={selProb.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <ExternalLink className="w-3 h-3" /> Problem
              </a>
            )}
            <button onClick={(e) => toggleSolved(selProb?.id, e)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                solved.has(selProb?.id)
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}>
              <CheckCircle className="w-3 h-3" />
              {solved.has(selProb?.id) ? "Solved" : "Mark Solved"}
            </button>
          </div>
        </div>

        {/* Editor + output */}
        <div className="flex-1 overflow-hidden flex">
          {/* Monaco */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800 text-gray-400 text-xs">
              <span>Editor</span>
              <button onClick={() => setCode(STARTER[language] || "")} className="flex items-center gap-1 hover:text-white transition-colors">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
            <div className="flex-1">
              <Editor height="100%" language={language} value={code} onChange={(v) => setCode(v || "")} theme={editorTheme}
                options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on", scrollBeyondLastLine: false, automaticLayout: true }} />
            </div>
          </div>

          {/* I/O Panel */}
          <div className="w-72 flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Custom Input</label>
              <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="stdin…"
                className="w-full h-20 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none font-mono" />
            </div>
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <button onClick={handleRun} disabled={running}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white text-sm font-semibold transition-all disabled:opacity-60">
                {running ? <Spinner size="sm" /> : <Play className="w-4 h-4" />}
                {running ? "Running…" : "Run Code"}
              </button>
            </div>
            <div className="flex-1 p-3 overflow-auto">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Output</label>
              <pre className="text-xs font-mono text-green-400 bg-gray-900 rounded-lg p-3 min-h-24 whitespace-pre-wrap border border-gray-700">
                {running ? "Running…" : output || "// Output appears here"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
