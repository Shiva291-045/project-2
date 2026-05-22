/**
 * useAuth Hook
 * Provides access to authentication context
 * Must be used within AuthProvider
 */

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider. " +
      "Make sure your component is wrapped with AuthProvider in the component tree."
    );
  }

  return context;
};
