import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  message: { success: false, message: "Too many requests. Please wait 15 minutes and try again." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 3,
  message: { success: false, message: "Too many OTP requests. Please wait 1 minute." },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests. Slow down!" },
});
