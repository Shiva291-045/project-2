import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, FileText, Code2,
  TrendingUp, Trophy, User, ChevronLeft, ChevronRight,
  Crown, Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import clsx from "clsx";

const SIDEBAR_KEY = "prepai_sidebar_collapsed";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/dashboard",   color: "text-neon-purple" },
  { icon: MessageSquare,   label: "Interview",   href: "/interview",   color: "text-neon-blue" },
  { icon: Code2,           label: "Coding",      href: "/coding",      color: "text-neon-cyan" },
  { icon: FileText,        label: "Resume",      href: "/resume",      color: "text-neon-pink" },
  { icon: TrendingUp,      label: "Analytics",   href: "/analytics",   color: "text-amber-400" },
  { icon: Trophy,          label: "Leaderboard", href: "/leaderboard", color: "text-yellow-400" },
  { icon: User,            label: "Profile",     href: "/profile",     color: "text-gray-400" },
];

export const Sidebar = () => {
  // ✅ Collapsed by default — only expand if user previously opened it
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_KEY);
      return stored === null ? true : stored === "true";
    } catch { return true; }
  });

  const location  = useLocation();
  const { userProfile } = useAuth();
  const isPremium = userProfile?.isPremium || false;

  // Persist user preference
  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
      return next;
    });
  };

  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <aside
      className={clsx(
        "fixed left-0 top-16 h-[calc(100vh-64px)] z-40 flex flex-col",
        "glass-strong border-r border-[rgba(155,93,229,0.12)]",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-surface-elevated border border-[rgba(155,93,229,0.3)] flex items-center justify-center text-gray-400 hover:text-white hover:border-neon-purple/60 transition-all duration-200 z-10 shadow-[0_0_10px_rgba(0,0,0,0.4)]"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft  className="w-3 h-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                active
                  ? "bg-brand-500/15 border border-brand-500/25 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-brand-500/10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-neon-purple shadow-[0_0_8px_rgba(155,93,229,0.8)]" />
              )}
              <item.icon
                className={clsx(
                  "w-5 h-5 flex-shrink-0 relative z-10 transition-all duration-200",
                  active ? item.color : "text-gray-500 group-hover:text-gray-300"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium relative z-10 whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Premium CTA */}
      {!collapsed && !isPremium && (
        <div className="px-3 pb-4">
          <Link
            to="/pricing"
            className="block p-3 rounded-xl bg-gradient-to-br from-brand-500/20 to-neon-cyan/10 border border-brand-500/30 hover:border-brand-500/50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">Go Premium</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Unlock unlimited interviews & advanced AI</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-neon-purple font-medium group-hover:gap-2 transition-all">
              <Sparkles className="w-3 h-3" /> Upgrade now
            </div>
          </Link>
        </div>
      )}

      {collapsed && !isPremium && (
        <div className="px-3 pb-4">
          <Link to="/pricing" title="Upgrade to Premium" className="flex items-center justify-center p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 hover:border-amber-400/60 transition-all">
            <Crown className="w-5 h-5 text-amber-400" />
          </Link>
        </div>
      )}
    </aside>
  );
};
