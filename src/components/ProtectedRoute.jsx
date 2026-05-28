import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "./LoadingScreen";

const ProtectedRoute = ({ children, requirePremium = false }) => {
  const { isAuthenticated, loading, userProfile } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen message="Checking authentication..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requirePremium && !userProfile?.isPremium) {
    return <Navigate to="/pricing" replace />;
  }

  return children;
};

export default ProtectedRoute;
