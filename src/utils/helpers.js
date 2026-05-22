// Common utility functions

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
};

export const getInitials = (name) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export const truncate = (text, length) => {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
};

export const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export const calculateScore = (answers, totalQuestions) => {
  return Math.round((answers.filter((a) => a.correct).length / totalQuestions) * 100);
};

export const getScoreColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

export const getScoreBgColor = (score) => {
  if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
  if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
  return "bg-red-100 dark:bg-red-900/20";
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const getDifficultySortOrder = (difficulty) => {
  const order = { Easy: 1, Medium: 2, Hard: 3 };
  return order[difficulty] || 0;
};
