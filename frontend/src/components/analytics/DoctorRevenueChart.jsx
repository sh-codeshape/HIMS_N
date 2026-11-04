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
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload || {};

  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-xs min-w-[220px] z-50">
      <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">
        {row.doctorName}
        <div className="text-[11px] font-normal text-slate-500">{row.specialty}</div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center text-slate-600">
          <span>Patient Encounters:</span>
          <span className="font-bold text-slate-800">{row.encounterCount || 0}</span>
        </div>
        <div className="flex justify-between items-center text-indigo-700">
          <span>Consultation Fees:</span>
          <span className="font-semibold">₹{Number(row.consultationRevenue || 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center text-emerald-700">
          <span>Procedures / Services:</span>
          <span className="font-semibold">₹{Number(row.procedureRevenue || 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center text-slate-900 font-bold pt-1.5 border-t border-slate-100">
          <span>Total Attributed:</span>
          <span className="text-sm text-indigo-600">₹{Number(row.totalRevenue || 0).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
};

export default function DoctorRevenueChart({
  data = [],
  height = 340,
  title = "Doctor Revenue Attribution",
  subtitle = "Revenue generated from patient consultations, specialized procedures, and diagnostic referrals",
  limit = 8,
  onDoctorClick,
}) {
  // Sort by revenue descending and take top doctors
  const sorted = [...data]
    .sort((a, b) => Number(b.totalRevenue || 0) - Number(a.totalRevenue || 0))
    .slice(0, limit);

  if (!sorted || sorted.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[260px] text-slate-400">
        <div className="text-sm font-medium">No doctor revenue attribution recorded</div>
      </div>
    );
  }

  // Shorten name for YAxis label if long
  const formatYAxis = (name) => {
    if (!name) return "";
    const clean = name.replace(/^Dr\.?\s*/i, "");
    return clean.length > 14 ? `${clean.slice(0, 12)}…` : clean;
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
          <BarChart
            layout="vertical"
            data={sorted}
            margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
            onClick={(state) => {
              if (onDoctorClick && state && state.activePayload) {
                onDoctorClick(state.activePayload[0]?.payload);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              tickFormatter={formatINR}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="doctorName"
              tickFormatter={formatYAxis}
              tick={{ fill: "#334155", fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: "12px" }}
            />
            <Bar
              dataKey="consultationRevenue"
              name="Consultation Fees"
              stackId="a"
              fill="#6366f1"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="procedureRevenue"
              name="Procedures & Services"
              stackId="a"
              fill="#06b6d4"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
