import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#10b981", "#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6", "#94a3b8"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload || {};

  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-xs min-w-[160px] z-50">
      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5 flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: payload[0]?.fill || "#10b981" }}
        ></span>
        <span>{data.mode}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-slate-600">
          <span>Collected:</span>
          <span className="font-bold text-slate-900">
            ₹{Number(data.total || 0).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>Share:</span>
          <span className="font-semibold text-emerald-600">{data.share || 0}%</span>
        </div>
        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>Transactions:</span>
          <span>{data.count || 0} txn</span>
        </div>
      </div>
    </div>
  );
};

export default function PaymentModeDonutChart({
  data = [],
  height = 320,
  title = "Payment Mode Distribution",
  subtitle = "Breakdown of realized revenue across collection channels",
}) {
  const total = data.reduce((sum, item) => sum + Number(item.total || 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[260px] text-slate-400">
        <div className="text-sm font-medium">No payment records found</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div style={{ width: "100%", height, position: "relative" }}>
        {/* Center Total Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Paid
          </span>
          <span className="text-lg font-black text-slate-900 mt-0.5">
            ₹{total >= 100000 ? `${(total / 100000).toFixed(1)}L` : total.toLocaleString("en-IN")}
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="mode"
              cx="50%"
              cy="48%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: 10, fontSize: "11px" }}
              formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
