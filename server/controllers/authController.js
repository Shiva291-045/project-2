import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { sendOTPEmail } from "../utils/email.js";
import * as resp from "../utils/apiResponse.js";
import { getReadiness } from "../utils/readinessService.js";

// ── helpers ──────────────────────────────────────────────────────────────────
const createToken = (user) =>
  signToken({ id: user._id, email: user.email, role: user.role });

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      if (!existing.isVerified) {
        const otp = existing.generateOTP("verify");

        await existing.save();

        await sendOTPEmail({
          to: email,
          name: existing.name,
          otp,
          type: "verify",
        });

        return resp.error(
          res,
          "Account already exists but is unverified. We resent a verification OTP to your email.",
          409
        );
      }

      return resp.error(
        res,
        "An account with this email already exists. Please log in.",
        409
      );
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const otp = user.generateOTP("verify");

    await user.save();

    await sendOTPEmail({
      to: email,
      name,
      otp,
      type: "verify",
    });

    return resp.success(
      res,
      {
        email,
        requiresVerification: true,
      },
      "Account created! Please check your email for the verification OTP.",
      201
    );
  } catch (err) {
    console.error("Register error:", err);

    return resp.error(
      res,
      "Registration failed. Please try again.",
      500
    );
  }
};

// ── POST /api/auth/verify-email ───────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select(
      "+otp +otpExpires +otpType"
    );

    if (!user) {
      return resp.error(res, "No account found with this email.", 404);
    }

    if (user.isVerified) {
      return resp.error(
        res,
        "Email is already verified. Please log in.",
        400
      );
    }

    if (!user.otp || user.otpType !== "verify") {
      return resp.error(
        res,
        "No pending verification found. Request a new OTP.",
        400
      );
    }

    if (new Date() > user.otpExpires) {
      return resp.error(
        res,
        "OTP has expired. Please request a new one.",
        400
      );
    }

    if (user.otp !== otp) {
      return resp.error(
        res,
        "Incorrect OTP. Please check and try again.",
        400
      );
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpType = undefined;

    await user.save();

    const token = createToken(user);

    return resp.success(
      res,
      { token, user },
      "Email verified! Welcome to PrepAI 🎉"
    );
  } catch (err) {
    console.error("Verify email error:", err);

    return resp.error(res, "Verification failed.", 500);
  }
};

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
export const resendOTP = async (req, res) => {
  try {
    const { email, type = "verify" } = req.body;

    const user = await User.findOne({ email }).select(
      "+otp +otpExpires +otpType"
    );

    if (!user) {
      return resp.error(res, "No account found with this email.", 404);
    }

    const otp = user.generateOTP(type);

    await user.save();

    await sendOTPEmail({
      to: email,
      name: user.name,
      otp,
      type,
    });

    return resp.success(
      res,
      { email },
      "A new OTP has been sent to your email."
    );
  } catch (err) {
    console.error("Resend OTP error:", err);

    return resp.error(res, "Failed to resend OTP.", 500);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return resp.error(
        res,
        "No account found with this email address.",
        401
      );
    }

    const match = await user.comparePassword(password);

    if (!match) {
      return resp.error(
        res,
        "Incorrect password. Please try again.",
        401
      );
    }

    if (!user.isVerified) {
      const otp = user.generateOTP("verify");

      await user.save();

      await sendOTPEmail({
        to: email,
        name: user.name,
        otp,
        type: "verify",
      });

      return resp.error(
        res,
        "Please verify your email first. We just resent your verification OTP.",
        403
      );
    }

    user.lastActive = new Date();

    await user.save({ validateBeforeSave: false });

    const token = createToken(user);

    return resp.success(
      res,
      { token, user },
      `Welcome back, ${user.name}!`
    );
  } catch (err) {
    console.error("Login error:", err);

    return resp.error(
      res,
      "Login failed. Please try again.",
      500
    );
  }
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    const msg =
      "If an account exists with this email, a password reset OTP has been sent.";

    if (!user) {
      return resp.success(res, {}, msg);
    }

    const otp = user.generateOTP("reset");

    await user.save();

    await sendOTPEmail({
      to: email,
      name: user.name,
      otp,
      type: "reset",
    });

    return resp.success(res, { email }, msg);
  } catch (err) {
    console.error("Forgot password error:", err);

    return resp.error(
      res,
      "Failed to send reset email.",
      500
    );
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select(
      "+otp +otpExpires +otpType +password"
    );

    if (!user) {
      return resp.error(res, "No account found with this email.", 404);
    }

    if (!user.otp || user.otpType !== "reset") {
      return resp.error(
        res,
        "No password reset was initiated. Please request again.",
        400
      );
    }

    if (new Date() > user.otpExpires) {
      return resp.error(
        res,
        "OTP has expired. Please request a new password reset.",
        400
      );
    }

    if (user.otp !== otp) {
      return resp.error(
        res,
        "Incorrect OTP. Please check and try again.",
        400
      );
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpType = undefined;

    await user.save();

    return resp.success(
      res,
      {},
      "Password reset successfully! You can now log in with your new password."
    );
  } catch (err) {
    console.error("Reset password error:", err);

    return resp.error(
      res,
      "Password reset failed.",
      500
    );
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return resp.error(res, "User not found.", 404);
    }

    return resp.success(res, { user });
  } catch (err) {
    console.error("GetMe error:", err);

    return resp.error(
      res,
      "Failed to fetch profile.",
      500
    );
  }
};

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const allowed = ["name", "targetRole", "targetCompanies", "skills", "bio", "avatar", "dsaLevel", "interviewLevel"];

    const updates = {};

    allowed.forEach((k) => {
      if (req.body[k] !== undefined) {
        updates[k] = req.body[k];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    return resp.success(
      res,
      { user },
      "Profile updated successfully!"
    );
  } catch (err) {
    console.error("Update profile error:", err);

    return resp.error(
      res,
      "Failed to update profile.",
      500
    );
  }
};

/* ═══════════════════════════════════════════════════════════════════════════════
   CAREER GOAL
   Represents what the user is currently preparing for. Embedded on the User
   document (see careerGoalSchema in models/User.js) — reuses the existing
   auth/profile domain rather than a new collection. Input validation runs at
   the route layer (careerGoalCreateRules/careerGoalUpdateRules in
   middleware/validate.js), matching the same express-validator pattern
   already used for register/login — not a second validation style. Readiness
   score is always computed live from readinessService.js, never stored, so
   it can't drift from the real underlying data.
═══════════════════════════════════════════════════════════════════════════════ */

// Builds a goal subdocument's field set from the (already-validated) request
// body, applying only the keys actually provided so partial updates don't
// clobber unspecified fields with schema defaults.
const buildGoalFields = (body, { isCreate }) => {
  const fields = {};
  if (body.targetRole !== undefined)        fields.targetRole = body.targetRole.trim();
  if (body.targetCompanies !== undefined)   fields.targetCompanies = body.targetCompanies.map(c => c.trim()).filter(Boolean);
  if (body.experienceLevel !== undefined)   fields.experienceLevel = body.experienceLevel;
  if (body.preferredLanguage !== undefined) fields.preferredLanguage = body.preferredLanguage.trim();
  if (body.interviewDate !== undefined)     fields.interviewDate = body.interviewDate ? new Date(body.interviewDate) : null;
  if (body.dailyPrepMinutes !== undefined)  fields.dailyPrepMinutes = Number(body.dailyPrepMinutes);
  if (body.status !== undefined)            fields.status = body.status;
  if (isCreate && fields.status === undefined) fields.status = "active";
  return fields;
};

// Demotes every OTHER currently-"active" goal on the user to "paused", so at
// most one goal is ever active at a time. Mutates `user` in place; caller
// still needs to save().
const demoteOtherActiveGoals = (user, exceptGoalId) => {
  user.careerGoals.forEach(g => {
    if (g.status === "active" && String(g._id) !== String(exceptGoalId)) {
      g.status = "paused";
    }
  });
};

// Keeps the legacy flat User.targetRole/targetCompanies fields in sync with
// whichever goal is active, so existing consumers of those fields (Interview
// setup pre-fill, Resume company panel) keep working unchanged.
const syncFlatProfileFields = (user, goal) => {
  user.targetRole = goal.targetRole;
  user.targetCompanies = goal.targetCompanies;
};

// ── POST /api/auth/career-goal ──────────────────────────────────────────────
// Create a new career goal. Automatically becomes the active goal — any
// previously-active goal is demoted to "paused" (not deleted; goal history
// is preserved for future personalization use).
export const createCareerGoal = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return resp.error(res, "User not found.", 404);

    const fields = buildGoalFields(req.body, { isCreate: true });
    demoteOtherActiveGoals(user, null);
    user.careerGoals.push(fields);
    const goal = user.careerGoals[user.careerGoals.length - 1];
    syncFlatProfileFields(user, goal);

    await user.save();

    return resp.success(res, { goal }, "Career goal created and set as active.", 201);
  } catch (err) {
    console.error("Create career goal error:", err);
    return resp.error(res, "Failed to create career goal.", 500);
  }
};

// ── PUT /api/auth/career-goal/:goalId ───────────────────────────────────────
// Update an existing career goal (partial update — only provided fields
// change). If `status` is set to "active", any other active goal is demoted.
export const updateCareerGoal = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return resp.error(res, "User not found.", 404);

    const goal = user.careerGoals.id(req.params.goalId);
    if (!goal) return resp.error(res, "Career goal not found.", 404);

    const fields = buildGoalFields(req.body, { isCreate: false });
    Object.assign(goal, fields);

    if (goal.status === "active") {
      demoteOtherActiveGoals(user, goal._id);
      syncFlatProfileFields(user, goal);
    }

    await user.save();

    return resp.success(res, { goal }, "Career goal updated.");
  } catch (err) {
    console.error("Update career goal error:", err);
    return resp.error(res, "Failed to update career goal.", 500);
  }
};

// ── PATCH /api/auth/career-goal/:goalId/activate ────────────────────────────
// Switch which goal is the active one — demotes whichever goal was active
// before, activates the requested one, and syncs the legacy flat profile
// fields to match.
export const activateCareerGoal = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return resp.error(res, "User not found.", 404);

    const goal = user.careerGoals.id(req.params.goalId);
    if (!goal) return resp.error(res, "Career goal not found.", 404);

    demoteOtherActiveGoals(user, goal._id);
    goal.status = "active";
    syncFlatProfileFields(user, goal);

    await user.save();

    return resp.success(res, { goal }, "Career goal activated.");
  } catch (err) {
    console.error("Activate career goal error:", err);
    return resp.error(res, "Failed to activate career goal.", 500);
  }
};

// ── GET /api/auth/career-goal/active ────────────────────────────────────────
// Returns the currently active goal, if any, with a LIVE readiness score
// merged in (computed from readinessService.js — never a stored/stale
// value). Returns { goal: null } — not an error — when no goal is set yet,
// so the frontend can show a real empty state instead of treating it as a
// failure.
export const getActiveCareerGoal = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return resp.error(res, "User not found.", 404);

    const goal = user.careerGoals.find(g => g.status === "active") || null;
    if (!goal) {
      return resp.success(res, { goal: null, readiness: null }, "No active career goal set yet.");
    }

    let readiness = null;
    try {
      readiness = await getReadiness(req.user._id);
    } catch (e) {
      console.warn("[Career Goal] readiness lookup failed:", e.message);
    }

    return resp.success(res, { goal, readiness }, "Active career goal retrieved.");
  } catch (err) {
    console.error("Get active career goal error:", err);
    return resp.error(res, "Failed to fetch active career goal.", 500);
  }
};

// ── GET /api/auth/career-goal ────────────────────────────────────────────────
// Lists all of the user's career goals (active + paused/achieved/abandoned
// history), most recently updated first. Not currently used by any UI beyond
// the active one, but exposed now so a future goal-history view or the
// personalization system doesn't need a new endpoint for it.
export const listCareerGoals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return resp.error(res, "User not found.", 404);

    const goals = [...user.careerGoals].sort((a, b) => b.updatedAt - a.updatedAt);
    return resp.success(res, { goals });
  } catch (err) {
    console.error("List career goals error:", err);
    return resp.error(res, "Failed to fetch career goals.", 500);
  }
};

// ── PUT /api/auth/change-password ─────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return resp.error(res, "User not found.", 404);
    }

    const match = await user.comparePassword(currentPassword);

    if (!match) {
      return resp.error(
        res,
        "Current password is incorrect.",
        401
      );
    }

    user.password = newPassword;

    await user.save();

    const token = createToken(user);

    return resp.success(
      res,
      { token },
      "Password changed successfully!"
    );
  } catch (err) {
    console.error("Change password error:", err);

    return resp.error(
      res,
      "Failed to change password.",
      500
    );
  }
};