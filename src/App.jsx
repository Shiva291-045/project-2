import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { LoadingScreen } from "./components/LoadingScreen";

import { Landing }        from "./features/landing/Landing";
import { Login }          from "./features/auth/Login";
import { Register }       from "./features/auth/Register";
import { VerifyEmail }    from "./features/auth/VerifyEmail";
import { ForgotPassword } from "./features/auth/ForgotPassword";
import { Dashboard }      from "./features/dashboard/Dashboard";
import { InterviewRoom }  from "./features/interview/InterviewRoom";
import { CodingPractice } from "./features/coding/CodingPractice";
import { Analytics }      from "./features/analytics/Analytics";
import { Leaderboard }    from "./features/leaderboard/Leaderboard";
import { ResumeAnalyzer } from "./features/resume/ResumeAnalyzer";
import { Profile }        from "./features/profile/Profile";
import { Pricing }        from "./features/pricing/Pricing";
import ProtectedRoute     from "./components/ProtectedRoute";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen message="Initializing PrepAI..." />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/"                element={<Landing />} />
    <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/verify-email"    element={<VerifyEmail />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/pricing"         element={<Pricing />} />

    <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/interview"   element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
    <Route path="/coding"      element={<ProtectedRoute><CodingPractice /></ProtectedRoute>} />
    <Route path="/analytics"   element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
    <Route path="/resume"      element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
    <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0f0f24",
              color: "#e8e8f0",
              borderRadius: "14px",
              border: "1px solid rgba(155,93,229,0.25)",
              fontSize: "14px",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(123,47,247,0.1)",
            },
            success: { iconTheme: { primary: "#00f5d4", secondary: "#0f0f24" } },
            error:   { iconTheme: { primary: "#f15bb5", secondary: "#0f0f24" } },
          }}
        />
      </Router>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
