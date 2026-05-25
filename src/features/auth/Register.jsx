import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader, CheckCircle, XCircle } from "lucide-react";

// ── Password rules ──────────────────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: "len",   label: "At least 8 characters",          test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter (A-Z)",      test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter (a-z)",      test: (p) => /[a-z]/.test(p) },
  { id: "num",   label: "One number (0-9)",                test: (p) => /\d/.test(p) },
  { id: "spec",  label: "One special character (!@#$...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getStrength = (password) => PASSWORD_RULES.filter((r) => r.test(password)).length;

const STRENGTH_LABEL = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const STRENGTH_COLOR = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
const STRENGTH_TEXT  = ["", "text-red-400", "text-orange-400", "text-yellow-400", "text-blue-400", "text-green-400"];

export const Register = () => {
  const navigate = useNavigate();
  const { register, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => { clearError?.(); }, [clearError]);
  useEffect(() => { if (authError) toast.error(authError); }, [authError]);

  const strength = getStrength(formData.password);

  // ── Field-level validation ──────────────────────────────────────────
  const validateField = (name, value, allData = formData) => {
    switch (name) {
      case "displayName":
        if (!value.trim())           return "Full name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        if (value.trim().length > 50) return "Name must be under 50 characters";
        return "";
      case "email":
        if (!value.trim())                       return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address";
        return "";
      case "password":
        if (!value)             return "Password is required";
        if (value.length < 8)   return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(value)) return "Password needs at least one uppercase letter";
        if (!/[0-9]/.test(value)) return "Password needs at least one number";
        return "";
      case "confirmPassword":
        if (!value)                        return "Please confirm your password";
        if (value !== allData.password)    return "Passwords do not match";
        return "";
      default:
        return "";
    }
  };

  const validateAll = (data = formData) => {
    const errs = {};
    ["displayName", "email", "password", "confirmPassword"].forEach((k) => {
      const e = validateField(k, data[k], data);
      if (e) errs[k] = e;
    });
    return errs;
  };

  // ── Handlers ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    if (touched[name]) {
      setErrors((p) => ({ ...p, [name]: validateField(name, value, updated) }));
    }
    // Re-validate confirmPassword when password changes
    if (name === "password" && touched.confirmPassword) {
      setErrors((p) => ({ ...p, confirmPassword: validateField("confirmPassword", updated.confirmPassword, updated) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mark all fields touched
    setTouched({ displayName: true, email: true, password: true, confirmPassword: true });

    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fix all errors before continuing");
      return;
    }

    setLoading(true);
    try {
      // AuthContext.register signature: (name, email, password)
      const result = await register(
        formData.displayName.trim(),
        formData.email.trim(),
        formData.password
      );
      if (result.success) {
        // After registration, user must verify email — redirect to verify page
        navigate("/verify-email", {
          replace: true,
          state: { email: formData.email.trim() },
        });
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Helper for input border color
  const borderClass = (field) => {
    if (!touched[field]) return "border-gray-600/50";
    return errors[field] ? "border-red-500/60 bg-red-500/10" : "border-green-500/50 bg-green-500/5";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Join PrepAI
          </h1>
          <p className="text-gray-400">Start your AI-powered interview preparation</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-5" noValidate>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="John Doe"
                  autoComplete="name"
                  className={`w-full pl-12 pr-4 py-3 rounded-lg bg-gray-700/50 border text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${borderClass("displayName")}`}
                />
              </div>
              {touched.displayName && errors.displayName && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {errors.displayName}
                </p>
              )}
              {touched.displayName && !errors.displayName && formData.displayName && (
                <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Looks good!
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full pl-12 pr-4 py-3 rounded-lg bg-gray-700/50 border text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${borderClass("email")}`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
              {touched.email && !errors.email && formData.email && (
                <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Valid email
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full pl-12 pr-12 py-3 rounded-lg bg-gray-700/50 border text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${borderClass("password")}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Strength bar */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          n <= strength ? STRENGTH_COLOR[strength] : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${STRENGTH_TEXT[strength]}`}>
                    {STRENGTH_LABEL[strength]}
                  </p>
                </div>
              )}

              {/* Password rules checklist */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(formData.password);
                    return (
                      <div key={rule.id} className={`flex items-center gap-1.5 text-xs ${passed ? "text-green-400" : "text-gray-500"}`}>
                        {passed
                          ? <CheckCircle className="w-3 h-3 flex-shrink-0" />
                          : <XCircle className="w-3 h-3 flex-shrink-0" />
                        }
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              )}

              {touched.password && errors.password && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full pl-12 pr-12 py-3 rounded-lg bg-gray-700/50 border text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${borderClass("confirmPassword")}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {errors.confirmPassword}
                </p>
              )}
              {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && (
                <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Login link */}
          <div className="px-8 pb-8 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          By registering you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
