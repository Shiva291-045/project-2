import jwt from "jsonwebtoken";

const SECRET     = process.env.JWT_SECRET     || "prepai_jwt_secret_change_in_production";
const REFRESH    = process.env.JWT_REFRESH    || "prepai_refresh_secret_change_in_production";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const signToken = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH, { expiresIn: "30d" });

export const verifyToken = (token) => jwt.verify(token, SECRET);

export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH);
