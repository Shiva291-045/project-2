import axios from "axios";

// Piston API Configuration
const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_CONFIG = {
  javascript: { language: "javascript", version: "18.15.0", filename: "main.js" },
  js: { language: "javascript", version: "18.15.0", filename: "main.js" },
  python: { language: "python", version: "3.10.0", filename: "main.py" },
  python3: { language: "python", version: "3.10.0", filename: "main.py" },
  py: { language: "python", version: "3.10.0", filename: "main.py" },
  c: { language: "c", version: "10.2.0", filename: "main.c" },
  cpp: { language: "cpp", version: "10.2.0", filename: "main.cpp" },
  "c++": { language: "cpp", version: "10.2.0", filename: "main.cpp" },
  java: { language: "java", version: "15.0.2", filename: "Main.java" }
};

/**
 * Execute code using sandboxed Piston API
 * @param {string} code 
 * @param {string} language 
 * @param {string} stdin 
 * @returns {Promise<object>} Execution results containing stdout, stderr, run code, etc.
 */
export const executeCode = async (code, language, stdin = "") => {
  const normLang = language.toLowerCase();
  const config = LANGUAGE_CONFIG[normLang] || LANGUAGE_CONFIG.javascript;

  try {
    const payload = {
      language: config.language,
      version: config.version,
      files: [
        {
          name: config.filename,
          content: code
        }
      ],
      stdin: stdin
    };

    const response = await axios.post(PISTON_URL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000 // 10s execution limit
    });

    const runResult = response.data.run;
    return {
      success: true,
      stdout: runResult.stdout || "",
      stderr: runResult.stderr || "",
      code: runResult.code,
      signal: runResult.signal,
      output: runResult.output || ""
    };
  } catch (error) {
    console.error("Error executing code via Piston:", error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to execute code",
      stdout: "",
      stderr: error.message || "",
      code: -1,
      output: error.message || ""
    };
  }
};

/**
 * Execute multiple test cases for a piece of code
 * @param {string} code 
 * @param {string} language 
 * @param {Array<{input: string, expected: string}>} testCases 
 * @returns {Promise<Array<object>>} Test case results
 */
export const executeTestCases = async (code, language, testCases = []) => {
  if (!testCases || testCases.length === 0) {
    // Single execution run if no test cases are specified
    const result = await executeCode(code, language, "");
    return [{
      testCase: 0,
      output: result.output,
      passed: result.code === 0 && !result.stderr,
      error: !!result.stderr,
      errorMessage: result.stderr
    }];
  }

  // Run all test cases in parallel
  const promises = testCases.map(async (tc, idx) => {
    try {
      // Piston run with test case input as stdin
      const result = await executeCode(code, language, tc.input);
      
      const cleanOutput = (result.stdout || "").trim();
      const cleanExpected = (tc.expected || "").trim();
      
      // Basic match checker: can be string comparison, array comparison or loose comparison
      const passed = result.code === 0 && !result.stderr && (cleanOutput === cleanExpected || matchOutputs(cleanOutput, cleanExpected));

      return {
        testCase: idx + 1,
        input: tc.input,
        expected: tc.expected,
        output: result.output,
        passed,
        error: !!result.stderr || result.code !== 0,
        errorMessage: result.stderr
      };
    } catch (err) {
      return {
        testCase: idx + 1,
        input: tc.input,
        expected: tc.expected,
        output: "",
        passed: false,
        error: true,
        errorMessage: err.message
      };
    }
  });

  return Promise.all(promises);
};

// Helper to compare outputs loosely (e.g. ignoring extra whitespaces or brackets)
function matchOutputs(actual, expected) {
  const norm = (s) => s.replace(/\s+/g, " ").replace(/[\[\],]/g, "").trim().toLowerCase();
  return norm(actual) === norm(expected);
}
