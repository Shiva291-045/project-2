import express from "express";
import {
  startInterview,
  getInterviewResponse,
  analyzeInterviewPerformance,
  generateCustomQuestions,
} from "../services/geminiService.js";
import { verifyToken } from "../middleware/auth.js";
import admin from "firebase-admin";

const router = express.Router();
const db = admin.firestore();

/**
 * POST /api/interview/start
 * Start a new interview session with Gemini AI
 */
router.post("/start", verifyToken, async (req, res) => {
  try {
    const { interviewType } = req.body;
    const userId = req.user.uid;

    if (!interviewType) {
      return res.status(400).json({ error: "Interview type is required" });
    }

    // Get user profile for context
    const userDoc = await db.collection("users").doc(userId).get();
    const userProfile = userDoc.data();

    // Start interview with Gemini AI
    const result = await startInterview(interviewType, userProfile);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Create interview session in Firestore
    const sessionRef = await db.collection("interviews").add({
      userId,
      interviewType,
      startTime: new Date(),
      status: "active",
      transcript: [
        {
          role: "assistant",
          content: result.message,
          timestamp: new Date(),
        },
      ],
      sessionId: result.sessionId,
      feedback: [],
    });

    res.json({
      success: true,
      sessionId: sessionRef.id,
      aiSessionId: result.sessionId,
      initialQuestion: result.message,
    });
  } catch (error) {
    console.error("Error starting interview:", error);
    res.status(500).json({ error: "Failed to start interview" });
  }
});

/**
 * POST /api/interview/:sessionId/respond
 * Send user response and get AI feedback
 */
router.post("/:sessionId/respond", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userResponse } = req.body;
    const userId = req.user.uid;

    if (!userResponse) {
      return res.status(400).json({ error: "User response is required" });
    }

    // Get interview session
    const sessionDoc = await db.collection("interviews").doc(sessionId).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: "Interview session not found" });
    }

    const sessionData = sessionDoc.data();

    if (sessionData.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get conversation history
    const conversationHistory = sessionData.transcript.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    // Get AI response using Gemini
    const aiResponse = await getInterviewResponse(
      userResponse,
      conversationHistory,
      sessionData.interviewType,
      null
    );

    if (!aiResponse.success) {
      return res.status(500).json({ error: aiResponse.error });
    }

    // Update session with new messages
    const updatedTranscript = [
      ...sessionData.transcript,
      {
        role: "user",
        content: userResponse,
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content: aiResponse.message,
        timestamp: new Date(),
        feedback: aiResponse.feedback,
      },
    ];

    await db.collection("interviews").doc(sessionId).update({
      transcript: updatedTranscript,
      lastResponse: new Date(),
    });

    res.json({
      success: true,
      aiResponse: aiResponse.message,
      feedback: aiResponse.feedback,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error responding to interview:", error);
    res.status(500).json({ error: "Failed to process response" });
  }
});

/**
 * POST /api/interview/:sessionId/end
 * End interview and get analysis
 */
router.post("/:sessionId/end", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.uid;

    // Get interview session
    const sessionDoc = await db.collection("interviews").doc(sessionId).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: "Interview session not found" });
    }

    const sessionData = sessionDoc.data();

    if (sessionData.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Analyze performance
    const conversationHistory = sessionData.transcript.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const analysis = await analyzeInterviewPerformance(
      conversationHistory,
      sessionData.interviewType
    );

    // Update session with analysis
    await db.collection("interviews").doc(sessionId).update({
      status: "completed",
      endTime: new Date(),
      analysis: analysis.analysis || analysis,
    });

    // Update user stats
    await updateUserStats(userId, analysis.analysis || analysis);

    res.json({
      success: true,
      analysis: analysis.analysis || analysis,
    });
  } catch (error) {
    console.error("Error ending interview:", error);
    res.status(500).json({ error: "Failed to end interview" });
  }
});

/**
 * GET /api/interview/history
 * Get user's interview history
 */
router.get("/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 10, offset = 0 } = req.query;

    const snapshot = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .orderBy("startTime", "desc")
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const interviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime?.toDate() || null,
      endTime: doc.data().endTime?.toDate() || null,
      lastResponse: doc.data().lastResponse?.toDate() || null,
    }));

    res.json({
      success: true,
      interviews,
      total: snapshot.size,
    });
  } catch (error) {
    console.error("Error fetching interview history:", error);
    res.status(500).json({ error: "Failed to fetch interview history" });
  }
});

/**
 * GET /api/interview/:sessionId
 * Get specific interview details
 */
router.get("/:sessionId", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.uid;

    const sessionDoc = await db.collection("interviews").doc(sessionId).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: "Interview not found" });
    }

    const data = sessionDoc.data();

    if (data.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({
      success: true,
      interview: {
        id: sessionId,
        ...data,
        startTime: data.startTime?.toDate() || null,
        endTime: data.endTime?.toDate() || null,
      },
    });
  } catch (error) {
    console.error("Error fetching interview:", error);
    res.status(500).json({ error: "Failed to fetch interview" });
  }
});

/**
 * POST /api/interview/generate-questions
 * Generate personalized interview questions
 */
router.post("/generate-questions", verifyToken, async (req, res) => {
  try {
    const { targetRole, skills, experience, difficulty } = req.body;

    const result = await generateCustomQuestions(
      targetRole,
      skills,
      experience,
      difficulty
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      questions: result.questions,
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// Helper function to update user statistics
async function updateUserStats(userId, analysis) {
  try {
    const userRef = db.collection("users").doc(userId);

    // Get current stats
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    // Calculate new stats
    const newStats = {
      totalInterviews: (userData.totalInterviews || 0) + 1,
      averageScore: calculateNewAverage(
        userData.averageScore || 0,
        userData.totalInterviews || 0,
        analysis.overallScore || 75
      ),
      lastInterviewDate: new Date(),
      weakAreas: updateWeakAreas(userData.weakAreas || [], analysis),
      strongAreas: updateStrongAreas(userData.strongAreas || [], analysis),
    };

    await userRef.update(newStats);
  } catch (error) {
    console.error("Error updating user stats:", error);
  }
}

function calculateNewAverage(oldAverage, count, newScore) {
  return (oldAverage * count + newScore) / (count + 1);
}

function updateWeakAreas(currentAreas, analysis) {
  return currentAreas;
}

function updateStrongAreas(currentAreas, analysis) {
  return currentAreas;
}

export default router;
