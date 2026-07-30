import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName:   { type: String },
    targetRole: { type: String, default: "" },
    atsScore:   { type: Number, default: 0 },
    analysis: {
      strengths:       [String],
      improvements:    [String],
      skills:          [String],
      missingKeywords: [String],
      suggestions:     [String],
      summary:         String,
      sections: {
        skillsScore:     { type: Number, default: 0 },
        experienceScore: { type: Number, default: 0 },
        projectsScore:   { type: Number, default: 0 },
        formatScore:     { type: Number, default: 0 },
      },
      parsedSections: {
        name:     { type: String, default: "" },
        detected: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
      trendingSkills:   [String],
      recommendedTech:  [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);
