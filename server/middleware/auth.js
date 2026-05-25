import { verifyToken as jwtVerify } from "../utils/jwt.js";
import User from "../models/User.js";
import * as resp from "../utils/apiResponse.js";

// ── Verify JWT + attach user to req ────────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
      return resp.error(res, "Authentication required. Please log in.", 401);

    const token = header.split(" ")[1];
    if (!token) return resp.error(res, "No token provided.", 401);

    let decoded;
    try {
      decoded = jwtVerify(token);
    } catch (err) {
      if (err.name === "TokenExpiredError")
        return resp.error(res, "Session expired. Please log in again.", 401);
      return resp.error(res, "Invalid token.", 401);
    }

    const user = await User.findById(decoded.id).select("-password -otp -otpExpires");
    if (!user) return resp.error(res, "User no longer exists.", 401);

    req.user = user;
    next();
  } catch (err) {
    return resp.error(res, "Authentication failed.", 401);
  }
};

// ── Require verified email ──────────────────────────────────────────────────
export const requireVerified = (req, res, next) => {
  if (!req.user.isVerified)
    return resp.error(res, "Please verify your email before continuing.", 403);
  next();
};

// ── Admin only ──────────────────────────────────────────────────────────────
export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return resp.error(res, "Access denied — admin only.", 403);
  next();
};
