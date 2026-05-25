import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Badge } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import {
  Mail, Calendar, Edit2, Save, X,
  Shield, LogOut, Flame, BookOpen, Brain, TrendingUp, CheckCircle,
} from "lucide-react";

export const Profile = () => {
  const navigate = useNavigate();
  const { user, userProfile, logout, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [name,    setName]    = useState(userProfile?.name || user?.displayName || "");
  const [nameErr, setNameErr] = useState("");

  // Keep name input in sync when userProfile loads/changes
  useEffect(() => {
    setName(userProfile?.name || user?.displayName || "");
  }, [userProfile?.name, user?.displayName]);

  const solvedCount = (() => {
    try { return JSON.parse(localStorage.getItem("prepai_solved_problems") || "[]").length; } catch { return 0; }
  })();
  const interviewHistory = (() => {
    try { return JSON.parse(localStorage.getItem("prepai_interview_history") || "[]"); } catch { return []; }
  })();
  const avgScore = (() => {
    const scores = interviewHistory.flatMap((s) => s.scores || []);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;
  })();

  const displayName = userProfile?.name || user?.displayName || "User";
  const email       = userProfile?.email || user?.email || "";
  const initials    = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const joinedDate  = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  const handleSave = async () => {
    if (!name.trim())          { setNameErr("Name cannot be empty.");               return; }
    if (name.trim().length < 2){ setNameErr("Name must be at least 2 characters."); return; }
    setNameErr("");
    setSaving(true);
    const result = await updateProfile({ name: name.trim() });
    setSaving(false);
    if (result.success) setEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const STATS = [
    { label: "Problems Solved", value: solvedCount,              icon: BookOpen,   color: "text-green-500",  bg: "bg-green-500/10"  },
    { label: "Interviews Done", value: interviewHistory.length,  icon: Brain,      color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Avg Score",       value: `${avgScore}%`,           icon: TrendingUp, color: "text-cyan-500",   bg: "bg-cyan-500/10"   },
    { label: "Day Streak",      value: Math.min(interviewHistory.length, 7), icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and track your progress</p>
            </div>

            {/* Profile card */}
            <Card className="mb-6">
              <div className="flex items-start gap-6 flex-wrap">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {initials}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Display Name</label>
                      <input
                        value={name}
                        onChange={(e) => { setName(e.target.value); setNameErr(""); }}
                        className="w-full max-w-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                      {nameErr && <p className="text-red-500 text-xs mt-1">{nameErr}</p>}
                    </div>
                  ) : (
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{displayName}</h2>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>{email}</span>
                    <Badge variant="success" className="text-xs py-0 px-2">Verified</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>Joined {joinedDate}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {editing ? (
                    <>
                      <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-60">
                        <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => { setEditing(false); setName(displayName); setNameErr(""); }}
                        className="p-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors">
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label} className="text-center p-4">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.bg} mb-3`}>
                      <Icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                  </Card>
                );
              })}
            </div>

            {/* Account details */}
            <Card className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" /> Account Details
              </h3>
              <div className="space-y-0">
                {[
                  { label: "Full Name",     value: displayName },
                  { label: "Email",         value: email },
                  { label: "Account Type",  value: "Free Plan" },
                  { label: "Auth Provider", value: "Email / Password" },
                  { label: "User ID",       value: user?.uid ? `${user.uid.slice(0, 12)}…` : "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Sign out */}
            <Card className="border-red-200 dark:border-red-900/40">
              <h3 className="font-semibold text-red-500 dark:text-red-400 mb-3">Sign Out</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                You'll need to sign in again to access your dashboard.
              </p>
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-sm font-medium transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out of PrepAI
              </button>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
};
