import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

/**
 * Start a new interview session
 */
export const startInterview = async (interviewType, userProfile) => {
  const systemPrompt = getSystemPrompt(interviewType, userProfile);
  
  try {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are starting a new interview session." }],
        },
        {
          role: "model",
          parts: [{ text: systemPrompt }],
        },
      ],
    });

    // Generate opening question
    const interviewStart = await chat.sendMessage(
      `Start a ${interviewType} interview. Ask the candidate a thoughtful opening question.`
    );

    return {
      success: true,
      message: interviewStart.response.text(),
      sessionId: generateSessionId(),
    };
  } catch (error) {
    console.error("Error starting interview:", error);
    return {
      success: false,
      error: "Failed to start interview. Please try again.",
    };
  }
};

/**
 * Get AI response to user's interview answer
 */
export const getInterviewResponse = async (
  userMessage,
  conversationHistory,
  interviewType,
  userProfile
) => {
  try {
    const systemPrompt = getSystemPrompt(interviewType, userProfile);

    // Prepare conversation history for the chat
    const formattedHistory = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Add system prompt at the beginning if not already present
    if (formattedHistory.length === 0) {
      formattedHistory.unshift({
        role: "user",
        parts: [{ text: "Initialize as interview coach" }],
      });
      formattedHistory.push({
        role: "model",
        parts: [{ text: systemPrompt }],
      });
    }

    const chat = model.startChat({
      history: formattedHistory,
    });

    // Get response from AI
    const response = await chat.sendMessage(userMessage);
    const aiMessage = response.response.text();

    // Extract feedback and score from response
    const feedback = extractFeedback(aiMessage);

    return {
      success: true,
      message: aiMessage,
      feedback,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting interview response:", error);
    return {
      success: false,
      error: "Failed to process your answer. Please try again.",
      message: "Could not generate response from AI",
    };
  }
};

/**
 * Analyze interview performance
 */
export const analyzeInterviewPerformance = async (
  conversationHistory,
  interviewType
) => {
  try {
    const analysisPrompt = `
Based on this interview conversation, provide a detailed performance analysis:

Interview Type: ${interviewType}

${conversationHistory.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n\n")}

Provide analysis in JSON format:
{
  "overallScore": 0-100,
  "technicalAccuracy": 0-100,
  "clarity": 0-100,
  "completeness": 0-100,
  "communication": 0-100,
  "confidence": 0-100,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvements": ["improvement1", "improvement2"],
  "summary": "Brief summary of performance"
}`;

    const response = await model.generateContent(analysisPrompt);
    const analysisText = response.response.text();

    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          success: true,
          analysis: JSON.parse(jsonMatch[0]),
        };
      }
    } catch (parseError) {
      console.error("Error parsing analysis JSON:", parseError);
    }

    return {
      success: true,
      analysis: {
        overallScore: 75,
        summary: analysisText,
      },
    };
  } catch (error) {
    console.error("Error analyzing interview:", error);
    return {
      success: false,
      error: "Failed to analyze interview performance",
    };
  }
};

/**
 * Generate coding problem explanation
 */
export const generateCodingExplanation = async (problemId, problemData) => {
  try {
    const prompt = `
Provide a detailed explanation for this coding problem:

Title: ${problemData.title}
Difficulty: ${problemData.difficulty}
Description: ${problemData.description}

Provide:
1. Problem Understanding
2. Approach & Strategy
3. Algorithm Explanation
4. Time & Space Complexity Analysis
5. Edge Cases to Consider
6. Common Mistakes

Format as clear, educational content.`;

    const response = await model.generateContent(prompt);
    return {
      success: true,
      explanation: response.response.text(),
    };
  } catch (error) {
    console.error("Error generating explanation:", error);
    return {
      success: false,
      error: "Failed to generate explanation",
    };
  }
};

/**
 * Grade coding solution
 */
export const gradeCodeSolution = async (
  problemId,
  userCode,
  problemData,
  testResults
) => {
  try {
    const gradePrompt = `
Grade this coding solution:

Problem: ${problemData.title}
User's Code:
\`\`\`
${userCode}
\`\`\`

Test Results:
${testResults.map((r) => `Test ${r.id}: ${r.passed ? "PASS" : "FAIL"}`).join("\n")}

Provide feedback in JSON format:
{
  "score": 0-100,
  "codeQuality": 0-100,
  "efficiency": 0-100,
  "correctness": 0-100,
  "feedback": "Constructive feedback",
  "improvements": ["improvement1", "improvement2"],
  "learningPoints": ["point1", "point2"]
}`;

    const response = await model.generateContent(gradePrompt);
    const gradeText = response.response.text();

    try {
      const jsonMatch = gradeText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          success: true,
          grade: JSON.parse(jsonMatch[0]),
        };
      }
    } catch (parseError) {
      console.error("Error parsing grade JSON:", parseError);
    }

    return {
      success: true,
      grade: {
        score: 75,
        feedback: gradeText,
      },
    };
  } catch (error) {
    console.error("Error grading solution:", error);
    return {
      success: false,
      error: "Failed to grade solution",
    };
  }
};

/**
 * Generate personalized interview questions
 */
export const generateCustomQuestions = async (
  targetRole,
  skills,
  experience,
  difficulty
) => {
  try {
    const prompt = `
Generate 5 relevant interview questions for:
- Target Role: ${targetRole}
- Skills: ${skills.join(", ")}
- Experience Level: ${experience}
- Difficulty: ${difficulty}

Return as JSON array:
[
  {
    "question": "Question text",
    "type": "technical|behavioral|system-design",
    "difficulty": "easy|medium|hard",
    "expectedPoints": ["point1", "point2"]
  }
]`;

    const response = await model.generateContent(prompt);
    const questionsText = response.response.text();

    try {
      const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return {
          success: true,
          questions: JSON.parse(jsonMatch[0]),
        };
      }
    } catch (parseError) {
      console.error("Error parsing questions JSON:", parseError);
    }

    return {
      success: false,
      error: "Failed to parse generated questions",
    };
  } catch (error) {
    console.error("Error generating questions:", error);
    return {
      success: false,
      error: "Failed to generate questions",
    };
  }
};

// ===== HELPER FUNCTIONS =====

function getSystemPrompt(interviewType, userProfile) {
  const basePrompt = `You are an expert technical interview coach with experience conducting interviews at top tech companies. Your role is to:
1. Ask clear, challenging questions appropriate for the ${interviewType} interview
2. Evaluate answers thoroughly based on technical accuracy, clarity, and communication
3. Provide specific feedback and actionable suggestions
4. Ask follow-up questions when needed
5. Maintain a professional yet encouraging tone`;

  const typeSpecificPrompts = {
    technical: `Focus on data structures, algorithms, problem-solving approach, and code optimization. Ask one question at a time and evaluate deeply.`,
    "system-design": `Focus on scalability, architecture, trade-offs, load balancing, caching, and database design. Guide the candidate through the design process.`,
    behavioral: `Focus on past experiences, conflict resolution, leadership, teamwork, and cultural fit. Ask STAR method questions.`,
    "mixed": `Mix both technical and behavioral questions to get a comprehensive assessment.`,
    "rapid-fire": `Ask quick technical questions in rapid succession to test breadth of knowledge.`,
    "project-based": `Ask about projects the candidate has built. Dig into technical decisions, challenges, and learnings.`,
  };

  const userContext = userProfile
    ? `
Candidate Context:
- Target Role: ${userProfile.targetRole}
- Skills: ${userProfile.skills?.join(", ") || "General"}
- Experience: ${userProfile.experience || "Not specified"}
- Focus Areas: ${userProfile.weakTopics?.join(", ") || "All areas"}`
    : "";

  return `${basePrompt}

${typeSpecificPrompts[interviewType] || typeSpecificPrompts.technical}

${userContext}

Keep responses concise but meaningful. After evaluating a few responses, provide a score of 1-10 for that answer.`;
}

function extractFeedback(aiMessage) {
  // Try to extract score from response
  const scoreMatch = aiMessage.match(/(?:score|rating)[:']?\s*(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

  return {
    message: aiMessage,
    score: score || 7,
    timestamp: new Date().toISOString(),
  };
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const generateResumeAnalysis = async (resumeText, jobDescription) => {
  try {
    const prompt = `You are an expert resume reviewer and ATS specialist.

Resume Content:
${resumeText}

Target Job Description:
${jobDescription}

Please provide:
1. ATS Score (0-100)
2. Top 5 Strengths
3. Top 5 Areas for Improvement
4. Extracted Skills
5. Missing Keywords

Format as JSON:
{
  "atsScore": 85,
  "strengths": ["..."],
  "improvements": ["..."],
  "skills": ["..."],
  "missingKeywords": ["..."]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      atsScore: 50,
      strengths: [],
      improvements: [],
      skills: [],
      missingKeywords: [],
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateCodingFeedback = async (code, problemDescription, language) => {
  try {
    const prompt = `You are an expert code reviewer.

Language: ${language}
Problem: ${problemDescription}
Code:
\`\`\`${language}
${code}
\`\`\`

Please review this code and provide:
1. Correctness Score (1-10)
2. Code Quality Score (1-10)
3. Identified Issues
4. Suggestions for Improvement
5. Time Complexity Analysis
6. Space Complexity Analysis

Format as JSON`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      correctness: 5,
      quality: 5,
      issues: [],
      suggestions: [],
      timeComplexity: "Unknown",
      spaceComplexity: "Unknown",
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generatePersonalizedRecommendations = async (
  userProfile,
  interviewHistory
) => {
  try {
    const prompt = `You are an expert interview coach analyzing a candidate's profile.

User Profile:
${JSON.stringify(userProfile)}

Interview History:
${JSON.stringify(interviewHistory)}

Based on the above, provide personalized recommendations for:
1. Topics to focus on
2. Practice areas
3. Study schedule
4. Interview tips
5. Confidence-building exercises

Format as JSON with detailed recommendations`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      topicsToFocus: [],
      practiceAreas: [],
      studySchedule: "",
      interviewTips: [],
      confidenceExercises: [],
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
