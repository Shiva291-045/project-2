import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { db, auth } from "../config/firebase.js";

const router = express.Router();

// Get user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: userDoc.data() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, targetRole, skills, bio } = req.body;
    await db.collection("users").doc(req.user.uid).update({
      name,
      targetRole,
      skills,
      bio,
      updatedAt: new Date(),
    });
    res.json({ success: true, message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user statistics
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const interviews = await db
      .collection("interviews")
      .where("userId", "==", req.user.uid)
      .get();

    const submissions = await db
      .collection("codingSubmissions")
      .where("userId", "==", req.user.uid)
      .get();

    const totalInterviews = interviews.size;
    const averageScore =
      interviews.size > 0
        ? interviews.docs.reduce((sum, doc) => sum + (doc.data().score || 0), 0) /
          interviews.size
        : 0;

    const codingProblems = submissions.size;

    res.json({
      success: true,
      data: {
        totalInterviews,
        averageScore: averageScore.toFixed(2),
        codingProblems,
        xp: 0,
        streak: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
