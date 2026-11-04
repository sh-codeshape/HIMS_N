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
} from "recharts";

const formatINR = (val) => {
  const num = Number(val) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload || {};

  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-xs min-w-[200px] z-50">
      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-2">
        {row.name}
        {row.code && <span className="ml-1 text-[11px] text-slate-400 font-mono">({row.code})</span>}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center text-slate-700">
          <span>Total Posted:</span>
          <span className="font-bold">₹{Number(row.totalRevenue || 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center text-emerald-700">
          <span>Billed / Realized:</span>
          <span className="font-semibold">₹{Number(row.billedAmount || 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center text-amber-700">
          <span>Unbilled / Running Dues:</span>
          <span className="font-semibold">₹{Number(row.unbilledDues || 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-100">
          <span>Charges Volume:</span>
          <span className="font-medium">{row.chargeCount || 0} charge(s)</span>
        </div>
      </div>
    </div>
  );
};

export default function DepartmentBreakdownChart({
  data = [],
  height = 320,
  title = "Revenue by Hospital Department",
  subtitle = "Breakdown of posted charges, settled invoices, and running unbilled dues",
  onBarClick,
}) {
  // Filter out departments with 0 charges so the chart stays crisp and meaningful
  const activeDepts = data.filter((d) => Number(d.totalRevenue || 0) > 0 || Number(d.chargeCount || 0) > 0);
  const displayData = activeDepts.length > 0 ? activeDepts : data.slice(0, 6);

  if (!displayData || displayData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[260px] text-slate-400">
        <div className="text-sm font-medium">No department revenue records found</div>
      </div>
    );
  }

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
          <BarChart
            data={displayData}
            margin={{ top: 10, right: 15, left: -10, bottom: 25 }}
            onClick={(state) => {
              if (onBarClick && state && state.activePayload) {
                onBarClick(state.activePayload[0]?.payload);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="code"
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
            <Bar dataKey="billedAmount" name="Billed / Realized" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unbilledDues" name="Unbilled Running Dues" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
