import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionId:     { type: mongoose.Schema.Types.ObjectId, ref: "InterviewSession" },
    mode:          { type: String, enum: ["technical", "behavioral", "hr"], required: true },
    difficulty:    { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    role:          { type: String, default: "Software Engineer" },
    duration:      { type: Number, default: 0 },          // seconds
    scores:        [{ type: Number }],
    avgScore:      { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    // Free-form transcript text (human-readable log) — NOT a structured
    // per-message array, since that's owned by InterviewSession.qa.
    transcript:    { type: String, default: "" },
    analysis: {
      strengths:      [String],
      weaknesses:     [String],
      improvements:   [String],
      overall:        String,
      topicBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
