import { auth } from "../config/firebase.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const handleError = (error, res) => {
  console.error("Error:", error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
};
