import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, ChevronDown, Crown, Bell, Settings, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import clsx from "clsx";

export const Header = () => {
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, userProfile, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const dropRef   = useRef(null);

  const displayName = userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "User";
  const email       = userProfile?.email || user?.email || "";
  const initials    = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const isPremium   = userProfile?.isPremium || false;

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location.pathname]);

  const handleLogout = () => { setProfileOpen(false); logout(); navigate("/", { replace: true }); };

  const navLinks = [
    { label: "Dashboard",   href: "/dashboard" },
    { label: "Interview",   href: "/interview" },
    { label: "Coding",      href: "/coding" },
    { label: "Resume",      href: "/resume" },
    { label: "Analytics",   href: "/analytics" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-[rgba(155,93,229,0.15)]">
      {/* Thin neon line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-purple/60 to-transparent" />

      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="relative w-9 h-9">
              <img
                src="/logo.png"
                alt="PrepAI"
                className="w-9 h-9 rounded-xl object-contain group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 rounded-xl bg-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md" />
            </div>
            <span className="hidden sm:inline font-display text-xl font-bold gradient-text">
              PrepAI
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {user && navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={clsx(
                  "relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive(link.href)
                    ? "text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive(link.href) && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-brand-500/15 border border-brand-500/25"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Pricing CTA if not premium */}
            {user && !isPremium && (
              <Link
                to="/pricing"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 text-amber-300 hover:from-amber-500/30 hover:to-yellow-500/30 transition-all duration-200"
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade
              </Link>
            )}
            {isPremium && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 text-amber-300">
                <Crown className="w-3.5 h-3.5" />
                Premium
              </div>
            )}

            {/* Profile dropdown */}
            {user && (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-neon-blue flex items-center justify-center text-white text-sm font-bold shadow-[0_0_10px_rgba(123,47,247,0.3)]">
                    {initials}
                  </div>
                  <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform duration-200", profileOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl border border-[rgba(155,93,229,0.2)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                      {/* User info */}
                      <div className="px-4 py-3.5 border-b border-[rgba(155,93,229,0.15)]">
                        <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{email}</p>
                      </div>

                      {/* Links */}
                      <div className="p-1.5">
                        {[
                          { icon: User, label: "Profile", href: "/profile" },
                          { icon: Settings, label: "Settings", href: "/profile" },
                          { icon: Crown, label: isPremium ? "Premium Active" : "Upgrade to Premium", href: "/pricing" },
                        ].map(item => (
                          <Link
                            key={item.label}
                            to={item.href}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-150"
                          >
                            <item.icon className="w-4 h-4 text-gray-500" />
                            {item.label}
                          </Link>
                        ))}

                        <div className="h-px bg-[rgba(155,93,229,0.1)] my-1.5 mx-1" />

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-[rgba(155,93,229,0.1)] overflow-hidden"
          >
            <nav className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={clsx(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive(link.href)
                      ? "bg-brand-500/15 text-white border border-brand-500/25"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {!isPremium && (
                <Link to="/pricing" className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500/10 border border-amber-400/30 text-amber-300">
                  <Crown className="w-4 h-4" /> Upgrade to Premium
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
