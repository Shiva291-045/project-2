import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { sendOTPEmail } from "../utils/email.js";
import * as resp from "../utils/apiResponse.js";

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
    const allowed = ["name", "targetRole", "skills", "bio", "avatar"];

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