import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const STEPS = { EMAIL: "email", OTP: "otp", PASSWORD: "password", DONE: "done" };

const PW_RULES = [
  { label: "8+ characters",         test: (p) => p.length >= 8 },
  { label: "Uppercase letter",      test: (p) => /[A-Z]/.test(p) },
  { label: "Number",                test: (p) => /\d/.test(p) },
  { label: "Special character",     test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, resendOTP } = useAuth();

  const [step,     setStep]     = useState(STEPS.EMAIL);
  const [email,    setEmail]    = useState("");
  const [otp,      setOtp]      = useState("");
  const [newPw,    setNewPw]    = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const t = setInterval(() => setCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email."); return;
    }
    setLoading(true); setError("");
    const result = await forgotPassword(email.trim().toLowerCase());
    setLoading(false);
    if (result.success || result.message) {
      setStep(STEPS.OTP);
      startCooldown();
    }
  };

  const handleOTPSubmit = (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    setError(""); setStep(STEPS.PASSWORD);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const passed = PW_RULES.filter((r) => r.test(newPw)).length;
    if (passed < 4) { setError("Password does not meet all requirements."); return; }
    setLoading(true); setError("");
    const result = await resetPassword(email, otp, newPw);
    setLoading(false);
    if (result.success) { setStep(STEPS.DONE); }
    else { setError(result.message || "Reset failed."); setStep(STEPS.OTP); }
  };

  const handleResend = async () => {
    const result = await resendOTP(email, "reset");
    if (result.success) startCooldown();
  };

  const inputCls = "w-full pl-11 pr-4 py-3 rounded-xl bg-surface-elevated/60 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-neon-purple text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
          <h1 className="text-3xl font-bold text-white mb-1">Reset Password</h1>
          <p className="text-gray-400 text-sm">
            {step === STEPS.EMAIL && "Enter your email to receive a reset OTP"}
            {step === STEPS.OTP  && `Enter the OTP sent to ${email}`}
            {step === STEPS.PASSWORD && "Set your new password"}
            {step === STEPS.DONE && "Password reset complete!"}
          </p>
        </div>

        <div className="glass-strong rounded-3xl border border-[rgba(155,93,229,0.2)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-8">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[STEPS.EMAIL, STEPS.OTP, STEPS.PASSWORD].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === STEPS.DONE || [STEPS.EMAIL,STEPS.OTP,STEPS.PASSWORD].indexOf(step) > i
                    ? "bg-green-500 text-white"
                    : step === s ? "bg-brand-500 text-white" : "bg-surface-elevated text-gray-500"
                }`}>
                  {step === STEPS.DONE || [STEPS.EMAIL,STEPS.OTP,STEPS.PASSWORD].indexOf(step) > i
                    ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 max-w-8 rounded ${[STEPS.EMAIL,STEPS.OTP,STEPS.PASSWORD].indexOf(step) > i || step === STEPS.DONE ? "bg-green-500" : "bg-surface-elevated"}`} />}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {step === STEPS.EMAIL && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com" className={inputCls} autoFocus />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-neon-blue text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending OTP…</> : "Send Reset OTP"}
              </button>
            </form>
          )}

          {step === STEPS.OTP && (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">6-Digit OTP</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="123456" className={`${inputCls} text-center text-xl tracking-widest font-mono`} autoFocus />
                </div>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-neon-blue text-white font-semibold flex items-center justify-center gap-2">
                Verify OTP
              </button>
              <button type="button" onClick={handleResend} disabled={cooldown > 0} className="w-full text-sm text-neon-purple hover:text-neon-purple disabled:text-gray-600 flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3" />{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
              </button>
            </form>
          )}

          {step === STEPS.PASSWORD && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type={showPw ? "text" : "password"} value={newPw} onChange={(e) => { setNewPw(e.target.value); setError(""); }} placeholder="••••••••" className={`${inputCls} pr-11`} autoFocus />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {newPw && (
                <div className="space-y-1">
                  {PW_RULES.map((r) => (
                    <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.test(newPw) ? "text-green-400" : "text-gray-500"}`}>
                      {r.test(newPw) ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-600" />}
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-neon-blue text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting…</> : "Reset Password"}
              </button>
            </form>
          )}

          {step === STEPS.DONE && (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-white font-semibold text-lg mb-2">Password Reset!</p>
              <p className="text-gray-400 text-sm mb-6">You can now sign in with your new password.</p>
              <button onClick={() => navigate("/login")} className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-neon-blue text-white font-semibold">
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
