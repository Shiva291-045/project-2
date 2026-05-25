import axios from "axios";
import toast from "react-hot-toast";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Attach JWT on every request ───────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("prepai_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Global response error handler ─────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status  = err.response?.status;
    const message = err.response?.data?.message || "An unexpected error occurred.";

    if (status === 401) {
      localStorage.removeItem("prepai_token");
      localStorage.removeItem("prepai_user");
      // Avoid redirect loop on /login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    // Bubble the message up for component-level handling
    return Promise.reject({ message, status, data: err.response?.data });
  }
);

export default api;
