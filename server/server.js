import express    from "express";
import cors       from "cors";
import dotenv     from "dotenv";
import helmet     from "helmet";
import morgan     from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import connectDB  from "./config/db.js";

import authRoutes        from "./routes/authRoutes.js";
import resumeRoutes      from "./routes/resumeRoutes.js";
import interviewRoutes   from "./routes/interviewRoutes.js";
import codingRoutes      from "./routes/codingRoutes.js";
import analyticsRoutes   from "./routes/analyticsRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"),
});
console.log("KEY =", process.env.RESEND_API_KEY);
const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5001;


// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin:'https://project-2-virid-alpha.vercel.app', credentials: true }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/resume",      resumeRoutes);
app.use("/api/interview",   interviewRoutes);
app.use("/api/coding",      codingRoutes);
app.use("/api/analytics",   analyticsRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Something went wrong." : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 PrepAI API running on http://localhost:${PORT}`);
  console.log(`📦 Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`🗄️  MongoDB URI  : ${process.env.MONGODB_URI ? "configured" : "localhost (default)"}\n`);
});

export default app;
