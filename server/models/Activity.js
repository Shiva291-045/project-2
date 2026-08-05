import mongoose from "mongoose";

// One document per (user, calendar day). `date` is a UTC "YYYY-MM-DD" string
// rather than a Date, so day-boundary math (gaps, streak breaks) is simple
// string/int comparison instead of timezone-sensitive Date arithmetic.
const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date:   { type: String, required: true }, // "YYYY-MM-DD" (UTC)
    // true = this day's streak was preserved by a streak freeze rather than
    // real activity (shown as a distinct color on the calendar).
    frozen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

activitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("Activity", activitySchema);
