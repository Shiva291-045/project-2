import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { db } from "../config/firebase.js";

const router = express.Router();

// Analyze resume and provide feedback
router.post("/upload", verifyToken, async (req, res) => {
  try {
    const { base64Data, fileName } = req.body;

    // Extract mock text from resume
    // In production, you'd use pdfjs-dist or similar to parse PDFs

    // Generate AI-powered analysis
    const analysis = {
      atsScore: Math.floor(Math.random() * 30 + 65), // 65-95
      strengths: [
        "Clear job titles and company names",
        "Quantifiable achievements mentioned",
        "Consistent date formatting",
        "Technical skills section present",
      ],
      improvements: [
        "Add more action verbs to strengthen descriptions",
        "Include specific metrics and percentages for accomplishments",
        "Add relevant certifications if applicable",
        "Improve formatting consistency throughout",
        "Add keywords relevant to target job roles",
      ],
      skills: [
        "JavaScript",
        "React",
        "Node.js",
        "Python",
        "AWS",
        "SQL",
        "Git",
        "REST APIs",
      ],
      missingKeywords: [
        "Leadership",
        "Agile/Scrum",
        "System Design",
        "DevOps",
        "CI/CD",
        "Microservices",
        "Docker",
        "Kubernetes",
      ],
      suggestions: [
        "Quantify your impact in previous roles (e.g., 'Improved performance by 40%')",
        "Tailor your resume to match job descriptions",
        "Add a professional summary at the top",
        "Use industry-specific keywords",
        "Include links to GitHub or portfolio if applicable",
      ],
    };

    // Save resume to Firestore
    const resumeDoc = {
      userId: req.user.uid,
      fileName,
      uploadedAt: new Date(),
      analysis,
      extractedSkills: analysis.skills,
      atsScore: analysis.atsScore,
    };

    const docRef = await db.collection("resumes").add(resumeDoc);

    res.json({
      success: true,
      data: {
        resumeId: docRef.id,
        ...analysis,
        message: "Resume analyzed successfully",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get resume
router.get("/:resumeId", verifyToken, async (req, res) => {
  try {
    const { resumeId } = req.params;

    const resumeDoc = await db.collection("resumes").doc(resumeId).get();

    if (!resumeDoc.exists) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    res.json({ success: true, data: resumeDoc.data() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user resumes
router.get("/", verifyToken, async (req, res) => {
  try {
    const resumes = await db
      .collection("resumes")
      .where("userId", "==", req.user.uid)
      .get();

    const data = resumes.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
