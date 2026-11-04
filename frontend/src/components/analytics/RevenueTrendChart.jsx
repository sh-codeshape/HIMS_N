import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload || {};
  const formattedDate = label
    ? new Date(label).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-xs min-w-[200px] z-50">
      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between">
        <span>{formattedDate}</span>
        {row.invoiceCount !== undefined && (
          <span className="text-[11px] font-normal text-slate-500">
            {row.invoiceCount} inv · {row.paymentCount || 0} rcpt
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-indigo-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Total Invoiced:
          </span>
          <span className="font-bold">₹{Number(row.invoiced || 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center text-emerald-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Realized Collected:
          </span>
          <span className="font-bold">₹{Number(row.collected || 0).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center text-amber-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Pending Dues:
          </span>
          <span className="font-bold">₹{Number(row.dues || 0).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
};

export default function RevenueTrendChart({
  data = [],
  height = 320,
  title = "Revenue & Collections Trendline",
  subtitle = "Daily comparison of invoiced billing, realized receipts, and outstanding dues",
  showLegend = true,
}) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[260px] text-slate-400">
        <div className="text-sm font-medium">No trendline data recorded for selected period</div>
        <div className="text-xs text-slate-400 mt-1">Transactions will populate this curve in real-time</div>
      </div>
    );
  }

  // Format date tick label for X Axis
  const formatXAxis = (tick) => {
    if (!tick) return "";
    try {
      const d = new Date(tick);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
      return tick;
    }
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
          <AreaChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="duesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatINR}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: "12px" }}
              />
            )}

            <Area
              type="monotone"
              dataKey="invoiced"
              name="Invoiced"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#invoicedGrad)"
            />
            <Area
              type="monotone"
              dataKey="collected"
              name="Collected"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#collectedGrad)"
            />
            <Area
              type="monotone"
              dataKey="dues"
              name="Dues"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#duesGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
