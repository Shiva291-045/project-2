import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, Loader, Zap } from "lucide-react";

const DEMO_EMAIL = "demo@prepai.com";
const DEMO_PASSWORD = "Demo@12345";

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoFilled, setDemoFilled] = useState(false);

  useEffect(() => { clearError?.(); }, [clearError]);

  useEffect(() => {
    if (authError) toast.error(authError);
  }, [authError]);

  // ── Validation ──────────────────────────────────────────────────────
  const validate = (data) => {
    const errs = {};
    if (!data.email)                          errs.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email)) errs.email    = "Enter a valid email";
    if (!data.password)                       errs.password = "Password is required";
    else if (data.password.length < 6)        errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setDemoFilled(false);
    if (touched[name]) {
      setErrors((p) => ({ ...p, [name]: validate({ ...formData, [name]: value })[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: validate(formData)[name] }));
  };

  // ── Submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fix the errors below");
      return;
    }
    setLoading(true);
    try {
      const result = await login(formData.email.trim(), formData.password);
      if (result.success) {
        navigate(location.state?.from || "/dashboard", { replace: true });
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ── Fill demo credentials into the form (does NOT auto-login) ───────
  const handleFillDemo = () => {
    setFormData({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setErrors({});
    setTouched({});
    setDemoFilled(true);
    toast.success("Demo credentials filled! Click Sign In to continue.");
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
            Welcome Back
          </h1>
          <p className="text-gray-400">Sign in to your PrepAI account</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-5">

            {/* Demo credentials hint banner */}
            {demoFilled && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-900/30 border border-green-700/50">
                <Zap className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-300">
                  Demo credentials filled. Review them below and click <strong>Sign In</strong>.
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
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
                  className={`w-full pl-12 pr-4 py-3 rounded-lg bg-gray-700/50 border text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    touched.email && errors.email
                      ? "border-red-500/60 bg-red-500/10"
                      : demoFilled
                      ? "border-green-500/60 bg-green-500/10"
                      : "border-gray-600/50"
                  }`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-12 pr-12 py-3 rounded-lg bg-gray-700/50 border text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    touched.password && errors.password
                      ? "border-red-500/60 bg-red-500/10"
                      : demoFilled
                      ? "border-green-500/60 bg-green-500/10"
                      : "border-gray-600/50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-xs text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            {/* Fill Demo Credentials button */}
            <button
              type="button"
              onClick={handleFillDemo}
              disabled={loading}
              className="w-full py-3 rounded-lg border border-purple-500/60 text-purple-300 hover:bg-purple-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Zap className="w-4 h-4" />
              Use Demo Credentials
            </button>
          </form>

          {/* Register link */}
          <div className="px-8 pb-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials info box */}
        <div className="mt-5 p-4 rounded-xl bg-gray-800/60 border border-gray-700/50">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Demo Credentials</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Email</span>
              <span className="text-xs text-gray-300 font-mono">{DEMO_EMAIL}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Password</span>
              <span className="text-xs text-gray-300 font-mono">{DEMO_PASSWORD}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click <span className="text-purple-400">"Use Demo Credentials"</span> to auto-fill, then click Sign In.
          </p>
        </div>
      </div>
    </div>
  );
};
