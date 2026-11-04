import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

const formatINR = (val) => {
  const num = Number(val) || 0;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const CATEGORY_COLORS = {
  Hematology: "#8b5cf6",
  Biochemistry: "#3b82f6",
  "Clinical Pathology": "#10b981",
  "Radiology & ECG": "#f59e0b",
  "General Laboratory": "#64748b",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload || {};

  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-xs min-w-[200px] z-50">
      <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">
        {row.name}
        <div className="text-[11px] font-normal text-purple-600 mt-0.5">{row.category}</div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center text-slate-600">
          <span>Test Volume:</span>
          <span className="font-bold text-slate-800">{row.volume || 0} order(s)</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>Unit Rate:</span>
          <span className="font-semibold text-slate-700">₹{Number(row.unitPrice || 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center text-purple-700 font-bold pt-1.5 border-t border-slate-100">
          <span>Total Revenue:</span>
          <span className="text-sm">₹{Number(row.revenue || 0).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
};

export default function DiagnosticTestVolumeChart({
  data = [],
  height = 320,
  title = "Top Pathology & Diagnostic Tests",
  subtitle = "Highest volume and revenue-generating laboratory investigations",
  limit = 8,
}) {
  const displayData = data.slice(0, limit);

  if (!displayData || displayData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[260px] text-slate-400">
        <div className="text-sm font-medium">No diagnostic investigations recorded</div>
      </div>
    );
  }

  // Format test name for X Axis
  const formatXAxis = (name) => {
    if (!name) return "";
    const clean = name.replace(/\(.*?\)/g, "").trim();
    return clean.length > 12 ? `${clean.slice(0, 10)}…` : clean;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tickFormatter={formatXAxis}
              tick={{ fill: "#64748b", fontSize: 11 }}
              interval={0}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              tickFormatter={formatINR}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: "12px" }}
            />
            <Bar dataKey="revenue" name="Total Revenue (₹)" radius={[4, 4, 0, 0]}>
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_COLORS[entry.category] || "#8b5cf6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
