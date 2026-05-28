import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle, ArrowRight, Check } from "lucide-react";
import { Button } from "../../components/ui";

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [touched, setTouched] = useState({});

  const pwStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = pwStrength(form.password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-neon-cyan"][strength];

  const validate = () => {
    if (!form.name.trim())                          return "Full name is required.";
    if (form.name.trim().length < 2)               return "Name must be at least 2 characters.";
    if (!form.email.trim())                         return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email.";
    if (!form.password)                             return "Password is required.";
    if (form.password.length < 6)                  return "Password must be at least 6 characters.";
    if (form.password !== form.confirm)             return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    const result = await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
    setLoading(false);
    if (result.success) {
      navigate("/verify-email", { state: { email: form.email.trim().toLowerCase() } });
    } else {
      setError(result.message || "Registration failed.");
    }
  };

  const field = (key, label, type, placeholder, Icon) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type={type} value={form[key]}
          onChange={e => setForm(v => ({ ...v, [key]: e.target.value }))}
          onBlur={() => setTouched(v => ({ ...v, [key]: true }))}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-card border border-[rgba(155,93,229,0.2)] text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/60 focus:shadow-[0_0_0_3px_rgba(123,47,247,0.15)] transition-all duration-200"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-brand-500/8 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.img
            src="/logo.png" alt="PrepAI"
            className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-brand"
            animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity }}
          />
          <h1 className="font-display text-3xl font-extrabold text-white">Create your account</h1>
          <p className="text-gray-500 mt-1 text-sm">Already have one? <Link to="/login" className="text-neon-purple hover:text-brand-300 transition-colors">Sign in</Link></p>
        </div>

        <div className="glass-strong rounded-3xl p-8 border border-[rgba(155,93,229,0.2)] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field("name",  "Full Name",  "text",     "Jane Smith",       User)}
            {field("email", "Email",      "email",    "you@company.com",  Mail)}

            {/* Password with strength */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPw ? "text" : "password"} value={form.password}
                  onChange={e => setForm(v => ({ ...v, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-surface-card border border-[rgba(155,93,229,0.2)] text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/60 focus:shadow-[0_0_0_3px_rgba(123,47,247,0.15)] transition-all duration-200"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(n => (
                      <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= n ? strengthColor : "bg-white/10"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Strength: <span className="text-gray-300">{strengthLabel}</span></p>
                </div>
              )}
            </div>

            {field("confirm", "Confirm Password", showPw ? "text" : "password", "Repeat password", Lock)}

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          By registering, you agree to our{" "}
          <a href="#" className="text-gray-500 hover:text-gray-400">Terms of Service</a> and{" "}
          <a href="#" className="text-gray-500 hover:text-gray-400">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
};
