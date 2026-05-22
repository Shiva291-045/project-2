/**
 * Login Page
 * Production-ready login with comprehensive validation, error handling, and UX
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  validateEmail,
  validateField,
  FORM_RULES,
  trimFormValues,
} from "../../utils/validation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, Loader } from "lucide-react";

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, error: authError, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear auth error on component mount
  useEffect(() => {
    clearError?.();
  }, [clearError]);

  // Display auth errors
  useEffect(() => {
    if (authError) {
      toast.error(authError);
    }
  }, [authError]);

  /**
   * Handle field change with real-time validation
   */
  const handleFieldChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field if it's been touched
    if (touched[name]) {
      const validation = validateField(name, value, FORM_RULES);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validation.error,
      }));
    }
  };

  /**
   * Handle field blur
   */
  const handleFieldBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const validation = validateField(name, value, FORM_RULES);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validation.error,
    }));
  };

  /**
   * Validate entire form
   */
  const validateForm = () => {
    const errors = {};
    const trimmed = trimFormValues(formData);

    // Validate email
    const emailValidation = validateEmail(trimmed.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    // Validate password
    if (!trimmed.password) {
      errors.password = "Password is required";
    }

    return errors;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Please fix the errors below");
      return;
    }

    try {
      setLoading(true);

      const trimmed = trimFormValues(formData);

      // Call login function
      const result = await login(trimmed.email, trimmed.password);

      if (result.success) {
        toast.success("Login successful!");

        const from = location.state?.from || "/dashboard";
        navigate(from, { replace: true });
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoEmail = "demo@example.com";
    const demoPassword = "Demo@12345";
    const demoName = "Demo User";

    try {
      setLoading(true);

      const loginResult = await login(demoEmail, demoPassword);

      if (loginResult.success) {
        toast.success("Demo login successful!");
        const from = location.state?.from || "/dashboard";
        navigate(from, { replace: true });
        return;
      }

      // If demo login fails, attempt to create the demo account and retry login.
      const registerResult = await register(demoEmail, demoPassword, demoName);
      if (registerResult.success) {
        toast.success("Demo account created and logged in!");
        const from = location.state?.from || "/dashboard";
        navigate(from, { replace: true });
        return;
      }

      // If the demo account already exists, try logging in again.
      if (registerResult.error === "auth/email-already-in-use") {
        const secondTry = await login(demoEmail, demoPassword);
        if (secondTry.success) {
          toast.success("Demo login successful!");
          const from = location.state?.from || "/dashboard";
          navigate(from, { replace: true });
          return;
        }
      }

      console.error("Demo login failure details:", {
        loginResult,
        registerResult,
      });
      toast.error(
        loginResult.message || registerResult.message || "Demo login failed"
      );
    } catch (err) {
      console.error("Demo login error:", err);
      toast.error("Demo login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasEmailError = touched.email && fieldErrors.email;
  const hasPasswordError = touched.password && fieldErrors.password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400">
            Sign in to your PrepAI account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  placeholder="you@example.com"
                  className={`w-full pl-12 pr-4 py-3 rounded-lg bg-gray-700/50 border transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    hasEmailError
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-gray-600/50"
                  }`}
                />
              </div>
              {hasEmailError && (
                <p className="text-red-400 text-sm mt-2">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3 rounded-lg bg-gray-700/50 border transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    hasPasswordError
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-gray-600/50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {hasPasswordError && (
                <p className="text-red-400 text-sm mt-2">{fieldErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-gray-700/50 border-gray-600/50 text-purple-600 cursor-pointer"
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-300">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full mt-3 py-3 rounded-lg border border-blue-500 text-blue-200 hover:bg-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Try Demo Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative px-8 py-4">
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          </div>

          {/* Register Link */}
          <div className="px-8 pb-8">
            <p className="text-center text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 rounded-lg bg-blue-900/20 border border-blue-700/30">
          <p className="text-xs text-blue-300 mb-2">
            <strong>Demo Credentials:</strong>
          </p>
          <p className="text-xs text-blue-400">
            Email: demo@example.com<br />
            Password: Demo@12345
          </p>
        </div>
      </div>
    </div>
  );
};
