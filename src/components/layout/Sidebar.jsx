import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Code,
  TrendingUp,
  Trophy,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: MessageSquare, label: "Interview", href: "/interview" },
    { icon: FileText, label: "Resume", href: "/resume" },
    { icon: Code, label: "Coding", href: "/coding" },
    { icon: TrendingUp, label: "Analytics", href: "/analytics" },
    { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  const isActive = (href) => location.pathname.startsWith(href);

  return (
    <aside
      className={clsx(
        "fixed left-0 top-16 h-[calc(100vh-64px)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
        "transition-all duration-300 z-40",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex justify-end"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={clsx(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                  active
                    ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                    : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                title={collapsed ? item.label : ""}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className={clsx("text-xs text-gray-500", collapsed && "text-center")}>
            {collapsed ? (
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
            ) : (
              <>
                <p className="font-semibold text-gray-900 dark:text-white">PrepAI</p>
                <p className="text-gray-600 dark:text-gray-400">v1.0.0</p>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
