import React from "react";
import clsx from "clsx";

/* ── Button ──────────────────────────────────────────────────── */
export const Button = ({ children, variant = "primary", size = "md", className, ...props }) => {
  const base = "relative font-display font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
  const variants = {
    primary:   "bg-gradient-to-r from-brand-500 to-neon-blue text-white hover:from-brand-600 hover:to-blue-600 shadow-[0_0_20px_rgba(123,47,247,0.4)] hover:shadow-[0_0_30px_rgba(123,47,247,0.6)] active:scale-[0.98]",
    secondary: "glass border border-[rgba(155,93,229,0.25)] text-white hover:border-[rgba(155,93,229,0.5)] hover:bg-[rgba(155,93,229,0.1)] active:scale-[0.98]",
    ghost:     "text-gray-300 hover:text-white hover:bg-white/5 active:scale-[0.98]",
    danger:    "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    gradient:  "bg-gradient-to-r from-neon-purple to-neon-cyan text-white hover:opacity-90 shadow-brand active:scale-[0.98]",
    neon:      "border border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10 hover:border-neon-purple hover:shadow-[0_0_20px_rgba(155,93,229,0.4)] active:scale-[0.98]",
  };
  const sizes = {
    xs: "px-3 py-1.5 text-xs",
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-7 py-3.5 text-lg",
    xl: "px-9 py-4 text-xl",
  };
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      {(variant === "primary" || variant === "gradient") && (
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
};

/* ── Input ───────────────────────────────────────────────────── */
export const Input = ({ className, label, error, icon: Icon, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />}
      <input
        className={clsx(
          "w-full rounded-xl border bg-surface-card text-white placeholder-gray-600",
          "transition-all duration-200",
          "border-[rgba(155,93,229,0.2)] focus:border-neon-purple/60 focus:outline-none",
          "focus:shadow-[0_0_0_3px_rgba(123,47,247,0.15)]",
          Icon ? "pl-10 pr-4 py-3" : "px-4 py-3",
          error && "border-red-500/60 focus:border-red-500",
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
  </div>
);

/* ── Card ────────────────────────────────────────────────────── */
export const Card = ({ children, className, hover = true, glow = false, ...props }) => (
  <div
    className={clsx(
      "rounded-2xl bg-surface-card border border-[rgba(155,93,229,0.1)]",
      "transition-all duration-300",
      hover && "hover:border-[rgba(155,93,229,0.25)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
      glow && "shadow-[0_0_20px_rgba(123,47,247,0.1)]",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/* ── GlassCard ───────────────────────────────────────────────── */
export const GlassCard = ({ children, className, ...props }) => (
  <div
    className={clsx(
      "rounded-2xl glass border border-[rgba(155,93,229,0.15)]",
      "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]",
      "transition-all duration-300",
      "hover:border-[rgba(155,93,229,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(123,47,247,0.08)]",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/* ── NeonCard ────────────────────────────────────────────────── */
export const NeonCard = ({ children, className, color = "purple", ...props }) => {
  const colors = {
    purple: "border-neon-purple/30 hover:border-neon-purple/60 hover:shadow-[0_0_20px_rgba(155,93,229,0.2)]",
    cyan:   "border-neon-cyan/30 hover:border-neon-cyan/60 hover:shadow-[0_0_20px_rgba(0,245,212,0.2)]",
    blue:   "border-neon-blue/30 hover:border-neon-blue/60 hover:shadow-[0_0_20px_rgba(78,168,222,0.2)]",
    pink:   "border-neon-pink/30 hover:border-neon-pink/60 hover:shadow-[0_0_20px_rgba(241,91,181,0.2)]",
  };
  return (
    <div
      className={clsx(
        "rounded-2xl bg-surface-card border transition-all duration-300",
        colors[color],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/* ── Badge ───────────────────────────────────────────────────── */
export const Badge = ({ children, variant = "default", className }) => {
  const variants = {
    default:  "bg-white/5 text-gray-400 border-white/10",
    primary:  "bg-brand-500/15 text-brand-300 border-brand-500/30",
    success:  "bg-green-500/15 text-green-300 border-green-500/30",
    warning:  "bg-amber-500/15 text-amber-300 border-amber-500/30",
    danger:   "bg-red-500/15 text-red-300 border-red-500/30",
    cyan:     "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30",
    pink:     "bg-neon-pink/15 text-neon-pink border-neon-pink/30",
    premium:  "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-400/30",
  };
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border", variants[variant], className)}>
      {children}
    </span>
  );
};

/* ── Container ───────────────────────────────────────────────── */
export const Container = ({ children, className }) => (
  <div className={clsx("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
    {children}
  </div>
);

/* ── Spinner ─────────────────────────────────────────────────── */
export const Spinner = ({ size = "md", className }) => {
  const sizes = { sm: "w-5 h-5 border-2", md: "w-8 h-8 border-2", lg: "w-12 h-12 border-3" };
  return (
    <div className={clsx("rounded-full border-surface-elevated border-t-neon-purple animate-spin", sizes[size], className)} />
  );
};

/* ── Alert ───────────────────────────────────────────────────── */
export const Alert = ({ children, variant = "info", className }) => {
  const variants = {
    info:    "bg-blue-500/10 border-blue-500/30 text-blue-300",
    success: "bg-green-500/10 border-green-500/30 text-green-300",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    danger:  "bg-red-500/10 border-red-500/30 text-red-300",
  };
  return (
    <div className={clsx("rounded-xl border px-4 py-3 text-sm", variants[variant], className)}>
      {children}
    </div>
  );
};

/* ── Select ──────────────────────────────────────────────────── */
export const Select = ({ children, className, ...props }) => (
  <select
    className={clsx(
      "w-full rounded-xl border border-[rgba(155,93,229,0.2)] bg-surface-card text-white",
      "px-4 py-3 focus:border-neon-purple/60 focus:outline-none transition-all duration-200",
      "focus:shadow-[0_0_0_3px_rgba(123,47,247,0.15)]",
      className
    )}
    {...props}
  >
    {children}
  </select>
);
