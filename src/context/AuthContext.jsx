import React, { createContext, useState, useCallback, useEffect, useRef } from "react";
import api from "../services/apiClient";
import toast from "react-hot-toast";

export const AuthContext = createContext();

const TOKEN_KEY = "prepai_token";
const USER_KEY  = "prepai_user";

const loadCached = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const [user,            setUser]            = useState(loadCached);
  const [loading,         setLoading]         = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!loadCached());
  const [error,           setError]           = useState(null);
  const initDone = useRef(false);

  // ── Persist user ────────────────────────────────────────────────────────────
  const persist = useCallback((userData, token) => {
    if (userData && token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // ── Re-hydrate session on mount (verify token with /api/auth/me) ────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }

    api.get("/api/auth/me")
      .then(({ data }) => {
        persist(data.data.user, token);
      })
      .catch(() => {
        persist(null, null);
      })
      .finally(() => setLoading(false));
  }, [persist]);

  const clearError = useCallback(() => setError(null), []);

  // ── Register ────────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const { data } = await api.post("/api/auth/register", { name, email, password });
      toast.success(data.message || "Account created! Please check your email.");
      return { success: true, requiresVerification: true, email };
    } catch (err) {
      const msg = err.message || "Registration failed.";
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      persist(data.data.user, data.data.token);
      toast.success(data.message || "Welcome back!");
      return { success: true };
    } catch (err) {
      const msg = err.message || "Login failed.";
      setError(msg);
      // Surface whether account needs verification
      const needsVerify = err.status === 403;
      return { success: false, message: msg, needsVerification: needsVerify, email };
    }
  }, [persist]);

  // ── Verify email OTP ─────────────────────────────────────────────────────────
  const verifyEmail = useCallback(async (email, otp) => {
    setError(null);
    try {
      const { data } = await api.post("/api/auth/verify-email", { email, otp });
      persist(data.data.user, data.data.token);
      toast.success("Email verified! Welcome to PrepAI 🎉");
      return { success: true };
    } catch (err) {
      const msg = err.message || "Verification failed.";
      setError(msg);
      return { success: false, message: msg };
    }
  }, [persist]);

  // ── Resend OTP ───────────────────────────────────────────────────────────────
  const resendOTP = useCallback(async (email, type = "verify") => {
    try {
      const { data } = await api.post("/api/auth/resend-otp", { email, type });
      toast.success(data.message || "OTP resent!");
      return { success: true };
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP.");
      return { success: false, message: err.message };
    }
  }, []);

  // ── Forgot password ──────────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email) => {
    try {
      const { data } = await api.post("/api/auth/forgot-password", { email });
      toast.success(data.message || "Password reset OTP sent!");
      return { success: true };
    } catch (err) {
      toast.error(err.message || "Failed to send reset OTP.");
      return { success: false, message: err.message };
    }
  }, []);

  // ── Reset password ───────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (email, otp, newPassword) => {
    setError(null);
    try {
      const { data } = await api.post("/api/auth/reset-password", { email, otp, newPassword });
      toast.success(data.message || "Password reset successfully!");
      return { success: true };
    } catch (err) {
      const msg = err.message || "Reset failed.";
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    persist(null, null);
    toast.success("You've been logged out.");
    return { success: true };
  }, [persist]);

  // ── Update profile ────────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    try {
      const { data } = await api.put("/api/auth/profile", updates);
      setUser((p) => ({ ...p, ...data.data.user }));
      localStorage.setItem(USER_KEY, JSON.stringify({ ...user, ...data.data.user }));
      toast.success("Profile updated!");
      return { success: true };
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
      return { success: false };
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      userProfile: user,
      loading,
      isAuthenticated,
      error,
      clearError,
      register,
      login,
      verifyEmail,
      resendOTP,
      forgotPassword,
      resetPassword,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
