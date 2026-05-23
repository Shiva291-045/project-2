import React, { useState, useEffect, useMemo, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Button, Container, Badge, Spinner } from "../../components/ui";
import {
  CheckCircle,
  Play,
  ExternalLink,
  RotateCcw,
  Search,
  BookOpen,
  Filter,
  X,
  ChevronDown,
  List,
  LayoutGrid,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import rawData from "../../data/450DSA.json";

// ── Parse DSA data ────────────────────────────────────────────────────────────
const ALL_PROBLEMS = (() => {
  try {
    const sheet = rawData["Sheet1"] || [];
    return sheet
      .filter((p) => p["Problem: "] && p["Topic:"])
      .map((p, i) => ({
        id: `dsa-${i}`,
        title: (p["Problem: "] || "").trim(),
        topic: (p["Topic:"] || "").trim(),
        url: p["URL"] || "",
        difficulty: assignDifficulty(i, (p["Topic:"] || "").trim()),
      }));
  } catch {
    return [];
  }
})();

function assignDifficulty(idx, topic) {
  // Deterministic difficulty spread: ~40% easy, 40% medium, 20% hard
  const hard = ["Dynamic Programming", "Graph", "Trie", "BackTracking"];
  const easy = ["Array", "String", "Bit Manipulation"];
  if (hard.includes(topic)) {
    if (idx % 5 === 0) return "Easy";
    if (idx % 3 === 0) return "Hard";
    return "Medium";
  }
  if (easy.includes(topic)) {
    if (idx % 4 === 0) return "Medium";
    return "Easy";
  }
  if (idx % 5 === 0) return "Hard";
  if (idx % 2 === 0) return "Medium";
  return "Easy";
}

const TOPICS = ["All Topics", ...Array.from(new Set(ALL_PROBLEMS.map((p) => p.topic))).sort()];
const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

const DIFF_COLOR = { Easy: "success", Medium: "warning", Hard: "danger" };
const DIFF_TEXT = { Easy: "text-green-600", Medium: "text-yellow-600", Hard: "text-red-600" };

const STARTER_CODE = {
  javascript: `// Write your solution here
function solution() {
  // Your code
}`,
  python: `# Write your solution here
def solution():
    # Your code
    pass`,
  java: `// Write your solution here
public class Solution {
    public static void main(String[] args) {
        // Your code
    }
}`,
  "cpp": `// Write your solution here
#include <bits/stdc++.h>
using namespace std;

int main() {
    // Your code
    return 0;
}`,
  c: `// Write your solution here
#include <stdio.h>

int main() {
    // Your code
    return 0;
}`,
};

const STORAGE_KEY = "prepai_solved_problems";

const getSolved = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const saveSolved = (set) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
};

// ── Component ─────────────────────────────────────────────────────────────────
export const CodingPractice = () => {
  const [topic, setTopic] = useState("All Topics");
  const [difficulty, setDifficulty] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [code, setCode] = useState(STARTER_CODE["javascript"]);
  const [language, setLanguage] = useState("javascript");
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(getSolved);
  const [view, setView] = useState("list"); // list | sheet
  const [showFilters, setShowFilters] = useState(false);

  // ── Filter problems ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return ALL_PROBLEMS.filter((p) => {
      const matchTopic = topic === "All Topics" || p.topic === topic;
      const matchDiff = difficulty === "All" || p.difficulty === difficulty;
      const matchSearch =
        !search || p.title.toLowerCase().includes(search.toLowerCase());
      return matchTopic && matchDiff && matchSearch;
    });
  }, [topic, difficulty, search]);

  // Topic counts
  const topicCounts = useMemo(() => {
    const counts = {};
    ALL_PROBLEMS.forEach((p) => {
      counts[p.topic] = (counts[p.topic] || 0) + 1;
    });
    return counts;
  }, []);

  // Stats
  const stats = useMemo(() => {
    const solvedArr = ALL_PROBLEMS.filter((p) => solved.has(p.id));
    return {
      total: ALL_PROBLEMS.length,
      solvedTotal: solvedArr.length,
      easy: ALL_PROBLEMS.filter((p) => p.difficulty === "Easy").length,
      medium: ALL_PROBLEMS.filter((p) => p.difficulty === "Medium").length,
      hard: ALL_PROBLEMS.filter((p) => p.difficulty === "Hard").length,
      solvedEasy: solvedArr.filter((p) => p.difficulty === "Easy").length,
      solvedMedium: solvedArr.filter((p) => p.difficulty === "Medium").length,
      solvedHard: solvedArr.filter((p) => p.difficulty === "Hard").length,
    };
  }, [solved]);

  // Select first filtered problem on filter change
  useEffect(() => {
    if (filtered.length > 0 && !filtered.find((p) => p.id === selectedProblem?.id)) {
      setSelectedProblem(filtered[0]);
    }
  }, [filtered]);

  // Reset code when language changes
  useEffect(() => {
    setCode(STARTER_CODE[language] || "// Write your code here");
  }, [language]);

  const toggleSolved = useCallback(
    (id, e) => {
      e.stopPropagation();
      setSolved((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveSolved(next);
        return next;
      });
    },
    []
  );

  const handleRunCode = async () => {
    setRunning(true);
    setOutput("");
    try {
      // Use Judge0 public API (free tier)
      const langMap = {
        javascript: 63,
        python: 71,
        java: 62,
        cpp: 54,
        c: 50,
      };
      const langId = langMap[language] || 63;
      const encoded = {
        source_code: btoa(unescape(encodeURIComponent(code))),
        language_id: langId,
        stdin: btoa(unescape(encodeURIComponent(customInput))),
      };

      const submitRes = await fetch(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": process.env.REACT_APP_JUDGE0_KEY || "demo",
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
          body: JSON.stringify(encoded),
        }
      );

      if (!submitRes.ok) throw new Error("Judge0 unavailable");
      const result = await submitRes.json();
      const stdout = result.stdout
        ? decodeURIComponent(escape(atob(result.stdout)))
        : "";
      const stderr = result.stderr
        ? decodeURIComponent(escape(atob(result.stderr)))
        : "";
      const compileOut = result.compile_output
        ? decodeURIComponent(escape(atob(result.compile_output)))
        : "";

      setOutput(
        stdout ||
          stderr ||
          compileOut ||
          `Status: ${result.status?.description || "Unknown"}`
      );
      if (stderr || compileOut) toast.error("Errors in output");
      else toast.success("Code executed!");
    } catch {
      // Fallback: browser-side JS execution
      if (language === "javascript") {
        try {
          const logs = [];
          const fakeConsole = { log: (...a) => logs.push(a.map(String).join(" ")) };
          // eslint-disable-next-line no-new-func
          const fn = new Function("console", code);
          fn(fakeConsole);
          setOutput(logs.join("\n") || "(no output)");
          toast.success("Code executed (browser JS)!");
        } catch (err) {
          setOutput(`Error: ${err.message}`);
          toast.error("Runtime error");
        }
      } else {
        setOutput(
          "⚠️ Online execution requires Judge0 API key.\n" +
            "Set REACT_APP_JUDGE0_KEY in your .env file.\n\n" +
            "For JavaScript, browser execution is available without an API key."
        );
        toast.error("Execution service unavailable");
      }
    } finally {
      setRunning(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // ── Sheet view (topic groups) ─────────────────────────────────────────────
  const SheetView = () => {
    const grouped = useMemo(() => {
      const g = {};
      filtered.forEach((p) => {
        if (!g[p.topic]) g[p.topic] = [];
        g[p.topic].push(p);
      });
      return g;
    }, []);

    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([topicName, problems]) => {
          const solvedInTopic = problems.filter((p) => solved.has(p.id)).length;
          return (
            <Card key={topicName} className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-900 dark:text-white">{topicName}</h3>
                  <Badge variant="primary">{problems.length} problems</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {solvedInTopic}/{problems.length} solved
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {problems.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => toggleSolved(p.id, e)}
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                          solved.has(p.id)
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 dark:border-gray-600 hover:border-green-400"
                        }`}
                      >
                        {solved.has(p.id) && (
                          <CheckCircle className="w-full h-full text-white" />
                        )}
                      </button>
                      <span
                        className={`text-sm font-medium truncate ${
                          solved.has(p.id)
                            ? "line-through text-gray-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {p.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={DIFF_COLOR[p.difficulty]} className="text-xs">
                        {p.difficulty}
                      </Badge>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-purple-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hidden group-hover:flex text-xs py-1 px-2"
                        onClick={() => {
                          setSelectedProblem(p);
                          setView("list");
                        }}
                      >
                        Solve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const activeProblem = selectedProblem || filtered[0] || ALL_PROBLEMS[0];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 gap-4 flex-wrap">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats.solvedTotal}/{stats.total} Solved
              </span>
              <span className={DIFF_TEXT["Easy"]}>{stats.solvedEasy}/{stats.easy} Easy</span>
              <span className={DIFF_TEXT["Medium"]}>{stats.solvedMedium}/{stats.medium} Medium</span>
              <span className={DIFF_TEXT["Hard"]}>{stats.solvedHard}/{stats.hard} Hard</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <form onSubmit={handleSearchSubmit} className="flex gap-1">
                <input
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (!e.target.value) setSearch("");
                  }}
                  placeholder="Search problems…"
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  <Search className="w-4 h-4" />
                </button>
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setSearchInput(""); }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Filters */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showFilters && (
                  <div className="absolute right-0 top-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-4 w-72">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Topic</p>
                    <div className="flex flex-wrap gap-1 mb-4 max-h-40 overflow-y-auto">
                      {TOPICS.map((t) => (
                        <button
                          key={t}
                          onClick={() => { setTopic(t); setShowFilters(false); }}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium transition ${
                            topic === t
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {t === "All Topics" ? "All" : t}
                          {t !== "All Topics" && (
                            <span className="ml-1 opacity-60">({topicCounts[t] || 0})</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Difficulty</p>
                    <div className="flex gap-1">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d}
                          onClick={() => { setDifficulty(d); setShowFilters(false); }}
                          className={`px-3 py-0.5 rounded-full text-xs font-medium transition ${
                            difficulty === d
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* View toggle */}
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={() => setView("list")}
                  className={`p-1.5 ${view === "list" ? "bg-purple-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("sheet")}
                  className={`p-1.5 ${view === "sheet" ? "bg-purple-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filters badge */}
          {(topic !== "All Topics" || difficulty !== "All" || search) && (
            <div className="flex items-center gap-2 px-6 py-2 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 text-sm flex-wrap">
              <span className="text-purple-700 dark:text-purple-300 font-medium">Filters:</span>
              {topic !== "All Topics" && (
                <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-800/40 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs">
                  {topic}
                  <button onClick={() => setTopic("All Topics")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {difficulty !== "All" && (
                <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-800/40 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs">
                  {difficulty}
                  <button onClick={() => setDifficulty("All")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {search && (
                <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-800/40 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs">
                  "{search}"
                  <button onClick={() => { setSearch(""); setSearchInput(""); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              <span className="text-purple-600 dark:text-purple-400 ml-auto">{filtered.length} problems</span>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            {view === "sheet" ? (
              <div className="h-full overflow-y-auto p-6">
                <SheetView />
              </div>
            ) : (
              <div className="h-full flex">
                {/* Problem List */}
                <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
                  <div className="p-3 space-y-1">
                    {filtered.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No problems found</p>
                        <button
                          onClick={() => { setTopic("All Topics"); setDifficulty("All"); setSearch(""); setSearchInput(""); }}
                          className="text-purple-600 text-sm mt-2 hover:underline"
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                      filtered.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProblem(p)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                            activeProblem?.id === p.id
                              ? "bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-600"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <button
                            onClick={(e) => toggleSolved(p.id, e)}
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                              solved.has(p.id)
                                ? "bg-green-500 border-green-500"
                                : "border-gray-300 dark:border-gray-500"
                            }`}
                          />
                          <span className={`text-xs flex-1 truncate font-medium ${
                            solved.has(p.id) ? "line-through text-gray-400" : "text-gray-900 dark:text-white"
                          }`}>
                            {p.title}
                          </span>
                          <Badge variant={DIFF_COLOR[p.difficulty]} className="text-xs py-0 px-1.5 flex-shrink-0">
                            {p.difficulty[0]}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Editor + Problem Detail */}
                {activeProblem && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Problem header */}
                    <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{activeProblem.title}</h2>
                          <Badge variant={DIFF_COLOR[activeProblem.difficulty]}>{activeProblem.difficulty}</Badge>
                          {solved.has(activeProblem.id) && (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Solved
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <BookOpen className="w-4 h-4" />
                          <span>{activeProblem.topic}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                        >
                          {Object.keys(STARTER_CODE).map((l) => (
                            <option key={l} value={l}>{l.toUpperCase()}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setEditorTheme(editorTheme === "vs-dark" ? "light" : "vs-dark")}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {editorTheme === "vs-dark" ? "☀️ Light" : "🌙 Dark"}
                        </button>
                        {activeProblem.url && (
                          <a
                            href={activeProblem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" /> Open Problem
                          </a>
                        )}
                        <button
                          onClick={(e) => toggleSolved(activeProblem.id, e)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            solved.has(activeProblem.id)
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {solved.has(activeProblem.id) ? "Mark Unsolved" : "Mark Solved"}
                        </button>
                      </div>
                    </div>

                    {/* Editor + Output */}
                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                      {/* Code Editor */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-xs">
                          <span>Code Editor</span>
                          <button
                            onClick={() => setCode(STARTER_CODE[language] || "")}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset
                          </button>
                        </div>
                        <div className="flex-1">
                          <Editor
                            height="100%"
                            language={language === "cpp" ? "cpp" : language}
                            value={code}
                            onChange={(v) => setCode(v || "")}
                            theme={editorTheme}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              wordWrap: "on",
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                            }}
                          />
                        </div>
                      </div>

                      {/* Input + Output Panel */}
                      <div className="w-full lg:w-80 flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                            Custom Input (stdin)
                          </label>
                          <textarea
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="Enter input..."
                            className="w-full h-20 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none font-mono"
                          />
                        </div>
                        <div className="flex gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                          <Button
                            onClick={handleRunCode}
                            disabled={running}
                            className="flex-1 flex items-center justify-center gap-2 py-2"
                          >
                            {running ? <Spinner size="sm" /> : <Play className="w-4 h-4" />}
                            Run Code
                          </Button>
                        </div>
                        <div className="flex-1 p-3 overflow-y-auto">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                            Output
                          </label>
                          <pre className="text-sm text-gray-900 dark:text-green-400 font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-lg p-3 min-h-20 border border-gray-200 dark:border-gray-700">
                            {running ? "Running..." : output || "// Output will appear here"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
