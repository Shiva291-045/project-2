import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export const Login = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, clearError } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({ email: "", password: "", general: "" });
  const [touched,  setTouched]  = useState({ email: false, password: false });
  // If redirected here after registration
  const [pendingVerify, setPendingVerify] = useState(location.state?.pendingVerify || false);
  const [verifyEmail,   setVerifyEmail]   = useState(location.state?.email || "");

  useEffect(() => { clearError?.(); }, []);

  const validate = () => {
    const errs = { email: "", password: "", general: "" };
    if (!email.trim())                              errs.email    = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email.";
    if (!password)                                  errs.password = "Password is required.";
    else if (password.length < 6)                   errs.password = "Password must be at least 6 characters.";
    return errs;
  };

  const hasErrors = (e) => Object.values(e).some(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validate();
    if (hasErrors(errs)) { setErrors(errs); return; }

    setLoading(true);
    setErrors({ email: "", password: "", general: "" });

    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.success) {
      navigate(location.state?.from || "/dashboard", { replace: true });
    } else {
      if (result.needsVerification) {
        setPendingVerify(true);
        setVerifyEmail(email.trim().toLowerCase());
        setErrors({ email: "", password: "", general: "" });
        navigate("/verify-email", { state: { email: email.trim().toLowerCase() } });
      } else if (result.message?.toLowerCase().includes("email")) {
        setErrors({ email: result.message, password: "", general: "" });
      } else if (result.message?.toLowerCase().includes("password")) {
        setErrors({ email: "", password: result.message, general: "" });
      } else {
        setErrors({ email: "", password: "", general: result.message });
      }
    }
  };

  const cls = (field) => `w-full pl-11 pr-4 py-3 rounded-xl bg-gray-700/60 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${touched[field] && errors[field] ? "border-red-500/70 bg-red-500/10" : "border-gray-600/50"}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 mb-4 shadow-xl hover:scale-105 transition-transform">
            <span className="text-white font-bold text-2xl">P</span>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-1">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Sign in to your PrepAI account</p>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="p-8 space-y-5" noValidate>
            {errors.general && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{errors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors((p) => ({ ...p, email: "" })); }} onBlur={() => setTouched((p) => ({ ...p, email: true }))} placeholder="you@example.com" autoComplete="email" className={cls("email")} />
              </div>
              {touched.email && errors.email && <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors((p) => ({ ...p, password: "" })); }} onBlur={() => setTouched((p) => ({ ...p, password: true }))} placeholder="••••••••" autoComplete="current-password" className={`${cls("password")} pr-11`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : "Sign In"}
            </button>
          </form>

          <div className="px-8 pb-8 text-center border-t border-gray-700/50 pt-5 space-y-3">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold">Create one free</Link>
            </p>
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-5 p-4 rounded-xl bg-gray-800/40 border border-gray-700/40 text-center">
          <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Demo Account</p>
          <p className="text-xs text-gray-400 font-mono">demo@prepai.com · Demo@12345</p>
          <button onClick={() => { setEmail("demo@prepai.com"); setPassword("Demo@12345"); setErrors({ email: "", password: "", general: "" }); setTouched({}); toast("Demo credentials filled!", { icon: "💡" }); }}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2">
            Fill demo credentials
          </button>
        </div>
      </div>
    </div>
  );
};
