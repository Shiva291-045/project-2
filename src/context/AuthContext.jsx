/**
 * Authentication Context
 * Manages app-wide auth state and provides auth methods
 * Handles persistent login, loading states, and error management
 */

import React, { createContext, useState, useCallback, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Initialize auth state from Firebase
   */
  useEffect(() => {
    let unsubscribe;

    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Subscribe to auth state changes
        unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser);
            setIsAuthenticated(true);

            // Fetch user profile from Firestore
            const profile = await authService.getUserProfile(firebaseUser.uid);
            setUserProfile(profile || {});
            setError(null);
          } else {
            setUser(null);
            setUserProfile(null);
            setIsAuthenticated(false);
            setError(null);
          }

          setLoading(false);
        });
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError("Failed to initialize authentication");
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /**
   * Register user
   */
  const register = useCallback(
    async (email, password, displayName) => {
      try {
        setError(null);
        setLoading(true);

        const result = await authService.register(
          email,
          password,
          displayName
        );

        if (!result.success) {
          setError(result.message);
          return result;
        }

        // User will be set by onAuthStateChanged listener
        return result;
      } catch (err) {
        const errorMsg = "Registration failed. Please try again.";
        setError(errorMsg);
        console.error("Registration error:", err);
        return { success: false, message: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Login user
   */
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const result = await authService.login(email, password);

      if (!result.success) {
        setError(result.message);
        return result;
      }

      // User will be set by onAuthStateChanged listener
      return result;
    } catch (err) {
      const errorMsg = "Login failed. Please try again.";
      setError(errorMsg);
      console.error("Login error:", err);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await authService.logout();

      if (!result.success) {
        setError("Logout failed");
        return result;
      }

      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      return result;
    } catch (err) {
      const errorMsg = "Logout failed. Please try again.";
      setError(errorMsg);
      console.error("Logout error:", err);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (email) => {
    try {
      setError(null);
      setLoading(true);

      const result = await authService.resetPassword(email);

      if (!result.success) {
        setError(result.message);
        return result;
      }

      return result;
    } catch (err) {
      const errorMsg = "Password reset failed. Please try again.";
      setError(errorMsg);
      console.error("Reset password error:", err);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setError(null);

      const result = await authService.updateUserProfile(user.uid, updates);

      if (result.success) {
        setUserProfile((prev) => ({ ...prev, ...updates }));
      } else {
        setError(result.message);
      }

      return result;
    } catch (err) {
      const errorMsg = "Failed to update profile";
      setError(errorMsg);
      console.error("Update profile error:", err);
      return { success: false, message: errorMsg };
    }
  }, [user]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // State
    user,
    userProfile,
    loading,
    error,
    isAuthenticated,

    // Methods
    register,
    login,
    logout,
    resetPassword,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
