import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

/**
 * useAuth Hook
 * Provides access to authentication context and user information
 * Must be used within an AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
