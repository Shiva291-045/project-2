import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Mail, Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export const VerifyEmail = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { verifyEmail, resendOTP } = useAuth();

  const email    = location.state?.email || "";
  const [otp, setOtp]       = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]   = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate("/login");
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setError("");
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft"  && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }

    setLoading(true); setError("");
    const result = await verifyEmail(email, code);
    setLoading(false);

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.message || "Verification failed.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResending(true);
    const result = await resendOTP(email, "verify");
    setResending(false);
    if (result.success) setCooldown(60);
  };

  // Auto-submit when all 6 digits filled — use the code directly to avoid stale closure
  useEffect(() => {
    const code = otp.join("");
    if (code.length !== 6 || !otp.every(Boolean)) return;
    (async () => {
      setLoading(true); setError("");
      const result = await verifyEmail(email, code);
      setLoading(false);
      if (result.success) {
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.message || "Verification failed.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    })();
  }, [otp]); // otp is the only trigger; verifyEmail/navigate/email are stable refs

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="PrepAI" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-brand object-contain" />
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-gray-400 text-sm">
            We sent a 6-digit OTP to <span className="text-neon-purple font-medium">{email}</span>
          </p>
        </div>

        <div className="glass-strong rounded-3xl border border-[rgba(155,93,229,0.2)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-8">
          {/* OTP boxes */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-surface-elevated/60 text-white focus:outline-none transition-all ${
                  digit ? "border-neon-purple bg-purple-500/10" : "border-gray-600/50"
                } ${error ? "border-red-500/60" : ""}`}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 justify-center mb-4 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            onClick={handleSubmit} disabled={loading || otp.some((d) => !d)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-neon-blue hover:from-purple-700 hover:to-cyan-700 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying…</> : <><CheckCircle className="w-4 h-4" />Verify Email</>}
          </button>

          <div className="text-center">
            <button
              onClick={handleResend} disabled={resending || cooldown > 0}
              className="text-sm text-neon-purple hover:text-neon-purple disabled:text-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-1 mx-auto"
            >
              {resending ? <><Loader2 className="w-3 h-3 animate-spin" />Sending…</> :
               cooldown > 0 ? `Resend OTP in ${cooldown}s` :
               <><RefreshCw className="w-3 h-3" />Resend OTP</>}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 text-sm mt-5">
          Wrong email?{" "}
          <Link to="/register" className="text-neon-purple hover:text-neon-purple">Register again</Link>
        </p>
      </div>
    </div>
  );
};
