import React from "react";

/**
 * Enhanced button with variants, loading state and sizes.
 *
 * New props (all optional, backward compatible):
 *   - variant   : "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "warning"
 *   - size      : "sm" | "md" | "lg"
 *   - loading   : boolean -> shows spinner + disables
 *   - fullWidth : boolean
 *   - icon      : react-icons/lu name (optional leading icon)
 *   - className : appended to base classes
 */
export default function Button({
  children,
  type = "button",
  onClick,
  className,
  fullWidth,
  disabled,
  variant = "primary",
  size = "md",
  loading,
  icon,
}) {
  const isDisabled = disabled || loading;

  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:scale-[0.98] shadow-sm shadow-blue-200/60",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 border border-slate-200",
    outline:
      "bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 active:scale-[0.98] shadow-sm shadow-rose-200/60",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 active:scale-[0.98] shadow-sm shadow-emerald-200/60",
    warning:
      "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 active:scale-[0.98] shadow-sm shadow-amber-200/60",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${
        className || ""
      }`}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && (
        <span className="flex-shrink-0">
          {typeof icon === "function"
            ? React.createElement(icon, { size: 16 })
            : typeof icon === "object"
            ? icon
            : null}
        </span>
      )}
      {children}
    </button>
  );
}
