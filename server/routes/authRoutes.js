import express from "express";
import {
  register, login, verifyEmail, resendOTP,
  forgotPassword, resetPassword,
  getMe, updateProfile, changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";
import { validate, registerRules, loginRules, otpRules, resetPasswordRules } from "../middleware/validate.js";

const router = express.Router();

// Public
router.post("/register",         authLimiter, registerRules,      validate, register);
router.post("/login",            authLimiter, loginRules,         validate, login);
router.post("/verify-email",     otpLimiter,  otpRules,           validate, verifyEmail);
router.post("/resend-otp",       otpLimiter,                               resendOTP);
router.post("/forgot-password",  otpLimiter,                               forgotPassword);
router.post("/reset-password",   authLimiter, resetPasswordRules, validate, resetPassword);

// Protected
router.get("/me",                protect, getMe);
router.put("/profile",           protect, updateProfile);
router.put("/change-password",   protect, changePassword);

export default router;
