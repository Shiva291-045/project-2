import React, { createContext, useState, useCallback, useEffect } from "react";
import { auth, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── Firebase auth listener ──────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setUser(fbUser);
          setIsAuthenticated(true);
          try {
            const snap = await getDoc(doc(db, "users", fbUser.uid));
            setUserProfile(snap.exists() ? snap.data() : { name: fbUser.displayName, email: fbUser.email });
          } catch {
            setUserProfile({ name: fbUser.displayName, email: fbUser.email });
          }
        } else {
          setUser(null);
          setUserProfile(null);
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // ── Register ────────────────────────────────────────────────────────
  const register = useCallback(async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await fbUpdateProfile(result.user, { displayName });
      try {
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid, name: displayName, email,
          createdAt: new Date().toISOString(), xp: 0, streak: 0,
        });
      } catch {}
      toast.success("Account created! Welcome to PrepAI 🎉");
      return { success: true };
    } catch (err) {
      const msg = err.code === "auth/email-already-in-use"
        ? "Email already registered. Please log in."
        : err.message || "Registration failed";
      setError(msg);
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, []);

  // ── Login ───────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back! 👋");
      return { success: true };
    } catch (err) {
      const msg = err.code === "auth/user-not-found" || err.code === "auth/wrong-password"
        ? "Invalid email or password"
        : err.message || "Login failed";
      setError(msg);
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      toast.success("Logged out");
      return { success: true };
    } catch (err) {
      toast.error("Logout failed");
      return { success: false };
    }
  }, []);

  // ── Reset password ──────────────────────────────────────────────────
  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
      return { success: true };
    } catch (err) {
      toast.error(err.message || "Failed to send reset email");
      return { success: false };
    }
  }, []);

  // ── Update profile ──────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false };
    try {
      await setDoc(doc(db, "users", user.uid), updates, { merge: true });
      setUserProfile((p) => ({ ...p, ...updates }));
      toast.success("Profile updated!");
      return { success: true };
    } catch (err) {
      toast.error("Failed to update profile");
      return { success: false };
    }
  }, [user]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading, error, isAuthenticated,
      register, login, logout, resetPassword, updateProfile, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
