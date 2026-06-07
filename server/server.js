import express    from "express";
import cors       from "cors";
import dotenv     from "dotenv";
import helmet     from "helmet";
import morgan     from "morgan";
import path       from "path";
import { fileURLToPath } from "url";
import connectDB  from "./config/db.js";
import { validateGroqKey } from "./services/groqService.js";

import authRoutes        from "./routes/authRoutes.js";
import resumeRoutes      from "./routes/resumeRoutes.js";
import interviewRoutes   from "./routes/interviewRoutes.js";
import codingRoutes      from "./routes/codingRoutes.js";
import analyticsRoutes   from "./routes/analyticsRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

let paymentRoutes;
try {
  const mod = await import("./routes/paymentRoutes.js");
  paymentRoutes = mod.default;
} catch {
  console.warn("⚠️  paymentRoutes not found — skipping");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app  = express();
const PORT = process.env.PORT || 5001;
app.set("trust proxy", 1);

// ── DB + key validation ───────────────────────────────────────────────────────
connectDB();
validateGroqKey();

// ── Helmet / CSP ──────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy:   false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "blob:", "https:"],
      fontSrc:    ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "https://api.groq.com",              // Groq AI
        "https://judge0-ce.p.rapidapi.com",  // Code runner
        "https://api.razorpay.com",          // Payments
        "https://firestore.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://*.firebase.com",
        "https://*.firebaseio.com",
        "https://*.onrender.com",
        "https://*.vercel.app",
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
      ],
      frameSrc:   ["'self'"],
      workerSrc:  ["'self'", "blob:"],
      childSrc:   ["'self'", "blob:"],
      objectSrc:  ["'none'"],
      baseUri:    ["'self'"],
      formAction: ["'self'"],
    },
  },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const buildAllowedOrigins = () => {
  const patterns = [
    /\.vercel\.app$/,
    /\.netlify\.app$/,
    /\.onrender\.com$/,
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
  ];
  if (process.env.FRONTEND_URL) {
    try {
      const esc = process.env.FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      patterns.push(new RegExp(`^${esc}$`));
    } catch {}
  }
  return patterns;
};

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = buildAllowedOrigins();
    if (allowed.some(r => r.test(origin))) return cb(null, true);
    console.warn("CORS blocked:", origin);
    cb(new Error("Not allowed by CORS"));
  },
  credentials:    true,
  methods:        ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ── Body / logging ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
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
if (paymentRoutes) app.use("/api/payment", paymentRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({
  status:    "ok",
  timestamp: new Date().toISOString(),
  env:       process.env.NODE_ENV || "development",
  groq:      process.env.GROQ_API_KEY ? "configured" : "not configured",
  db:        process.env.MONGODB_URI  ? "configured" : "default",
}));

// ── 404 / Error ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` }));

app.use((err, req, res, _next) => {
  if (err.message === "Not allowed by CORS") return res.status(403).json({ success: false, message: "CORS error" });
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Something went wrong." : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 PrepAI API running on port ${PORT}`);
  console.log(`📦 Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`🗄️  MongoDB     : ${process.env.MONGODB_URI  ? "configured" : "fallback"}`);
  console.log(`🤖 Groq AI     : ${process.env.GROQ_API_KEY ? "configured ✅" : "❌ NOT SET — set GROQ_API_KEY in Render"}\n`);
});

export default app;
