import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Button, Container, Badge, Spinner } from "../../components/ui";
import { CheckCircle, Play, Save, RotateCcw, Search } from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

const FALLBACK_PROBLEMS = [
  {
    id: "array-001",
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays",
    description: "Find two numbers that add up to a target.",
    starterCode: "function twoSum(nums, target) {\n  // Your code here\n  return [];\n}",
    language: "javascript",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
  },
  {
    id: "array-002",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Arrays",
    description: "Find the maximum profit from a single buy and sell transaction.",
    starterCode: "function maxProfit(prices) {\n  // Your code here\n  return 0;\n}",
    language: "javascript",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5" },
      { input: "prices = [7,6,4,3,1]", output: "0" },
    ],
  },
];

export const CodingPractice = () => {
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState(["all"]);
  const [difficulties, setDifficulties] = useState(["all"]);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchTopics();
    fetchDifficulties();
    fetchProblems();
  }, []);

  useEffect(() => {
    if (problems.length > 0) {
      const persisted = selectedProblem && problems.find((p) => p.id === selectedProblem.id);
      setSelectedProblem(persisted || problems[0]);
    } else if (!selectedProblem) {
      setSelectedProblem(FALLBACK_PROBLEMS[0]);
    }
  }, [problems]);

  useEffect(() => {
    if (selectedProblem) {
      setCode(selectedProblem.starterCode || selectedProblem.defaultCode || "");
      setLanguage(selectedProblem.language || "javascript");
      setTestResults(null);
    }
  }, [selectedProblem]);

  const fetchProblems = async ({ topic, difficulty, search } = {}) => {
    try {
      setLoading(true);
      const params = {
        topic: topic ?? (selectedTopic !== "all" ? selectedTopic : undefined),
        difficulty:
          difficulty ??
          (selectedDifficulty !== "all" ? selectedDifficulty : undefined),
        search: search ?? (searchQuery || undefined),
        limit: 100,
      };

      const res = await apiClient.get("/api/coding/problems", { params });
      const list = res.data.problems || [];
      setProblems(list);
      if (list.length === 0) {
        setSelectedProblem(FALLBACK_PROBLEMS[0]);
      }
    } catch (error) {
      console.error("Error fetching coding problems:", error);
      setProblems(FALLBACK_PROBLEMS);
      if (!selectedProblem) {
        setSelectedProblem(FALLBACK_PROBLEMS[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await apiClient.get("/api/coding/topics");
      setTopics(["all", ...(res.data.topics || [])]);
    } catch (error) {
      console.error("Error fetching topics:", error);
      setTopics(["all", "Arrays", "Strings", "Trees", "Dynamic Programming"]);
    }
  };

  const fetchDifficulties = async () => {
    try {
      const res = await apiClient.get("/api/coding/difficulties");
      setDifficulties(["all", ...(res.data.difficulties || [])]);
    } catch (error) {
      console.error("Error fetching difficulties:", error);
      setDifficulties(["all", "Easy", "Medium", "Hard"]);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await apiClient.get("/api/coding/submissions");
      setSubmissions(res.data.submissions || res.data.data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    fetchProblems({ search: searchQuery, topic: selectedTopic, difficulty: selectedDifficulty });
  };

  const handleSelectProblem = (problem) => {
    setSelectedProblem(problem);
  };

  const handleRunCode = async () => {
    setLoading(true);
    try {
      const examples = selectedProblem.examples || selectedProblem.testCases || [];
      
      // Prepare test cases for execution
      const testCases = examples.map((example) => ({
        input: example.input || example.description || "",
        expected: example.output || example.expected || "",
      }));

      // Execute code on backend
      const res = await apiClient.post("/api/coding/execute", {
        code,
        language,
        testCases,
      });

      if (res.data.success) {
        setTestResults(res.data.results);
        const passedCount = res.data.results.filter((r) => r.passed).length;
        const totalCount = res.data.results.length;
        
        if (passedCount === totalCount) {
          toast.success(`All ${totalCount} test cases passed!`);
        } else {
          toast.success(`${passedCount}/${totalCount} test cases passed`);
        }
      } else {
        toast.error(res.data.error || "Execution failed");
      }
    } catch (error) {
      console.error("Execution error:", error);
      toast.error("Error running code");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post("/api/coding/submit", {
        problemId: selectedProblem.id,
        code,
        language,
      });
      if (res.data.success) {
        toast.success("Solution submitted!");
        fetchSubmissions();
      } else {
        toast.error(res.data.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Error submitting code");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "success";
      case "Medium":
        return "warning";
      case "Hard":
        return "danger";
      default:
        return "default";
    }
  };

  const activeProblem = selectedProblem || FALLBACK_PROBLEMS[0];
  const examples = activeProblem.examples || activeProblem.testCases || [];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col md:flex-row">
            <div className="w-full md:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
              <div className="p-4 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    Practice Problems
                  </h2>
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search problems"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none"
                    />
                    <Button type="submit" variant="outline" className="px-3 py-2">
                      <Search className="w-4 h-4" />
                    </Button>
                  </form>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Topic</h3>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => {
                          setSelectedTopic(topic);
                          fetchProblems({ topic, difficulty: selectedDifficulty, search: searchQuery });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          selectedTopic === topic
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {topic === "all" ? "All Topics" : topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Difficulty</h3>
                  <div className="flex flex-wrap gap-2">
                    {difficulties.map((diff) => (
                      <button
                        key={diff}
                        onClick={() => {
                          setSelectedDifficulty(diff);
                          fetchProblems({ topic: selectedTopic, difficulty: diff, search: searchQuery });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          selectedDifficulty === diff
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {diff === "all" ? "All" : diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {(problems.length ? problems : FALLBACK_PROBLEMS).map((problem) => (
                  <button
                    key={problem.id}
                    onClick={() => handleSelectProblem(problem)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeProblem.id === problem.id
                        ? "bg-purple-100 dark:bg-purple-900/20 border-l-4 border-purple-600"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {problem.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {problem.description}
                        </p>
                      </div>
                      <Badge variant={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <Container className="flex-1 flex flex-col py-6">
                <div className="mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {activeProblem.title}
                      </h1>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{activeProblem.topic}</span>
                        <span>•</span>
                        <span>{activeProblem.difficulty}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {problems.length || FALLBACK_PROBLEMS.length} problems
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{activeProblem.description}</p>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                  <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Code Editor</h3>
                      <button
                        onClick={() => setCode(activeProblem.starterCode || activeProblem.defaultCode || "")}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 flex items-center space-x-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    </div>
                    <Card className="flex-1 p-0 overflow-hidden">
                      <Editor
                        height="100%"
                        language={language}
                        value={code}
                        onChange={(value) => setCode(value || "")}
                        theme="vs-dark"
                        options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on" }}
                      />
                    </Card>

                    <div className="flex gap-3 mt-4">
                      <Button onClick={handleRunCode} disabled={loading} className="flex items-center space-x-2">
                        {loading ? <Spinner size="sm" /> : <Play className="w-4 h-4" />}
                        <span>Run Code</span>
                      </Button>
                      <Button onClick={handleSubmit} disabled={loading} variant="gradient" className="flex items-center space-x-2">
                        {loading ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                        <span>Submit</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col overflow-hidden">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Examples</h3>
                    <Card className="flex-1 overflow-y-auto">
                      <div className="space-y-3 p-4">
                        {examples.length > 0 ? (
                          examples.map((example, index) => {
                            const result = testResults && testResults[index];
                            return (
                              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-900 dark:text-white">Example {index + 1}</span>
                                  {result && (
                                    <CheckCircle className={`w-5 h-5 ${result.passed ? "text-green-500" : "text-red-500"}`} />
                                  )}
                                </div>
                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                  <p>
                                    <span className="font-semibold text-gray-900 dark:text-white">Input:</span> {example.input}
                                  </p>
                                  <p>
                                    <span className="font-semibold text-gray-900 dark:text-white">Expected:</span> {example.output || example.expected}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No example cases available for this problem.</p>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </Container>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
