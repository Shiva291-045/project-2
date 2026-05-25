import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ["user", "assistant"] },
  content:   { type: String },
  score:     { type: Number },
  timestamp: { type: Date, default: Date.now },
});

const interviewSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode:       { type: String, enum: ["technical", "behavioral", "hr"], required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    role:       { type: String, default: "Software Engineer" },
    duration:   { type: Number, default: 0 },          // seconds
    scores:     [{ type: Number }],
    avgScore:   { type: Number, default: 0 },
    transcript: [messageSchema],
    analysis:   {
      strengths:    [String],
      improvements: [String],
      overall:      String,
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
