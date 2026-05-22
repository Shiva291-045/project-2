/**
 * Register Page
 * Production-ready registration with comprehensive validation and error handling
 */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  validateEmail,
  validatePassword,
  validateName,
  validateField,
  passwordsMatch,
  FORM_RULES,
  trimFormValues,
  getPasswordStrengthColor,
  getPasswordStrengthPercent,
} from "../../utils/validation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader, CheckCircle } from "lucide-react";

export const Register = () => {
  const navigate = useNavigate();
  const { register, error: authError, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

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

    // Update password strength
    if (name === "password") {
      const validation = validatePassword(value);
      setPasswordStrength(validation.strength);
    }

    // Validate field if it's been touched
    if (touched[name]) {
      if (name === "confirmPassword" && touched.password) {
        // Check if passwords match
        if (!passwordsMatch(formData.password, value)) {
          setFieldErrors((prev) => ({
            ...prev,
            [name]: "Passwords do not match",
          }));
        } else {
          setFieldErrors((prev) => ({
            ...prev,
            [name]: null,
          }));
        }
      } else {
        const validation = validateField(name, value, FORM_RULES);
        setFieldErrors((prev) => ({
          ...prev,
          [name]: validation.error,
        }));
      }
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

    if (name === "confirmPassword" && touched.password) {
      if (!passwordsMatch(formData.password, value)) {
        setFieldErrors((prev) => ({
          ...prev,
          [name]: "Passwords do not match",
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          [name]: null,
        }));
      }
    } else {
      const validation = validateField(name, value, FORM_RULES);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validation.error,
      }));
    }
  };

  /**
   * Validate entire form
   */
  const validateForm = () => {
    const errors = {};
    const trimmed = trimFormValues(formData);

    // Validate name
    const nameValidation = validateName(trimmed.displayName);
    if (!nameValidation.isValid) {
      errors.displayName = nameValidation.errors[0];
    }

    // Validate email
    const emailValidation = validateEmail(trimmed.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    // Validate password
    const passwordValidation = validatePassword(trimmed.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }

    // Check password match
    if (!passwordsMatch(trimmed.password, trimmed.confirmPassword)) {
      errors.confirmPassword = "Passwords do not match";
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

      // Call register function
      const result = await register(
        trimmed.email,
        trimmed.password,
        trimmed.displayName
      );

      if (result.success) {
        toast.success("Account created successfully!");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const hasNameError = touched.displayName && fieldErrors.displayName;
  const hasEmailError = touched.email && fieldErrors.email;
  const hasPasswordError = touched.password && fieldErrors.password;
  const hasConfirmPasswordError =
    touched.confirmPassword && fieldErrors.confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Join PrepAI
          </h1>
          <p className="text-gray-400">
            Start your AI-powered interview preparation
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  placeholder="John Doe"
                  className={`w-full pl-12 pr-4 py-3 rounded-lg bg-gray-700/50 border transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    hasNameError
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-gray-600/50"
                  }`}
                />
              </div>
              {hasNameError && (
                <p className="text-red-400 text-sm mt-2">{fieldErrors.displayName}</p>
              )}
            </div>

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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Password Strength</span>
                    <span className="text-xs font-medium text-gray-300">
                      {["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"][
                        passwordStrength
                      ] || "Very Weak"}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getPasswordStrengthColor(
                        passwordStrength
                      )}`}
                      style={{ width: `${getPasswordStrengthPercent(passwordStrength)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {hasPasswordError && (
                <p className="text-red-400 text-sm mt-2">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3 rounded-lg bg-gray-700/50 border transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    hasConfirmPasswordError
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-gray-600/50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {hasConfirmPasswordError && (
                <p className="text-red-400 text-sm mt-2">{fieldErrors.confirmPassword}</p>
              )}
              {formData.confirmPassword &&
                !hasConfirmPasswordError &&
                passwordsMatch(formData.password, formData.confirmPassword) && (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-green-400 text-sm">Passwords match</p>
                  </div>
                )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative px-8 py-4">
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
          </div>

          {/* Login Link */}
          <div className="px-8 pb-8">
            <p className="text-center text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
