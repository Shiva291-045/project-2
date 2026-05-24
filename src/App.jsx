import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

import { Landing }        from "./features/landing/Landing";
import { Login }          from "./features/auth/Login";
import { Register }       from "./features/auth/Register";
import { Dashboard }      from "./features/dashboard/Dashboard";
import { InterviewRoom }  from "./features/interview/InterviewRoom";
import { CodingPractice } from "./features/coding/CodingPractice";
import { Analytics }      from "./features/analytics/Analytics";
import { Leaderboard }    from "./features/leaderboard/Leaderboard";
import { ResumeAnalyzer } from "./features/resume/ResumeAnalyzer";
import { Profile }        from "./features/profile/Profile";
import ProtectedRoute     from "./components/ProtectedRoute";

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
    </div>
  </div>
);

// Redirect authenticated users away from /login and /register
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading)          return <Spinner />;
  if (isAuthenticated)  return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/"         element={<Landing />} />
    <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    {/* Protected — all render inside layout (Sidebar + Header) */}
    <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/interview"   element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
    <Route path="/coding"      element={<ProtectedRoute><CodingPractice /></ProtectedRoute>} />
    <Route path="/analytics"   element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
    <Route path="/resume"      element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
    <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />

    {/* Fallback */}
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
              background: "#1f2937",
              color: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #374151",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#10b981", secondary: "#fff" }, duration: 3000 },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" }, duration: 5000 },
          }}
        />
      </Router>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
