import jwt from "jsonwebtoken";

const SECRET     = process.env.JWT_SECRET     || "prepai_jwt_secret_change_in_production";
const REFRESH    = process.env.JWT_REFRESH    || "prepai_refresh_secret_change_in_production";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Warn in production if default secrets are used
if (process.env.NODE_ENV === "production") {
  if (SECRET === "prepai_jwt_secret_change_in_production") {
    console.error("⚠️  SECURITY WARNING: JWT_SECRET is using the default value in production! Set a secure secret in Render environment variables.");
  }
}

export const signToken = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH, { expiresIn: "30d" });

export const verifyToken = (token) => jwt.verify(token, SECRET);

export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH);
