import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Zap, ArrowRight, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"Frontend Developer" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("Please fill all fields");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created! Let's start preparing 🚀");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const ROLES = ["Frontend Developer","Backend Developer","Full Stack Developer","Data Scientist","DevOps Engineer","Mobile Developer","Software Engineer"];

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
          <h1 className="text-[28px] font-extrabold text-white mb-2">Create your account</h1>
          <p className="text-[14px]" style={{ color:"var(--text-secondary)" }}>
            Start your AI-powered interview preparation
          </p>
        </div>

        {/* Card */}
        <div className="gradient-border-card p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color:"var(--text-secondary)" }}>Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:"var(--text-muted)" }} />
                <input name="name" type="text" value={form.name} onChange={handle}
                  placeholder="Arjun Sharma" className="field pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color:"var(--text-secondary)" }}>Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:"var(--text-muted)" }} />
                <input name="email" type="email" value={form.email} onChange={handle}
                  placeholder="you@example.com" className="field pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color:"var(--text-secondary)" }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:"var(--text-muted)" }} />
                <input name="password" type={showPass?"text":"password"} value={form.password} onChange={handle}
                  placeholder="Min 6 characters" className="field pl-10 pr-10" />
                <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color:"var(--text-muted)" }} onClick={()=>setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color:"var(--text-secondary)" }}>Target Role</label>
              <select name="role" value={form.role} onChange={handle} className="field">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-[15px] mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">Create Account <ArrowRight size={15}/></span>
              )}
            </button>
          </form>

          <p className="text-[12px] text-center mt-4" style={{ color:"var(--text-muted)" }}>
            By signing up you agree to our Terms & Privacy Policy
          </p>

          <p className="text-center mt-4 text-[13px]" style={{ color:"var(--text-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold" style={{ color:"#a78bfa" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}