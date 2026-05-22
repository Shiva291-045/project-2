// Server Utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const generateAuthToken = (userId) => {
  // This should use JWT in production
  return `token_${userId}_${Date.now()}`;
};

export const formatErrorResponse = (message, statusCode = 400) => {
  return {
    success: false,
    message,
    statusCode,
  };
};

export const formatSuccessResponse = (data, message = "Success") => {
  return {
    success: true,
    message,
    data,
  };
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const calculateInterviewScore = (metrics) => {
  const weights = {
    technicalAccuracy: 0.4,
    clarity: 0.2,
    communication: 0.2,
    completeness: 0.2,
  };

  let score = 0;
  Object.keys(weights).forEach((key) => {
    if (metrics[key]) {
      score += (metrics[key] / 10) * weights[key] * 100;
    }
  });

  return Math.round(score);
};

export const getDifficultyLevel = (performance) => {
  if (performance >= 80) return "Hard";
  if (performance >= 60) return "Medium";
  return "Easy";
};

export const generateRecommendations = (weakAreas) => {
  const recommendationMap = {
    "system design": "Practice designing large-scale systems",
    algorithms: "Work on coding problems daily",
    communication: "Practice explaining your thoughts clearly",
    "time complexity": "Study Big O notation and optimization techniques",
    databases: "Learn SQL and database design patterns",
  };

  return weakAreas.map((area) => recommendationMap[area] || `Improve on ${area}`);
};

export const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const userRequests = requests.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later",
      });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);
    next();
  };
};

export const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, 10000);
};
