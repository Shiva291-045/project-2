import { body, validationResult } from "express-validator";
import * as resp from "../utils/apiResponse.js";
import { EXPERIENCE_LEVELS, GOAL_STATUSES } from "../models/User.js";

// Run validation rules and short-circuit on error
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return resp.error(res, messages[0], 400, messages);
  }
  next();
};

// ── Reusable rules ──────────────────────────────────────────────────────────
export const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
  body("email").trim().isEmail().withMessage("Please enter a valid email").normalizeEmail(),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password needs at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password needs at least one lowercase letter")
    .matches(/[0-9]/).withMessage("Password needs at least one number")
    .matches(/[^A-Za-z0-9]/).withMessage("Password needs at least one special character"),
];

export const loginRules = [
  body("email").trim().isEmail().withMessage("Please enter a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const otpRules = [
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("otp").trim().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
];

export const resetPasswordRules = [
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("otp").trim().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
  body("newPassword")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Needs uppercase letter")
    .matches(/[0-9]/).withMessage("Needs a number")
    .matches(/[^A-Za-z0-9]/).withMessage("Needs a special character"),
];

// ── Career goal rules ────────────────────────────────────────────────────────
// Shared field rules reused between create (targetRole required) and update
// (everything optional — partial updates shouldn't require re-sending
// unrelated fields).
const careerGoalFieldRules = [
  body("targetCompanies").optional().isArray({ max: 10 }).withMessage("You can list at most 10 target companies"),
  body("targetCompanies.*").optional().isString().isLength({ max: 100 }).withMessage("Each target company must be 100 characters or fewer"),
  body("experienceLevel").optional().isIn(EXPERIENCE_LEVELS).withMessage(`Experience level must be one of: ${EXPERIENCE_LEVELS.join(", ")}`),
  body("preferredLanguage").optional({ checkFalsy: true }).isString().isLength({ max: 50 }).withMessage("Preferred language must be 50 characters or fewer"),
  body("interviewDate").optional({ checkFalsy: true }).isISO8601().withMessage("Interview date must be a valid date"),
  body("dailyPrepMinutes").optional().isInt({ min: 0, max: 1440 }).withMessage("Daily preparation time must be between 0 and 1440 minutes"),
  body("status").optional().isIn(GOAL_STATUSES).withMessage(`Status must be one of: ${GOAL_STATUSES.join(", ")}`),
];

export const careerGoalCreateRules = [
  body("targetRole").trim().notEmpty().withMessage("Target role is required").isLength({ max: 100 }).withMessage("Target role must be 100 characters or fewer"),
  ...careerGoalFieldRules,
];

export const careerGoalUpdateRules = [
  body("targetRole").optional().trim().notEmpty().withMessage("Target role cannot be empty").isLength({ max: 100 }).withMessage("Target role must be 100 characters or fewer"),
  ...careerGoalFieldRules,
];
