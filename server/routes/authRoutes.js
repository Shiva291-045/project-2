import express from "express";
import {
  register, login, verifyEmail, resendOTP,
  forgotPassword, resetPassword,
  getMe, updateProfile, changePassword,
  createCareerGoal, updateCareerGoal, activateCareerGoal,
  getActiveCareerGoal, listCareerGoals,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";
import {
  validate, registerRules, loginRules, otpRules, resetPasswordRules,
  careerGoalCreateRules, careerGoalUpdateRules,
} from "../middleware/validate.js";

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

// Career goal — must come before any conflicting param routes if added later
router.get   ("/career-goal",              protect,                              listCareerGoals);
router.post  ("/career-goal",              protect, careerGoalCreateRules, validate, createCareerGoal);
router.get   ("/career-goal/active",       protect,                              getActiveCareerGoal);
router.put   ("/career-goal/:goalId",      protect, careerGoalUpdateRules, validate, updateCareerGoal);
router.patch ("/career-goal/:goalId/activate", protect,                          activateCareerGoal);

export default router;
