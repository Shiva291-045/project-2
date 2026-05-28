import express    from "express";
import cors       from "cors";
import dotenv     from "dotenv";
import helmet     from "helmet";
import morgan     from "morgan";
import path       from "path";
import { fileURLToPath } from "url";
import connectDB  from "./config/db.js";

import authRoutes        from "./routes/authRoutes.js";
import resumeRoutes      from "./routes/resumeRoutes.js";
import interviewRoutes   from "./routes/interviewRoutes.js";
import codingRoutes      from "./routes/codingRoutes.js";
import analyticsRoutes   from "./routes/analyticsRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import paymentRoutes     from "./routes/paymentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app  = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5001;

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── CORS — accept all Vercel deployments + localhost ─────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Postman)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain, localhost, and custom FRONTEND_URL
    const allowed = [
      /\.vercel\.app$/,
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
    ];
    if (process.env.FRONTEND_URL) {
      try { allowed.push(new RegExp(`^${process.env.FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)); } catch {}
    }
    if (allowed.some(r => r.test(origin))) return callback(null, true);
    console.warn("CORS blocked:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // pre-flight for all routes

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
app.use("/api/payment",     paymentRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV || "development" });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") return res.status(403).json({ success: false, message: "CORS error" });
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
