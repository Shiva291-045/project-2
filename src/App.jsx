import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

import { Landing }       from "./features/landing/Landing";
import { Login }         from "./features/auth/Login";
import { Register }      from "./features/auth/Register";
import { Dashboard }     from "./features/dashboard/Dashboard";
import { InterviewRoom } from "./features/interview/InterviewRoom";
import { CodingPractice } from "./features/coding/CodingPractice";
import { Analytics }     from "./features/analytics/Analytics";
import { Leaderboard }   from "./features/leaderboard/Leaderboard";
import { ResumeAnalyzer } from "./features/resume/ResumeAnalyzer";
import ProtectedRoute    from "./components/ProtectedRoute";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
    </div>
  </div>
);

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/"          element={<Landing />} />
    <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register"  element={<PublicRoute><Register /></PublicRoute>} />

    <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/interview/:id?"  element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
    <Route path="/interview"       element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
    <Route path="/coding"          element={<ProtectedRoute><CodingPractice /></ProtectedRoute>} />
    <Route path="/analytics"       element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
    <Route path="/leaderboard"     element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
    <Route path="/resume"          element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />

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
            style: { background: "#1f2937", color: "#fff", borderRadius: "8px", border: "1px solid #374151" },
            success: { duration: 3000, iconTheme: { primary: "#10b981", secondary: "#fff" } },
            error: { duration: 4000, iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </Router>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
