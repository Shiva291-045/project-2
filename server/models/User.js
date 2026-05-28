import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true, minlength: 6, select: false },
    isVerified:    { type: Boolean, default: false },
    role:          { type: String, enum: ["user", "admin"], default: "user" },
    avatar:        { type: String, default: "" },
    targetRole:    { type: String, default: "" },
    skills:        [{ type: String }],
    bio:           { type: String, default: "" },
    // OTP fields
    otp:           { type: String, select: false },
    otpExpires:    { type: Date,   select: false },
    otpType:       { type: String, enum: ["verify", "reset"], select: false },
    // Stats (denormalized for speed)
    totalInterviews:   { type: Number, default: 0 },
    avgInterviewScore: { type: Number, default: 0 },
    problemsSolved:    { type: Number, default: 0 },
    streak:            { type: Number, default: 0 },
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
