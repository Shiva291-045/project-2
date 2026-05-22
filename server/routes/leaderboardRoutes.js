import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { db } from "../config/firebase.js";

const router = express.Router();

// Get leaderboard
router.get("/", verifyToken, async (req, res) => {
  try {
    const { timeframe = "global" } = req.query;

    const users = await db.collection("users").orderBy("xp", "desc").limit(100).get();

    const leaderboard = users.docs.map((doc, index) => ({
      rank: index + 1,
      ...doc.data(),
    }));

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user rank
router.get("/rank", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userXP = userDoc.data().xp || 0;

    const betterUsers = await db
      .collection("users")
      .where("xp", ">", userXP)
      .get();

    const rank = betterUsers.size + 1;

    res.json({
      success: true,
      data: {
        rank,
        xp: userXP,
        totalUsers: (await db.collection("users").count().get()).count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
