import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export const Login = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, clearError } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  // Per-field errors shown after submit attempt
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "", general: "" });
  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => { clearError?.(); }, []);

  // ── Client-side field validation ────────────────────────────────────
  const validateLocal = () => {
    const errs = { email: "", password: "", general: "" };
    if (!email.trim())
      errs.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "Please enter a valid email address.";
    if (!password)
      errs.password = "Password is required.";
    else if (password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    return errs;
  };

  const hasLocalErrors = (errs) => errs.email || errs.password;

  // ── Submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const localErrs = validateLocal();
    if (hasLocalErrors(localErrs)) {
      setFieldErrors(localErrs);
      return;
    }

    setLoading(true);
    setFieldErrors({ email: "", password: "", general: "" });

    const result = await login(email.trim(), password);

    setLoading(false);

    if (result.success) {
      navigate(location.state?.from || "/dashboard", { replace: true });
    } else {
      // Map backend error codes to specific field hints
      const code = result.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setFieldErrors({ email: "No account found with this email.", password: "", general: "" });
      } else if (code === "auth/wrong-password") {
        setFieldErrors({ email: "", password: "Incorrect password. Please try again.", general: "" });
      } else if (code === "auth/invalid-email") {
        setFieldErrors({ email: "Please enter a valid email address.", password: "", general: "" });
      } else if (code === "auth/too-many-requests") {
        setFieldErrors({ email: "", password: "", general: "Too many failed attempts. Please wait and try again." });
      } else {
        setFieldErrors({ email: "", password: "", general: result.message || "Sign in failed. Please try again." });
      }
      toast.error(result.message || "Sign in failed.");
    }
  };

  const inputClass = (field) =>
    `w-full pl-11 pr-4 py-3 rounded-xl bg-gray-700/60 border text-white placeholder-gray-500
     focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
      touched[field] && fieldErrors[field]
        ? "border-red-500/70 bg-red-500/10"
        : "border-gray-600/50 hover:border-gray-500/60"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 mb-4 shadow-xl hover:scale-105 transition-transform">
            <span className="text-white font-bold text-2xl">P</span>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-1">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm">Sign in to continue to PrepAI</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="p-8 space-y-5" noValidate>

            {/* General error banner */}
            {fieldErrors.general && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{fieldErrors.general}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email)
                      setFieldErrors((p) => ({ ...p, email: "" }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputClass("email")}
                />
              </div>
              {touched.email && fieldErrors.email && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password)
                      setFieldErrors((p) => ({ ...p, password: "" }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${inputClass("password")} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : "Sign In"}
            </button>
          </form>

          <div className="px-8 pb-8 text-center border-t border-gray-700/50 pt-5">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-5 p-4 rounded-xl bg-gray-800/40 border border-gray-700/40 text-center">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Demo credentials</p>
          <p className="text-xs text-gray-400 font-mono">demo@prepai.com</p>
          <p className="text-xs text-gray-400 font-mono">Demo@12345</p>
          <button
            type="button"
            onClick={() => { setEmail("demo@prepai.com"); setPassword("Demo@12345"); setFieldErrors({ email: "", password: "", general: "" }); setTouched({}); toast("Demo credentials filled — click Sign In", { icon: "💡" }); }}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
          >
            Fill demo credentials
          </button>
        </div>

      </div>
    </div>
  );
};
