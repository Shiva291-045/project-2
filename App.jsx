import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppLayout from "./components/layout/AppLayout";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import InterviewRoom from "./pages/InterviewRoom";
import CodingPractice from "./pages/CodingPractice";
import Analytics from "./pages/Analytics";
import TopicPractice from "./pages/TopicPractice";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";

import "./index.css";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      {/* Protected routes inside AppLayout */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume" element={<ResumeAnalyzer />} />
        <Route path="/interview" element={<InterviewRoom />} />
        <Route path="/coding" element={<CodingPractice />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/topics" element={<TopicPractice />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#16162a",
                color: "#f1f5f9",
                border: "1px solid #2a2a45",
                fontFamily: "'DM Sans', sans-serif",
                borderRadius: "12px",
              },
              success: { iconTheme: { primary: "#00f5d4", secondary: "#16162a" } },
              error: { iconTheme: { primary: "#f87171", secondary: "#16162a" } },
            }}
          />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}