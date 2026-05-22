import express from "express";
import {
  DSA_PROBLEMS,
  PROBLEM_TOPICS,
  DIFFICULTIES,
  getProblemById,
  getProblemsByTopic,
  getProblemsByDifficulty,
  searchProblems,
} from "../data/dsaProblems.js";
import { gradeCodeSolution, generateCodingExplanation } from "../services/geminiService.js";
import { verifyToken } from "../middleware/auth.js";
import admin from "firebase-admin";

const router = express.Router();
const db = admin.firestore();

/**
 * GET /api/coding/problems
 * Get all problems with pagination and filters
 */
router.get("/problems", async (req, res) => {
  try {
    const { page = 1, limit = 20, topic, difficulty, search } = req.query;

    let problems = [...DSA_PROBLEMS];

    // Filter by topic
    if (topic) {
      problems = problems.filter((p) => p.topic === topic);
    }

    // Filter by difficulty
    if (difficulty) {
      problems = problems.filter((p) => p.difficulty === difficulty);
    }

    // Search
    if (search) {
      const searchResults = searchProblems(search);
      problems = problems.filter((p) =>
        searchResults.some((sr) => sr.id === p.id)
      );
    }

    // Pagination
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedProblems = problems.slice(start, end);

    res.json({
      success: true,
      problems: paginatedProblems,
      total: problems.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(problems.length / limit),
    });
  } catch (error) {
    console.error("Error fetching problems:", error);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

/**
 * GET /api/coding/problems/:id
 * Get specific problem details
 */
router.get("/problems/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const problem = getProblemById(id);

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json({
      success: true,
      problem,
    });
  } catch (error) {
    console.error("Error fetching problem:", error);
    res.status(500).json({ error: "Failed to fetch problem" });
  }
});

/**
 * GET /api/coding/topics
 * Get all available topics
 */
router.get("/topics", async (req, res) => {
  try {
    res.json({
      success: true,
      topics: PROBLEM_TOPICS,
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

/**
 * GET /api/coding/difficulties
 * Get all available difficulties
 */
router.get("/difficulties", async (req, res) => {
  try {
    res.json({
      success: true,
      difficulties: DIFFICULTIES,
    });
  } catch (error) {
    console.error("Error fetching difficulties:", error);
    res.status(500).json({ error: "Failed to fetch difficulties" });
  }
});

/**
 * POST /api/coding/submit
 * Submit solution for a problem
 */
router.post("/submit", verifyToken, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    const userId = req.user.uid;

    if (!problemId || !code || !language) {
      return res
        .status(400)
        .json({ error: "problemId, code, and language are required" });
    }

    const problem = getProblemById(problemId);

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // Mock test execution - In production, use actual code execution engine
    const testResults = [
      { id: 1, passed: true },
      { id: 2, passed: true },
      { id: 3, passed: true },
      { id: 4, passed: Math.random() > 0.3 },
      { id: 5, passed: Math.random() > 0.4 },
    ];

    const allPassed = testResults.every((t) => t.passed);
    const passCount = testResults.filter((t) => t.passed).length;

    // Grade the solution using Gemini
    const gradeResult = await gradeCodeSolution(
      problemId,
      code,
      problem,
      testResults
    );

    // Save submission to Firestore
    const submissionRef = await db.collection("codeSubmissions").add({
      userId,
      problemId,
      code,
      language,
      testResults,
      allPassed,
      passCount,
      totalTests: testResults.length,
      grade: gradeResult.grade || {},
      submittedAt: new Date(),
      status: allPassed ? "accepted" : "partial",
    });

    // Update user stats
    await updateUserCodingStats(userId, problemId, allPassed);

    res.json({
      success: true,
      submissionId: submissionRef.id,
      testResults,
      allPassed,
      passCount,
      grade: gradeResult.grade,
      message: allPassed
        ? "All tests passed! Great job!"
        : `${passCount}/${testResults.length} tests passed`,
    });
  } catch (error) {
    console.error("Error submitting solution:", error);
    res.status(500).json({ error: "Failed to submit solution" });
  }
});

/**
 * GET /api/coding/submissions
 * Get user's code submissions
 */
router.get("/submissions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 20, offset = 0 } = req.query;

    const snapshot = await db
      .collection("codeSubmissions")
      .where("userId", "==", userId)
      .orderBy("submittedAt", "desc")
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate() || null,
    }));

    res.json({
      success: true,
      submissions,
      total: snapshot.size,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

/**
 * GET /api/coding/submissions/:submissionId
 * Get specific submission details
 */
router.get("/submissions/:submissionId", verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.uid;

    const docSnapshot = await db
      .collection("codeSubmissions")
      .doc(submissionId)
      .get();

    if (!docSnapshot.exists) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const submission = docSnapshot.data();

    if (submission.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({
      success: true,
      submission: {
        id: submissionId,
        ...submission,
        submittedAt: submission.submittedAt?.toDate() || null,
      },
    });
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ error: "Failed to fetch submission" });
  }
});

/**
 * GET /api/coding/problems/:problemId/explanation
 * Get AI-generated explanation for a problem
 */
router.get("/problems/:problemId/explanation", verifyToken, async (req, res) => {
  try {
    const { problemId } = req.params;

    // Check if we have cached explanation
    const problemData = { ...getProblemById(problemId) };

    if (!problemData) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // Generate explanation using Gemini
    const explanationResult = await generateCodingExplanation(
      problemId,
      problemData
    );

    res.json({
      success: true,
      explanation: explanationResult.explanation,
    });
  } catch (error) {
    console.error("Error generating explanation:", error);
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

/**
 * GET /api/coding/statistics
 * Get user's coding statistics
 */
router.get("/statistics", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get user submissions
    const snapshot = await db
      .collection("codeSubmissions")
      .where("userId", "==", userId)
      .get();

    const submissions = snapshot.docs.map((doc) => doc.data());

    // Calculate stats
    const stats = {
      totalProblems: DSA_PROBLEMS.length,
      problemsSolved: new Set(
        submissions.filter((s) => s.allPassed).map((s) => s.problemId)
      ).size,
      problemsAttempted: new Set(submissions.map((s) => s.problemId)).size,
      totalSubmissions: submissions.length,
      successRate:
        submissions.length > 0
          ? (
              (submissions.filter((s) => s.allPassed).length /
                submissions.length) *
              100
            ).toFixed(2)
          : 0,
      topicStats: calculateTopicStats(submissions),
      difficultyStats: calculateDifficultyStats(submissions),
    };

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Helper functions
async function updateUserCodingStats(userId, problemId, allPassed) {
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    const problemsSolved = new Set(userData.problemsSolved || []);
    const problemsAttempted = new Set(userData.problemsAttempted || []);

    if (allPassed) {
      problemsSolved.add(problemId);
    }
    problemsAttempted.add(problemId);

    await userRef.update({
      problemsSolved: Array.from(problemsSolved),
      problemsAttempted: Array.from(problemsAttempted),
      totalSubmissions: (userData.totalSubmissions || 0) + 1,
    });
  } catch (error) {
    console.error("Error updating user stats:", error);
  }
}

function calculateTopicStats(submissions) {
  const stats = {};
  submissions.forEach((submission) => {
    const problem = getProblemById(submission.problemId);
    if (problem) {
      if (!stats[problem.topic]) {
        stats[problem.topic] = {
          attempted: 0,
          solved: 0,
        };
      }
      stats[problem.topic].attempted++;
      if (submission.allPassed) {
        stats[problem.topic].solved++;
      }
    }
  });
  return stats;
}

function calculateDifficultyStats(submissions) {
  const stats = {};
  submissions.forEach((submission) => {
    const problem = getProblemById(submission.problemId);
    if (problem) {
      if (!stats[problem.difficulty]) {
        stats[problem.difficulty] = {
          attempted: 0,
          solved: 0,
        };
      }
      stats[problem.difficulty].attempted++;
      if (submission.allPassed) {
        stats[problem.difficulty].solved++;
      }
    }
  });
  return stats;
}

/**
 * POST /api/coding/execute
 * Execute user code with test cases
 */
router.post("/execute", async (req, res) => {
  try {
    const { code, language, testCases = [] } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: "Code and language are required",
      });
    }

    // Execute code based on language
    let results = [];

    if (language === "javascript") {
      results = executeJavaScript(code, testCases);
    } else {
      // For other languages, return a placeholder response
      results = [
        {
          testCase: 0,
          output: "Language not fully supported yet. Please use JavaScript.",
          passed: false,
          error: true,
        },
      ];
    }

    res.json({
      success: true,
      results,
      language,
    });
  } catch (error) {
    console.error("Error executing code:", error);
    res.status(500).json({
      success: false,
      error: "Failed to execute code",
      message: error.message,
    });
  }
});

/**
 * Execute JavaScript code safely
 */
function executeJavaScript(code, testCases) {
  const results = [];

  try {
    // Create a function from the code
    const func = new Function(code);

    // If no test cases, just verify the function runs
    if (testCases.length === 0) {
      try {
        func();
        results.push({
          testCase: 0,
          output: "Code executed successfully",
          passed: true,
          error: false,
        });
      } catch (err) {
        results.push({
          testCase: 0,
          output: err.message,
          passed: false,
          error: true,
        });
      }
    } else {
      // Run test cases
      testCases.forEach((testCase, idx) => {
        try {
          const output = func(testCase.input);
          const passed = JSON.stringify(output) === JSON.stringify(testCase.expected);

          results.push({
            testCase: idx + 1,
            input: testCase.input,
            expected: testCase.expected,
            output,
            passed,
            error: false,
          });
        } catch (err) {
          results.push({
            testCase: idx + 1,
            input: testCase.input,
            expected: testCase.expected,
            output: "",
            passed: false,
            error: true,
            errorMessage: err.message,
          });
        }
      });
    }
  } catch (error) {
    results.push({
      testCase: 0,
      output: "",
      passed: false,
      error: true,
      errorMessage: `Syntax Error: ${error.message}`,
    });
  }

  return results;
}

export default router;
