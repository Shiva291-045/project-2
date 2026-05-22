import React from "react";
import clsx from "clsx";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}) => {
  const baseStyles =
    "font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-purple-600 hover:bg-purple-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-900 dark:hover:bg-gray-800 dark:text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    gradient: "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ className, ...props }) => (
  <input
    className={clsx(
      "w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600",
      "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
      className
    )}
    {...props}
  />
);

export const Badge = ({ children, variant = "default", className }) => {
  const variants = {
    default: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white",
    primary: "bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-300",
    success: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300",
    danger: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <span
      className={clsx(
        "px-3 py-1 rounded-full text-sm font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export const Card = ({ children, className, ...props }) => (
  <div
    className={clsx(
      "rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
      "shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const GlassCard = ({ children, className, ...props }) => (
  <div
    className={clsx(
      "rounded-2xl p-6 backdrop-blur-xl bg-white/10 dark:bg-white/5",
      "border border-white/20 dark:border-white/10",
      "shadow-xl hover:shadow-2xl transition-shadow duration-200",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const Container = ({ children, className }) => (
  <div className={clsx("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
    {children}
  </div>
);

export const Spinner = ({ size = "md", className }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={clsx(
        "animate-spin rounded-full border-t-purple-600 border-gray-300",
        sizes[size],
        className
      )}
    />
  );
};

export const Alert = ({ children, variant = "info", className }) => {
  const variants = {
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
    success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300",
    danger: "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
  };

  return (
    <div
      className={clsx(
        "rounded-lg border px-4 py-3",
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
};
