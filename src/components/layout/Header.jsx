import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun, LogOut, User, ChevronDown } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import clsx from "clsx";

export const Header = () => {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, userProfile, logout }   = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const dropRef   = useRef(null);

  const displayName = userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "User";
  const email       = userProfile?.email || user?.email || "";
  const initials    = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/");
  };

  const navLinks = [
    { label: "Dashboard",   href: "/dashboard"   },
    { label: "Interview",   href: "/interview"   },
    { label: "Coding",      href: "/coding"      },
    { label: "Resume",      href: "/resume"      },
    { label: "Analytics",   href: "/analytics"   },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  const isActive = (href) => location.pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md">
      <div className="max-w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-lg flex items-center justify-center shadow">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
              PrepAI
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {user && navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: theme + profile */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Toggle theme"
            >
              {theme === "dark"
                ? <Sun  className="w-5 h-5 text-yellow-400" />
                : <Moon className="w-5 h-5 text-gray-600"   />}
            </button>

            {user ? (
              /* ── Profile dropdown ─────────────────────────────── */
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow">
                    {initials}
                  </div>
                  {/* Name (desktop) */}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate max-w-[120px]">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                      {email}
                    </p>
                  </div>
                  <ChevronDown className={clsx("w-4 h-4 text-gray-500 transition-transform hidden md:block", profileOpen && "rotate-180")} />
                </button>

                {/* Dropdown menu */}
                {profileOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-3 bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{displayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        My Profile
                      </Link>
                      <div className="my-1 mx-3 h-px bg-gray-100 dark:bg-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors">Login</Link>
                <Link to="/register" className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all shadow">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="lg:hidden pb-4 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
            {user && navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={clsx(
                  "block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link to="/profile" className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  My Profile
                </Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  Sign Out
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
