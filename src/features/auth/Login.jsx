import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../../components/ui";
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
  const [pendingVerify, setPendingVerify] = useState(location.state?.pendingVerify || false);

  useEffect(() => { clearError?.(); }, [clearError]);

  const validate = () => {
    const errs = { email: "", password: "", general: "" };
    if (!email.trim())                              errs.email    = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email.";
    if (!password)                                  errs.password = "Password is required.";
    else if (password.length < 6)                   errs.password = "At least 6 characters.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validate();
    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }
    setLoading(true); setErrors({ email: "", password: "", general: "" });
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (result.success) {
      navigate(location.state?.from || "/dashboard", { replace: true });
    } else if (result.needsVerification) {
      navigate("/verify-email", { state: { email: email.trim().toLowerCase() } });
    } else {
      setErrors({ email: "", password: "", general: result.message || "Login failed." });
    }
  };

  return (
    <div className="min-h-screen bg-surface flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/8 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-neon-cyan/5 blur-3xl" />

      {/* Left decorative panel (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.img
            src="/logo.png" alt="PrepAI"
            className="w-28 h-28 rounded-3xl mx-auto mb-8 shadow-[0_0_60px_rgba(123,47,247,0.5)]"
            animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity }}
          />
          <h2 className="font-display text-4xl font-extrabold mb-4">
            Welcome back to<br /><span className="gradient-text">PrepAI</span>
          </h2>
          <p className="text-gray-400 mb-10 leading-relaxed">Your AI-powered interview coach is ready.<br />Let's continue your preparation journey.</p>
          <div className="space-y-3 text-left max-w-xs mx-auto">
            {["Dynamic AI follow-up questions", "Detailed performance analytics", "450+ DSA problems with hints", "Real interviewer simulation"].map(t => (
              <div key={t} className="flex items-center gap-3 glass rounded-xl px-4 py-2.5 border border-[rgba(155,93,229,0.1)]">
                <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_6px_rgba(0,245,212,0.8)]" />
                <span className="text-sm text-gray-300">{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.png" alt="PrepAI" className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-brand" />
            <h1 className="font-display text-2xl font-bold gradient-text">PrepAI</h1>
          </div>

          <div className="glass-strong rounded-3xl p-8 border border-[rgba(155,93,229,0.2)] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold text-white">Sign in</h2>
              <p className="text-gray-500 mt-1 text-sm">Don't have an account? <Link to="/register" className="text-neon-purple hover:text-brand-300 transition-colors">Create one free</Link></p>
            </div>

            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {errors.general}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); if (touched.email) setErrors(v => ({ ...v, email: "" })); }}
                    onBlur={() => setTouched(v => ({ ...v, email: true }))}
                    placeholder="you@company.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-surface-card border text-white placeholder-gray-600 focus:outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(123,47,247,0.15)] ${errors.email ? "border-red-500/60" : "border-[rgba(155,93,229,0.2)] focus:border-neon-purple/60"}`}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <Link to="/forgot-password" className="text-xs text-neon-purple hover:text-brand-300 transition-colors">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPw ? "text" : "password"} value={password}
                    onChange={e => { setPassword(e.target.value); if (touched.password) setErrors(v => ({ ...v, password: "" })); }}
                    onBlur={() => setTouched(v => ({ ...v, password: true }))}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl bg-surface-card border text-white placeholder-gray-600 focus:outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(123,47,247,0.15)] ${errors.password ? "border-red-500/60" : "border-[rgba(155,93,229,0.2)] focus:border-neon-purple/60"}`}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600">By signing in, you agree to our <a href="#" className="text-gray-500 hover:text-gray-400">Terms</a> and <a href="#" className="text-gray-500 hover:text-gray-400">Privacy Policy</a>.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
