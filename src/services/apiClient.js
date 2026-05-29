import axios from "axios";
import toast from "react-hot-toast";

// Resolve backend URL — never fall back to localhost in production
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  // CRA dev proxy handles /api/* → backend via package.json proxy
  return "";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 45000,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// ── Retry helper ──────────────────────────────────────────────────────────────
const withRetry = async (fn, retries = 2, delay = 800) => {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries) throw err;
      const isRetryable = !err.response || err.response.status >= 500 || err.code === "ECONNABORTED";
      if (!isRetryable) throw err;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
};

// ── Attach JWT on every request ───────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("prepai_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// ── Global response error handler ─────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status  = err.response?.status;
    const message = err.response?.data?.message || err.message || "An unexpected error occurred.";

    if (status === 401) {
      localStorage.removeItem("prepai_token");
      localStorage.removeItem("prepai_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (status >= 500) {
      console.error("[API] Server error:", status, message);
    }

    return Promise.reject({ message, status, data: err.response?.data });
  }
);

export { withRetry };
export default api;
