import mongoose from "mongoose";

const qaSchema = new mongoose.Schema(
  {
    question:    { type: String, required: true },
    answer:      { type: String, default: "" },
    difficulty:  { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    topic:       { type: String, default: "General" },
    score:       { type: Number, default: null },
    feedback:    { type: String, default: "" },
    askedAt:     { type: Date, default: Date.now },
    answeredAt:  { type: Date },
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode:            { type: String, enum: ["technical", "behavioral", "hr"], required: true },
    role:            { type: String, default: "Software Engineer" },
    company:         { type: String, default: "" },
    weakTopics:      [String], // DSA topics the candidate is weaker in, supplied at session start (client-derived from their own solved-problem data)
    baseDifficulty:  { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    duration:        { type: Number, default: 600 },       // seconds, configured
    targetQuestions: { type: Number, default: 8 },          // configured question count
    status:          { type: String, enum: ["active", "completed", "abandoned"], default: "active" },
    qa:              [qaSchema],
    topicsCovered:   [String],
    report: {
      overallScore:         { type: Number },
      technicalScore:       { type: Number, default: null },
      communicationScore:   { type: Number, default: null },
      problemSolvingScore:  { type: Number, default: null },
      strengths:            [String],
      weaknesses:           [String],
      suggestions:          [String],
      topicBreakdown:       { type: mongoose.Schema.Types.Mixed, default: {} },
      recommendedDsaTopics: [String],
      summary:              { type: String, default: "" },
    },
    startedAt:   { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

interviewSessionSchema.index({ userId: 1, status: 1 });

export default mongoose.model("InterviewSession", interviewSessionSchema);
