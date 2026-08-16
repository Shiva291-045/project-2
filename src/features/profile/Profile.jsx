import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PageWrapper } from "../../components/PageWrapper";
import { Button, Alert } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/apiClient";
import { User, Mail, Briefcase, Code2, Save, Crown, Shield, Sparkles, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const SKILL_OPTIONS = [
  "JavaScript","TypeScript","Python","Java","C++","React","Node.js",
  "System Design","Data Structures","Algorithms","SQL","MongoDB",
];

export const Profile = () => {
  const { userProfile, user, updateProfile } = useAuth();
  const isPremium = userProfile?.isPremium || false;

  const [form, setForm] = useState({
    name:            userProfile?.name || user?.displayName || "",
    targetRole:      userProfile?.targetRole || "",
    targetCompanies: userProfile?.targetCompanies || [],
    bio:             userProfile?.bio || "",
    skills:          userProfile?.skills || [],
    dsaLevel:        userProfile?.dsaLevel || "Beginner",
    interviewLevel:  userProfile?.interviewLevel || "Medium",
  });
  const [companyInput, setCompanyInput] = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved,  setSaved]      = useState(false);

  // Same company-focus config the interview/resume personalization already
  // uses server-side — fetched here (not duplicated) so an added target
  // company can show what its interviews tend to emphasize.
  const [knownCompanies, setKnownCompanies] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/api/interview/companies");
        if (!cancelled) setKnownCompanies(data?.data?.companies || []);
      } catch {
        // Non-critical — companies still save/display fine without this
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const companyInfoFor = (name) => knownCompanies.find(c => c.name.toLowerCase() === name.toLowerCase());

  const toggleSkill = (skill) => setForm(f => ({
    ...f,
    skills: f.skills.includes(skill) ? f.skills.filter(s=>s!==skill) : [...f.skills, skill],
  }));

  const addCompany = () => {
    const name = companyInput.trim();
    if (!name || form.targetCompanies.includes(name)) { setCompanyInput(""); return; }
    setForm(f => ({ ...f, targetCompanies: [...f.targetCompanies, name] }));
    setCompanyInput("");
  };
  const removeCompany = (name) => setForm(f => ({ ...f, targetCompanies: f.targetCompanies.filter(c => c !== name) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // NOTE: this was previously calling the wrong path (/api/profile, which
      // doesn't exist — the real route is mounted under /api/auth) and was
      // silently 404ing on every save.
      await api.put("/api/auth/profile", form);
      updateProfile?.({ ...userProfile, ...form });
      toast.success("Profile saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast.error("Failed to save profile.");
    }
    setSaving(false);
  };

  const initials = (userProfile?.name || user?.displayName || user?.email || "U")
    .split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

  return (
    <PageWrapper>
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-white">Profile</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage your account details and preferences</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: avatar + account info */}
        <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
          {/* Avatar card */}
          <div className="glass rounded-2xl p-6 border border-[rgba(155,93,229,0.12)] mb-5 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-neon-blue flex items-center justify-center text-white text-3xl font-display font-bold shadow-brand mx-auto">
                {initials}
              </div>
              {isPremium && (
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <h2 className="font-display text-lg font-bold text-white">{form.name || "User"}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
            {isPremium
              ? <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold"><Crown className="w-3 h-3"/>Premium</div>
              : <Link to="/pricing" className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold hover:bg-brand-500/25 transition-all"><Sparkles className="w-3 h-3"/>Upgrade to Premium</Link>
            }
          </div>

          {/* Account stats */}
          <div className="glass rounded-2xl p-5 border border-[rgba(155,93,229,0.12)]">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Account Info</h3>
            <div className="space-y-3 text-sm">
              {[
                { icon: Mail, label: "Email", value: user?.email || "—" },
                { icon: Shield, label: "Status", value: user?.emailVerified ? "Verified ✓" : "Unverified" },
                { icon: Crown, label: "Plan", value: isPremium ? `Premium (${userProfile?.premiumPlan || "monthly"})` : "Free" },
              ].map(({ icon:Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">{label}</p>
                    <p className="text-gray-300 truncate max-w-[160px]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right: edit form */}
        <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15 }}
          className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <div className="glass rounded-2xl p-6 border border-[rgba(155,93,229,0.12)]">
            <h3 className="font-display font-semibold text-white mb-5">Basic Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.15)] text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Target Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input value={form.targetRole} onChange={e=>setForm(f=>({...f,targetRole:e.target.value}))}
                    placeholder="e.g. Software Engineer"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.15)] text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/50 transition-all" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
              <textarea value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.15)] text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/50 resize-none transition-all" />
            </div>
          </div>

          {/* Skills */}
          <div className="glass rounded-2xl p-6 border border-[rgba(155,93,229,0.12)]">
            <h3 className="font-display font-semibold text-white mb-2">Skills</h3>
            <p className="text-xs text-gray-500 mb-4">Select the skills you want to practice</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(skill => (
                <button key={skill} onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    form.skills.includes(skill)
                      ? "bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-[0_0_8px_rgba(123,47,247,0.2)]"
                      : "bg-surface-elevated text-gray-400 border-[rgba(155,93,229,0.1)] hover:border-[rgba(155,93,229,0.3)] hover:text-white"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Target companies */}
          <div className="glass rounded-2xl p-6 border border-[rgba(155,93,229,0.12)]">
            <h3 className="font-display font-semibold text-white mb-2">Target Companies</h3>
            <p className="text-xs text-gray-500 mb-4">Used to focus interview questions and resume keyword matching</p>
            <div className="flex gap-2 mb-3">
              <input
                value={companyInput}
                onChange={e => setCompanyInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCompany(); } }}
                placeholder="e.g. Amazon, Google, Flipkart"
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.15)] text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/50 transition-all"
              />
              <Button variant="secondary" onClick={addCompany} type="button">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.targetCompanies.map(c => (
                <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-brand-500/20 text-brand-300 border border-brand-500/40">
                  {c}
                  <button type="button" onClick={() => removeCompany(c)} className="text-brand-300/60 hover:text-white">×</button>
                </span>
              ))}
              {!form.targetCompanies.length && <p className="text-xs text-gray-600">No companies added yet.</p>}
            </div>
            {form.targetCompanies.some(c => companyInfoFor(c)) && (
              <div className="mt-4 space-y-2">
                {form.targetCompanies.map(c => {
                  const info = companyInfoFor(c);
                  if (!info) return null;
                  return (
                    <div key={c} className="p-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.08)]">
                      <p className="text-xs font-medium text-gray-300 mb-1">{info.name} focus areas:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {info.focus.map(f => <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300">{f}</span>)}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1.5">{info.style}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prep levels */}
          <div className="glass rounded-2xl p-6 border border-[rgba(155,93,229,0.12)]">
            <h3 className="font-display font-semibold text-white mb-5">Preparation Level</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">DSA Level</label>
                <select value={form.dsaLevel} onChange={e => setForm(f => ({ ...f, dsaLevel: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.15)] text-white focus:outline-none focus:border-neon-purple/50 transition-all">
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Interview Difficulty</label>
                <select value={form.interviewLevel} onChange={e => setForm(f => ({ ...f, interviewLevel: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-[rgba(155,93,229,0.15)] text-white focus:outline-none focus:border-neon-purple/50 transition-all">
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save button */}
          <Button variant="primary" size="lg" className="w-full shadow-brand" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : saved ? <><CheckCircle className="w-5 h-5" /> Saved!</> : <><Save className="w-5 h-5" /> Save Changes</>}
          </Button>
        </motion.div>
      </div>
    </PageWrapper>
  );
};
