import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ── Career Goal ──────────────────────────────────────────────────────────────
// Represents what the user is CURRENTLY preparing for. Embedded as a
// subdocument array on User (not a separate top-level collection) — a user's
// goals are inherently owned by/scoped to that user, or already flat fields
// (targetRole/targetCompanies) on User, so this keeps ownership/auth simple
// and reuses the existing User-centric access pattern rather than
// introducing a second collection + its own indexing/query surface.
//
// Exactly one goal may have status "active" at a time (enforced in
// authController.js, not by a redundant boolean field here). Readiness score
// is deliberately NOT stored on the goal — it's computed live from
// server/utils/readinessService.js (the existing, single source of truth for
// readiness) whenever a goal is fetched, so it can never drift out of sync
// with the real underlying DSA/interview/resume/streak data.
export const EXPERIENCE_LEVELS = ["Fresher", "0-2 years", "2-5 years", "5-8 years", "8+ years"];
export const GOAL_STATUSES     = ["active", "paused", "achieved", "abandoned"];

const careerGoalSchema = new mongoose.Schema(
  {
    targetRole:        { type: String, required: true, trim: true, maxlength: 100 },
    targetCompanies:   [{ type: String, trim: true, maxlength: 100 }],
    experienceLevel:   { type: String, enum: EXPERIENCE_LEVELS, default: "Fresher" },
    preferredLanguage: { type: String, trim: true, maxlength: 50, default: "" },
    interviewDate:     { type: Date, default: null }, // optional
    dailyPrepMinutes:  { type: Number, min: 0, max: 1440, default: 60 },
    status:            { type: String, enum: GOAL_STATUSES, default: "active" },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true, minlength: 6, select: false },
    isVerified:    { type: Boolean, default: false },
    role:          { type: String, enum: ["user", "admin"], default: "user" },
    avatar:        { type: String, default: "" },
    targetRole:    { type: String, default: "" },
    targetCompanies: [{ type: String }],
    skills:        [{ type: String }],
    bio:           { type: String, default: "" },
    dsaLevel:        { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    interviewLevel:  { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    // Career goals — see careerGoalSchema above. `targetRole`/`targetCompanies`
    // above are kept as-is (not removed/renamed) for backward compatibility
    // with existing consumers (Interview setup pre-fill, Resume company
    // panel, Profile page) — they're kept in sync with whichever goal below
    // is currently "active" by the career-goal controller, so nothing that
    // already reads those flat fields needs to change.
    careerGoals:   [careerGoalSchema],
    // OTP fields
    otp:           { type: String, select: false },
    otpExpires:    { type: Date,   select: false },
    otpType:       { type: String, enum: ["verify", "reset"], select: false },
    // Stats (denormalized for speed)
    totalInterviews:   { type: Number, default: 0 },
    avgInterviewScore: { type: Number, default: 0 },
    problemsSolved:    { type: Number, default: 0 },
    // Streak — `streak` is the CURRENT streak (kept as the original field
    // name for backward compatibility with existing leaderboard queries).
    streak:              { type: Number, default: 0 },
    longestStreak:       { type: Number, default: 0 },
    lastActivityDate:     { type: String, default: null }, // "YYYY-MM-DD" (UTC)
    streakFreezes:        { type: Number, default: 1 },      // available freezes
    lastFreezeGrantMonth: { type: String, default: null },   // "YYYY-MM" — guards the once-per-month grant
    xp:                { type: Number, default: 0 },
    lastActive:        { type: Date,   default: Date.now },
    // Premium / subscription
    isPremium:           { type: Boolean, default: false },
    premiumPlan:         { type: String,  default: "" },
    premiumExpiry:       { type: Date },
    premiumPaymentId:    { type: String,  default: "" },
    premiumActivatedAt:  { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Generate OTP (6 digits)
userSchema.methods.generateOTP = function (type = "verify") {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp       = otp;
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpType   = type;
  return otp;
};

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.otpType;
  return obj;
};

export default mongoose.model("User", userSchema);
