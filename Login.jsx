import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Zap, ArrowRight, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:"", password:"" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back! 🎉");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const tryDemo = async () => {
    setLoading(true);
    try {
      await login("arjun@demo.com", "demo123");
      toast.success("Demo mode activated! 🚀");
      navigate("/dashboard");
    } catch { toast.error("Demo login failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mesh-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center glow-purple"
              style={{ background:"linear-gradient(135deg,#7c3aed,#5b21b6)" }}>
              <Zap size={19} className="text-white" />
            </div>
            <span className="text-[22px] font-extrabold text-white">PrepAI</span>
          </Link>
          <h1 className="text-[28px] font-extrabold text-white mb-2">Welcome back</h1>
          <p className="text-[14px]" style={{ color:"var(--text-secondary)" }}>
            Sign in to continue your interview prep
          </p>
        </div>

        {/* Card */}
        <div className="gradient-border-card p-8">
          {/* Demo banner */}
          <div className="mb-6 p-3 rounded-xl text-[13px] text-center"
            style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)", color:"#a78bfa" }}>
            🎯 Demo: <strong>arjun@demo.com</strong> / <strong>demo123</strong>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color:"var(--text-secondary)" }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:"var(--text-muted)" }} />
                <input name="email" type="email" value={form.email} onChange={handle}
                  placeholder="arjun@demo.com"
                  className="field pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color:"var(--text-secondary)" }}>
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:"var(--text-muted)" }} />
                <input name="password" type={showPass?"text":"password"} value={form.password} onChange={handle}
                  placeholder="••••••••"
                  className="field pl-10 pr-10" />
                <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color:"var(--text-muted)" }} onClick={()=>setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-[13px] font-medium"
                style={{ color:"#a78bfa" }}>Forgot password?</button>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-[15px] mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">Sign In <ArrowRight size={15}/></span>
              )}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor:"var(--border-light)" }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[12px]" style={{ background:"var(--bg-card)", color:"var(--text-muted)" }}>or</span>
            </div>
          </div>

          <button onClick={tryDemo} disabled={loading}
            className="btn-secondary w-full justify-center py-3 text-[14px]">
            ⚡ Try Demo (No signup needed)
          </button>

          <p className="text-center mt-5 text-[13px]" style={{ color:"var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold" style={{ color:"#a78bfa" }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}