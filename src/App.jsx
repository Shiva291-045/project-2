import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Providers
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

// Pages
import { Landing } from "./features/landing/Landing";
import { Login } from "./features/auth/Login";
import { Register } from "./features/auth/Register";
import { Dashboard } from "./features/dashboard/Dashboard";
import { InterviewRoom } from "./features/interview/InterviewRoom";
import { CodingPractice } from "./features/coding/CodingPractice";
import { Analytics } from "./features/analytics/Analytics";
import { Leaderboard } from "./features/leaderboard/Leaderboard";
import { ResumeAnalyzer } from "./features/resume/ResumeAnalyzer";
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * Public Route Component (redirect if already logged in)
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="inline-block">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * App Routes
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/:interviewId?"
        element={
          <ProtectedRoute>
            <InterviewRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coding"
        element={
          <ProtectedRoute>
            <CodingPractice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume"
        element={
          <ProtectedRoute>
            <ResumeAnalyzer />
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/**
 * Root App Component
 */
const App = () => {
  return (
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
                color: "#fff",
                borderRadius: "8px",
                border: "1px solid #374151",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
