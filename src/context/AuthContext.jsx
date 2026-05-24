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
import { doc, getDoc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export const AuthContext = createContext();

// ── Map Firebase error codes to human-readable messages ────────────────────
const getFirebaseError = (code) => {
  const map = {
    "auth/user-not-found":       "No account found with this email address.",
    "auth/wrong-password":       "Incorrect password. Please try again.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/email-already-in-use": "An account with this email already exists. Please log in.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/too-many-requests":    "Too many failed attempts. Please wait a few minutes and try again.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/invalid-credential":   "Invalid email or password. Please check your credentials.",
    "auth/user-disabled":        "This account has been disabled. Please contact support.",
  };
  return map[code] || "An unexpected error occurred. Please try again.";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── Auth state listener ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setUser(fbUser);
          setIsAuthenticated(true);
          // Load Firestore profile
          try {
            const snap = await getDoc(doc(db, "users", fbUser.uid));
            if (snap.exists()) {
              setUserProfile(snap.data());
            } else {
              setUserProfile({
                uid:   fbUser.uid,
                name:  fbUser.displayName || "",
                email: fbUser.email,
              });
            }
          } catch {
            setUserProfile({
              uid:   fbUser.uid,
              name:  fbUser.displayName || "",
              email: fbUser.email,
            });
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
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await fbUpdateProfile(result.user, { displayName });
      const profile = {
        uid:       result.user.uid,
        name:      displayName,
        email,
        createdAt: new Date().toISOString(),
        xp:        0,
        streak:    0,
        role:      "user",
      };
      try {
        await setDoc(doc(db, "users", result.user.uid), profile);
      } catch {}
      setUserProfile(profile);
      toast.success(`Welcome to PrepAI, ${displayName}! 🎉`);
      return { success: true };
    } catch (err) {
      const msg = getFirebaseError(err.code);
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  // ── Login ───────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const name = result.user.displayName || email.split("@")[0];
      toast.success(`Welcome back, ${name}! 👋`);
      return { success: true };
    } catch (err) {
      const msg = getFirebaseError(err.code);
      setError(msg);
      return { success: false, message: msg, code: err.code };
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      toast.success("You've been logged out.");
      return { success: true };
    } catch {
      toast.error("Logout failed. Please try again.");
      return { success: false };
    }
  }, []);

  // ── Reset password ──────────────────────────────────────────────────
  const resetPassword = useCallback(async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset link sent to your email!");
      return { success: true };
    } catch (err) {
      const msg = getFirebaseError(err.code);
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  // ── Update profile ──────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false };
    try {
      await setDoc(doc(db, "users", user.uid), updates, { merge: true });
      setUserProfile((p) => ({ ...p, ...updates }));
      toast.success("Profile updated successfully!");
      return { success: true };
    } catch {
      toast.error("Failed to update profile. Please try again.");
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
