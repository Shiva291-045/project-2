import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { db } from "../config/firebase.js";

const router = express.Router();

// Get user analytics
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get interviews
    const interviews = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .get();

    // Get coding submissions
    const submissions = await db
      .collection("codingSubmissions")
      .where("userId", "==", userId)
      .get();

    // Process data
    const interviewsByType = {};
    const scoreByDate = [];

    interviews.forEach((doc) => {
      const data = doc.data();
      interviewsByType[data.type] = (interviewsByType[data.type] || 0) + 1;

      scoreByDate.push({
        date: data.startedAt?.toDate?.()?.toLocaleDateString?.() || "Unknown",
        score: data.score || 0,
      });
    });

    const passedCoding = submissions.docs.filter(
      (doc) => doc.data().passed
    ).length;

    res.json({
      success: true,
      data: {
        totalInterviews: interviews.size,
        totalProblems: submissions.size,
        passedProblems: passedCoding,
        interviewsByType,
        scoreByDate: scoreByDate.slice(0, 30),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get topic-wise analytics
router.get("/topics", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const interviews = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .get();

    const topicScores = {};

    interviews.forEach((doc) => {
      const data = doc.data();
      data.skills?.forEach((skill) => {
        topicScores[skill] = (topicScores[skill] || 0) + (data.score || 0);
      });
    });

    res.json({ success: true, data: topicScores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
