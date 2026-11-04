import React from "react";
import Icon from "../common/Icon.jsx";

const COLOR_MAP = {
  amber: {
    border: "border-amber-200",
    bg: "bg-gradient-to-br from-amber-50/50 to-white",
    title: "text-amber-800",
    value: "text-amber-700",
    iconBg: "bg-amber-100",
    iconText: "text-amber-700",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
  },
  emerald: {
    border: "border-emerald-200",
    bg: "bg-gradient-to-br from-emerald-50/40 to-white",
    title: "text-emerald-800",
    value: "text-emerald-700",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
  },
  indigo: {
    border: "border-indigo-200",
    bg: "bg-gradient-to-br from-indigo-50/40 to-white",
    title: "text-indigo-800",
    value: "text-indigo-700",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-700",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-800",
  },
  purple: {
    border: "border-purple-200",
    bg: "bg-gradient-to-br from-purple-50/40 to-white",
    title: "text-purple-800",
    value: "text-purple-700",
    iconBg: "bg-purple-100",
    iconText: "text-purple-700",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
  },
  blue: {
    border: "border-blue-200",
    bg: "bg-gradient-to-br from-blue-50/40 to-white",
    title: "text-blue-800",
    value: "text-blue-750",
    iconBg: "bg-blue-100",
    iconText: "text-blue-700",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
  },
  slate: {
    border: "border-slate-200",
    bg: "bg-white",
    title: "text-slate-600",
    value: "text-slate-900",
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
  },
};

const formatINR = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export default function AnalyticsKpiCard({
  title,
  value,
  isCurrency = true,
  subtext,
  icon = "LuActivity",
  badge,
  badgeText,
  colorScheme = "slate",
  className = "",
}) {
  const colors = COLOR_MAP[colorScheme] || COLOR_MAP.slate;

  return (
    <div
      className={`border rounded-xl p-5 shadow-sm transition hover:shadow-md relative overflow-hidden ${colors.border} ${colors.bg} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${colors.title}`}>
          {title}
        </span>
        <span className={`p-2 rounded-lg ${colors.iconBg} ${colors.iconText}`}>
          <Icon name={icon} size={18} />
        </span>
      </div>

      <div className={`mt-2 text-2xl font-black ${colors.value}`}>
        {isCurrency ? formatINR(value) : value}
      </div>

      <div className="text-xs text-slate-500 mt-1 font-medium flex items-center justify-between">
        <span>{subtext}</span>
        {(badge || badgeText) && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors.badgeBg} ${colors.badgeText}`}
          >
            {badgeText || badge}
          </span>
        )}
      </div>
    </div>
  );
}
