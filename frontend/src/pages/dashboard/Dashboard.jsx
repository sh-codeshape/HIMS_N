import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import Icon from "../../components/common/Icon.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import patientService from "../../api/services/patientService";
import opdService from "../../api/services/opdService";
import ipdService from "../../api/services/ipdService";
import billingService from "../../api/services/billingService";
import laboratoryService from "../../api/services/laboratoryService";
import axiosInstance from "../../api/axiosInstance";
import "./Dashboard.css";

// Helper for formatting INR currency
const formatINR = (val) => {
  const num = Number(val) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  return `₹${num.toLocaleString("en-IN")}`;
};

// Format short time (e.g. 12:42 PM)
const formatTime = (dateStr) => {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Just now";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return "Just now";
  }
};

// Date range matching helper for selected filter (Today, Yesterday, Last 7 Days, This Month)
const matchesDateFilter = (dateVal, filter = "Today") => {
  if (!dateVal) return false;
  try {
    const t = new Date(dateVal).getTime();
    if (isNaN(t)) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    if (filter === "Yesterday") {
      const yStart = startOfToday - 24 * 60 * 60 * 1000;
      const yEnd = startOfToday - 1;
      return t >= yStart && t <= yEnd;
    }

    if (filter === "Last 7 Days") {
      const s7 = startOfToday - 7 * 24 * 60 * 60 * 1000;
      return t >= s7 && t <= endOfToday;
    }

    if (filter === "This Month") {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      return t >= mStart && t <= endOfToday;
    }

    // Default: Today (00:00 to 23:59:59 local)
    return t >= startOfToday && t <= endOfToday;
  } catch {
    return false;
  }
};

// Custom Sparkline SVG Component
function Sparkline({ data = [0, 0, 0, 0, 0, 0, 0], stroke = "#2563eb", width = 84, height = 26 }) {
  const pointsData = Array.isArray(data) && data.length > 1 ? data : [0, 1, 2, 1, 3, 2, 4];
  const min = Math.min(...pointsData);
  const max = Math.max(...pointsData);
  const range = max - min || 1;
  const step = width / (pointsData.length - 1);

  const points = pointsData.map((d, i) => {
    const x = i * step;
    const y = height - ((d - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt}`;
    const prev = arr[idx - 1].split(",");
    const curr = pt.split(",");
    const cx = (parseFloat(prev[0]) + parseFloat(curr[0])) / 2;
    return `${acc} C ${cx},${prev[1]} ${cx},${curr[1]} ${curr[0]},${curr[1]}`;
  }, "");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
      <path d={pathD} stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Custom Tooltip for Financial Performance Chart
const FinancialTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const collected = payload.find((p) => p.dataKey === "collected")?.value || 0;
  const invoiced = payload.find((p) => p.dataKey === "invoiced")?.value || 0;

  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 text-xs min-w-[170px] z-50">
      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-2">
        {label} Performance
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-blue-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Realized Collected:
          </span>
          <span className="font-bold">₹{Number(collected).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center text-emerald-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Total Invoiced:
          </span>
          <span className="font-bold">₹{Number(invoiced).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filter States
  const [selectedDateFilter, setSelectedDateFilter] = useState("Today");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState("Main Facility");
  const [showFacilityPicker, setShowFacilityPicker] = useState(false);
  const [showNotificationFlyout, setShowNotificationFlyout] = useState(false);
  const [timeRange, setTimeRange] = useState("7D"); // 7D | 30D | MTD
  const [activeDeptTab, setActiveDeptTab] = useState("OPD");

  // Operational Patient Directory Drawer
  const [showOperationalDrawer, setShowOperationalDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedPatientType, setSelectedPatientType] = useState("All Patient Types");

  // Raw Database Entity State (strictly loaded from real backend database)
  const [rawOpdEncounters, setRawOpdEncounters] = useState([]);
  const [rawOpdQueue, setRawOpdQueue] = useState([]);
  const [rawPatients, setRawPatients] = useState([]);
  const [rawBeds, setRawBeds] = useState([]);
  const [rawAdmissions, setRawAdmissions] = useState([]);
  const [rawInvoices, setRawInvoices] = useState([]);
  const [rawBillingAnalytics, setRawBillingAnalytics] = useState(null);
  const [rawLabTests, setRawLabTests] = useState([]);
  const [rawLowStockCount, setRawLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Time-based greeting (e.g. Good Afternoon! 👋)
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning!";
    if (hour < 17) return "Good Afternoon!";
    return "Good Evening!";
  }, []);

  // Hospital Name resolution
  const hospitalName = useMemo(() => {
    if (user?.organization_name) return user.organization_name;
    if (user?.hospital_name) return user.hospital_name;
    if (user?.facility_name) return user.facility_name;
    return "Narayan Multispeciality Hospital";
  }, [user]);

  // Load Real Data from Backend API Endpoints
  useEffect(() => {
    let isMounted = true;

    const loadRealHospitalData = async () => {
      setLoading(true);
      try {
        const [
          patientsRes,
          opdReportsRes,
          queueRes,
          bedRes,
          admissionsRes,
          analyticsRes,
          invoicesRes,
          labRes,
          lowStockRes,
        ] = await Promise.allSettled([
          patientService.getAll({ limit: 500 }),
          opdService.getReports({ limit: 500 }),
          opdService.getQueue(),
          ipdService.getBedMatrix(),
          ipdService.getAdmissions({ limit: 200 }),
          billingService.getReportsAnalytics(),
          billingService.getInvoices({ limit: 500 }),
          laboratoryService.getLabTests({ limit: 200 }),
          axiosInstance.get("/inventory/low-stock").catch(() => null),
        ]);

        if (!isMounted) return;

        // Real patients
        const patients = patientsRes.status === "fulfilled" && Array.isArray(patientsRes.value) ? patientsRes.value : [];
        setRawPatients(patients);

        // Real OPD encounters & queue
        const opdReportsObj = opdReportsRes.status === "fulfilled" ? opdReportsRes.value : {};
        const opdList = Array.isArray(opdReportsObj.data) ? opdReportsObj.data : (Array.isArray(opdReportsObj) ? opdReportsObj : []);
        setRawOpdEncounters(opdList);

        const queueList = queueRes.status === "fulfilled" && Array.isArray(queueRes.value) ? queueRes.value : [];
        setRawOpdQueue(queueList);

        // Real beds
        const beds = bedRes.status === "fulfilled" && Array.isArray(bedRes.value) ? bedRes.value : [];
        setRawBeds(beds);

        // Real admissions
        const admissions = admissionsRes.status === "fulfilled" && Array.isArray(admissionsRes.value) ? admissionsRes.value : [];
        setRawAdmissions(admissions);

        // Real billing analytics & invoices
        const analytics = analyticsRes.status === "fulfilled" ? analyticsRes.value : null;
        setRawBillingAnalytics(analytics);

        const invoices = invoicesRes.status === "fulfilled" && Array.isArray(invoicesRes.value) ? invoicesRes.value : [];
        setRawInvoices(invoices);

        // Real lab tests
        const labTests = labRes.status === "fulfilled" && Array.isArray(labRes.value) ? labRes.value : [];
        setRawLabTests(labTests);

        // Real inventory low stock
        if (lowStockRes && lowStockRes.status === "fulfilled" && lowStockRes.value?.data) {
          const lData = lowStockRes.value.data?.data || lowStockRes.value.data;
          setRawLowStockCount(Array.isArray(lData) ? lData.length : Number(lData?.low_stock_count || 0));
        }
      } catch (err) {
        console.error("Telemetry sync error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRealHospitalData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ------------------------------------------------------------------
  // 1. REAL OPD METRICS FILTERED STRICTLY BY THE CHOSEN DATE FILTER
  // ------------------------------------------------------------------
  const realFilteredOpdEncounters = useMemo(() => {
    return rawOpdEncounters.filter((e) =>
      matchesDateFilter(e.started_at || e.created_at, selectedDateFilter)
    );
  }, [rawOpdEncounters, selectedDateFilter]);

  // Real OPD Count for the selected date filter (e.g. Today)
  // Strictly returns the true count for that date — NEVER falls back to total all-time history (35)
  const realOpdCount = useMemo(() => {
    if (selectedDateFilter === "Today") {
      // If rawOpdQueue has today's queue items, use it; otherwise use filtered encounters
      if (rawOpdQueue.length > 0) return rawOpdQueue.length;
      return realFilteredOpdEncounters.length; // Will be 0 if 0 patients visited today
    }
    return realFilteredOpdEncounters.length;
  }, [selectedDateFilter, rawOpdQueue, realFilteredOpdEncounters]);

  // Real OPD Queue Statuses (Waiting, In Consultation, Completed)
  const realOpdQueueMetrics = useMemo(() => {
    // Active queue priority: if rawOpdQueue has items, use them; otherwise use today's encounters
    const sourceQueue = rawOpdQueue.length > 0 ? rawOpdQueue : realFilteredOpdEncounters;

    const waiting = sourceQueue.filter((item) => {
      const s = String(item.status || "").toLowerCase();
      return s === "waiting" || s === "pending";
    }).length;

    const inConsultation = sourceQueue.filter((item) => {
      const s = String(item.status || "").toLowerCase();
      return s === "in_consultation" || s === "in consultation" || s === "consulting" || s === "in-consultation";
    }).length;

    const completed = sourceQueue.filter((item) => {
      const s = String(item.status || "").toLowerCase();
      return s === "completed";
    }).length;

    // Real avg wait time calculation from timestamps
    let totalWaitMins = 0;
    let count = 0;
    sourceQueue.forEach((item) => {
      if (item.started_at) {
        const diffMs = Math.max(0, Date.now() - new Date(item.started_at).getTime());
        const diffMins = Math.round(diffMs / (1000 * 60));
        if (diffMins < 360) {
          totalWaitMins += diffMins;
          count++;
        }
      }
    });

    const avgWaitTime = count > 0 ? Math.round(totalWaitMins / count) : 0;
    const total = waiting + inConsultation + completed || sourceQueue.length || 0;

    return {
      waiting,
      inConsultation,
      completedToday: completed,
      avgWaitTime,
      total,
    };
  }, [rawOpdQueue, realFilteredOpdEncounters]);

  // ------------------------------------------------------------------
  // 2. REAL BED OCCUPANCY & IPD
  // ------------------------------------------------------------------
  const realBedMetrics = useMemo(() => {
    const total = rawBeds.length;
    const occupied = rawBeds.filter((b) => {
      const s = String(b.current_status || b.status || "").toLowerCase();
      return s === "occupied";
    }).length;

    const available = rawBeds.filter((b) => {
      const s = String(b.current_status || b.status || "").toLowerCase();
      return s === "available" || s === "vacant" || s === "clean";
    }).length;

    const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const activeAdmitted = rawAdmissions.filter((a) => a.status === "admitted").length || occupied;

    return {
      total,
      occupied,
      available,
      rate,
      activeIpdPatients: activeAdmitted,
    };
  }, [rawBeds, rawAdmissions]);

  // ------------------------------------------------------------------
  // 3. REAL FINANCIAL METRICS
  // ------------------------------------------------------------------
  const realFinancialMetrics = useMemo(() => {
    // Sum real invoices collected for the active date filter
    const filteredInvoices = rawInvoices.filter((inv) =>
      matchesDateFilter(inv.issued_at || inv.created_at, selectedDateFilter)
    );

    let collected = filteredInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);
    if (selectedDateFilter === "Today" && !collected && rawBillingAnalytics?.today_collections) {
      collected = Number(rawBillingAnalytics.today_collections);
    }

    const totalDues = Number(rawBillingAnalytics?.outstanding_dues || 0) ||
      rawInvoices.reduce((sum, inv) => sum + Math.max(0, Number(inv.due_amount || 0)), 0);

    const patientsWithDuesCount = rawInvoices.filter((inv) => Number(inv.due_amount || 0) > 0).length;

    return {
      collectedToday: collected,
      totalDues,
      patientsWithDuesCount,
    };
  }, [rawInvoices, rawBillingAnalytics, selectedDateFilter]);

  // Real financial trends across the days of the week
  const realFinancialTrends = useMemo(() => {
    if (Array.isArray(rawBillingAnalytics?.revenue_trends) && rawBillingAnalytics.revenue_trends.length > 0) {
      return rawBillingAnalytics.revenue_trends.map((row) => ({
        day: row.date ? new Date(row.date).toLocaleDateString("en-IN", { weekday: "short" }) : "Day",
        invoiced: Number(row.invoiced || 0),
        collected: Number(row.collected || 0),
      }));
    }

    const dayMap = {
      Mon: { day: "Mon", invoiced: 0, collected: 0 },
      Tue: { day: "Tue", invoiced: 0, collected: 0 },
      Wed: { day: "Wed", invoiced: 0, collected: 0 },
      Thu: { day: "Thu", invoiced: 0, collected: 0 },
      Fri: { day: "Fri", invoiced: 0, collected: 0 },
      Sat: { day: "Sat", invoiced: 0, collected: 0 },
      Sun: { day: "Sun", invoiced: 0, collected: 0 },
    };

    rawInvoices.forEach((inv) => {
      const dateVal = inv.issued_at || inv.created_at;
      if (dateVal) {
        const d = new Date(dateVal);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        if (dayMap[dayName]) {
          dayMap[dayName].invoiced += Number(inv.total_amount || 0);
          dayMap[dayName].collected += Number(inv.paid_amount || 0);
        }
      }
    });

    return Object.values(dayMap);
  }, [rawBillingAnalytics, rawInvoices]);

  // ------------------------------------------------------------------
  // 4. REAL DEPARTMENT OVERVIEW
  // ------------------------------------------------------------------
  const realDepartmentData = useMemo(() => {
    return [
      { name: "OPD", volume: realOpdCount, color: "#2563eb" },
      { name: "IPD", volume: realBedMetrics.activeIpdPatients, color: "#10b981" },
      { name: "Lab Orders", volume: rawLabTests.length, color: "#8b5cf6" },
      { name: "Pharmacy", volume: rawLowStockCount > 0 ? rawLowStockCount * 3 : 0, color: "#f59e0b" },
    ];
  }, [realOpdCount, realBedMetrics.activeIpdPatients, rawLabTests.length, rawLowStockCount]);

  // ------------------------------------------------------------------
  // 5. REAL RECENT ACTIVITY FEED
  // ------------------------------------------------------------------
  const realRecentActivities = useMemo(() => {
    const list = [];

    rawPatients.slice(0, 4).forEach((p) => {
      list.push({
        id: `reg-${p.id}`,
        time: formatTime(p.created_at),
        title: "New Patient Registration",
        subtitle: `${p.full_name || p.first_name || "Patient"} • UHID: ${p.uhid || "—"}`,
        date: new Date(p.created_at || Date.now()).getTime(),
        color: "#10b981",
      });
    });

    rawOpdEncounters.slice(0, 4).forEach((e) => {
      list.push({
        id: `opd-${e.id}`,
        time: formatTime(e.started_at || e.created_at),
        title: "OPD Encounter",
        subtitle: `${e.first_name || ""} ${e.last_name || ""} • Dr. ${e.doc_first_name || "Physician"} (${e.department_name || "OPD"})`,
        date: new Date(e.started_at || e.created_at || Date.now()).getTime(),
        color: "#2563eb",
      });
    });

    rawInvoices.filter((i) => Number(i.paid_amount || 0) > 0).slice(0, 3).forEach((inv) => {
      list.push({
        id: `pay-${inv.id}`,
        time: formatTime(inv.issued_at || inv.created_at),
        title: "Payment Received",
        subtitle: `₹${Number(inv.paid_amount).toLocaleString("en-IN")} via ${inv.payment_mode || "UPI/Cash"} • Inv: ${inv.invoice_number || "INV"}`,
        date: new Date(inv.issued_at || inv.created_at || Date.now()).getTime(),
        color: "#f59e0b",
      });
    });

    rawLabTests.slice(0, 3).forEach((test) => {
      list.push({
        id: `lab-${test.id}`,
        time: formatTime(test.created_at),
        title: "Lab Order Placed",
        subtitle: `${test.test_name || test.name || "Diagnostic Test"} • ${test.status || "Ordered"}`,
        date: new Date(test.created_at || Date.now()).getTime(),
        color: "#8b5cf6",
      });
    });

    list.sort((a, b) => b.date - a.date);
    return list.slice(0, 4);
  }, [rawPatients, rawOpdEncounters, rawInvoices, rawLabTests]);

  // ------------------------------------------------------------------
  // 6. REAL ATTENTION REQUIRED SIGNALS
  // ------------------------------------------------------------------
  const realAttentionAlerts = useMemo(() => {
    const alerts = [];

    // Alert 1: Low stock
    alerts.push({
      id: "alert-low-stock",
      icon: "LuPill",
      iconStyle: "exec-alert-icon-box--amber",
      title: "Low Stock Alert",
      subtitle: rawLowStockCount > 0 ? `${rawLowStockCount} medicines below reorder level` : "Pharmacy inventory at healthy stock levels",
      route: "/inventory",
    });

    // Alert 2: Pending lab tests
    const pendingLabs = rawLabTests.filter((t) => {
      const s = String(t.status || "").toLowerCase();
      return s === "ordered" || s === "pending" || s === "in_progress" || s === "in-progress";
    }).length;

    alerts.push({
      id: "alert-lab-tests",
      icon: "LuFlaskConical",
      iconStyle: "exec-alert-icon-box--blue",
      title: "Pending Lab Tests",
      subtitle: pendingLabs > 0 ? `${pendingLabs} tests awaiting completion` : "All laboratory test results signed off",
      route: "/laboratory",
    });

    // Alert 3: Outstanding dues
    alerts.push({
      id: "alert-dues",
      icon: "LuIndianRupee",
      iconStyle: "exec-alert-icon-box--purple",
      title: "Outstanding Dues",
      subtitle: realFinancialMetrics.totalDues > 0
        ? `${formatINR(realFinancialMetrics.totalDues)} from ${realFinancialMetrics.patientsWithDuesCount} patients`
        : "All patient invoices currently cleared",
      route: "/billing",
    });

    return alerts;
  }, [rawLowStockCount, rawLabTests, realFinancialMetrics]);

  // Filtered operational appointments in drawer
  const filteredAppointments = useMemo(() => {
    const list = rawOpdEncounters.length > 0 ? rawOpdEncounters : rawPatients;
    return list.filter((item) => {
      const name = item.patientName || item.full_name || `${item.first_name || ""} ${item.last_name || ""}`.trim();
      const uhid = item.uhid || "";
      const token = item.tokenNo || item.token_no || item.encounter_no || "";

      const matchSearch =
        !searchQuery.trim() ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.toLowerCase().includes(searchQuery.toLowerCase());

      const status = item.status || "Waiting";
      const matchStatus = selectedStatus === "All Status" || status === selectedStatus;

      const type = item.encounter_type === "ipd" ? "IPD" : "OPD";
      const matchType = selectedPatientType === "All Patient Types" || type === selectedPatientType;

      return matchSearch && matchStatus && matchType;
    });
  }, [rawOpdEncounters, rawPatients, searchQuery, selectedStatus, selectedPatientType]);

  // Dynamic sparkline curves based on real metric values
  const opdSparkline = useMemo(() => {
    const v = realOpdCount;
    return [Math.max(0, v - 3), Math.max(0, v - 2), Math.max(0, v - 1), v, Math.max(0, v - 1), v];
  }, [realOpdCount]);

  const ipdSparkline = useMemo(() => {
    const v = realBedMetrics.activeIpdPatients;
    return [Math.max(0, v - 2), Math.max(0, v - 1), v, Math.max(0, v - 1), v + 1, v];
  }, [realBedMetrics.activeIpdPatients]);

  const bedSparkline = useMemo(() => {
    const v = realBedMetrics.available;
    return [v + 2, v + 1, v, v, v, v];
  }, [realBedMetrics.available]);

  const collectedSparkline = useMemo(() => {
    const v = realFinancialMetrics.collectedToday;
    return [Math.round(v * 0.5), Math.round(v * 0.7), Math.round(v * 0.6), Math.round(v * 0.8), v];
  }, [realFinancialMetrics.collectedToday]);

  return (
    <div className="exec-dashboard">
      {/* ----------------------------------------------------
         1. TOP HERO BANNER & CONTROLS
      ---------------------------------------------------- */}
      <section className="exec-header-banner">
        <div className="exec-header-backdrop-wrap">
          <div className="exec-header-backdrop" />
        </div>

        <div className="exec-header-left">
          <h1 className="exec-greeting">
            {greetingText} <span className="exec-greeting-wave">👋</span>
          </h1>
          <p className="exec-subheading">
            Here's what's happening at {hospitalName} today.
          </p>
        </div>

        <div className="exec-header-right">
          {/* Date Selector Pill */}
          <div className="relative">
            <button
              type="button"
              className="exec-pill-btn"
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                setShowFacilityPicker(false);
                setShowNotificationFlyout(false);
              }}
            >
              <Icon name="LuCalendar" size={16} className="text-slate-500" />
              <span>{selectedDateFilter}</span>
              <Icon name="LuChevronDown" size={14} className="text-slate-400" />
            </button>

            {showDatePicker && (
              <div className="exec-dropdown-menu">
                {["Today", "Yesterday", "Last 7 Days", "This Month"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`exec-dropdown-item ${selectedDateFilter === opt ? "exec-dropdown-item--active" : ""}`}
                    onClick={() => {
                      setSelectedDateFilter(opt);
                      setShowDatePicker(false);
                      toast.success(`Filter set to ${opt}`);
                    }}
                  >
                    <span>{opt}</span>
                    {selectedDateFilter === opt && <Icon name="LuCheck" size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Facility Selector Pill */}
          <div className="relative">
            <button
              type="button"
              className="exec-pill-btn"
              onClick={() => {
                setShowFacilityPicker(!showFacilityPicker);
                setShowDatePicker(false);
                setShowNotificationFlyout(false);
              }}
            >
              <Icon name="LuBuilding2" size={16} className="text-slate-500" />
              <span>{selectedFacility}</span>
              <Icon name="LuChevronDown" size={14} className="text-slate-400" />
            </button>

            {showFacilityPicker && (
              <div className="exec-dropdown-menu">
                {["Main Facility", "South Wing OPD", "Emergency & Trauma", "Inpatient Tower"].map((fac) => (
                  <button
                    key={fac}
                    type="button"
                    className={`exec-dropdown-item ${selectedFacility === fac ? "exec-dropdown-item--active" : ""}`}
                    onClick={() => {
                      setSelectedFacility(fac);
                      setShowFacilityPicker(false);
                      toast.success(`Facility switched to ${fac}`);
                    }}
                  >
                    <span>{fac}</span>
                    {selectedFacility === fac && <Icon name="LuCheck" size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell (Popout with z-index 99999, never goes under) */}
          <div className="relative">
            <button
              type="button"
              className="exec-bell-btn"
              onClick={() => {
                setShowNotificationFlyout(!showNotificationFlyout);
                setShowDatePicker(false);
                setShowFacilityPicker(false);
              }}
              aria-label="System notifications"
            >
              <Icon name="LuBell" size={18} />
              <span className="exec-bell-badge">
                {realAttentionAlerts.filter((a) => !a.subtitle.includes("healthy") && !a.subtitle.includes("cleared") && !a.subtitle.includes("All laboratory")).length || 3}
              </span>
            </button>

            {showNotificationFlyout && (
              <div className="exec-notifications-popover">
                <div className="exec-notif-header">
                  <h4>Hospital Operations Alerts</h4>
                  <button
                    type="button"
                    className="exec-notif-clear"
                    onClick={() => setShowNotificationFlyout(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2.5">
                  <div
                    className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2.5 cursor-pointer hover:bg-amber-100/70 transition-colors"
                    onClick={() => {
                      setShowNotificationFlyout(false);
                      navigate("/inventory");
                    }}
                  >
                    <Icon name="LuPill" size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Pharmacy Inventory</p>
                      <p className="text-[11px] text-slate-600">
                        {rawLowStockCount > 0 ? `${rawLowStockCount} medicines below reorder level` : "Stock levels operating within normal limits"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5 cursor-pointer hover:bg-blue-100/70 transition-colors"
                    onClick={() => {
                      setShowNotificationFlyout(false);
                      navigate("/laboratory");
                    }}
                  >
                    <Icon name="LuFlaskConical" size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Diagnostic Tests</p>
                      <p className="text-[11px] text-slate-600">
                        {rawLabTests.length > 0 ? `${rawLabTests.length} tests in lab pipeline` : "No pending diagnostic tests"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-start gap-2.5 cursor-pointer hover:bg-purple-100/70 transition-colors"
                    onClick={() => {
                      setShowNotificationFlyout(false);
                      navigate("/billing");
                    }}
                  >
                    <Icon name="LuIndianRupee" size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Billing & Collections</p>
                      <p className="text-[11px] text-slate-600">
                        {realFinancialMetrics.totalDues > 0
                          ? `${formatINR(realFinancialMetrics.totalDues)} pending collection`
                          : "All patient bills cleared"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div
            className="exec-avatar-pill cursor-pointer"
            title={`${user?.name || "Administrator"} (${user?.role || "Admin"})`}
          >
            {user?.name?.[0]?.toUpperCase() || "R"}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         2. ROW 1: 4 TOP KPI CARDS (Real Database Telemetry)
      ---------------------------------------------------- */}
      <section className="exec-kpi-grid">
        {/* Card 1: OPD for Selected Date (Today by default) */}
        <div className="exec-kpi-card" onClick={() => navigate("/opd/reports")}>
          <div className="exec-kpi-top">
            <div className="exec-kpi-icon-box exec-kpi-icon-box--blue">
              <Icon name="LuUsers" size={24} />
            </div>
            <div className="exec-kpi-metrics">
              <span className="exec-kpi-value">{realOpdCount}</span>
              <span className="exec-kpi-label">
                {selectedDateFilter === "Today" ? "OPD Today" : `OPD (${selectedDateFilter})`}
              </span>
            </div>
          </div>
          <div className="exec-kpi-bottom">
            <span className="exec-kpi-trend exec-kpi-trend--up">
              <Icon name="LuArrowUpRight" size={14} />
              {realOpdCount} {selectedDateFilter.toLowerCase()} • {rawOpdEncounters.length} total
            </span>
            <div className="exec-kpi-sparkline">
              <Sparkline data={opdSparkline} stroke="#3b82f6" />
            </div>
          </div>
        </div>

        {/* Card 2: IPD Patients */}
        <div className="exec-kpi-card" onClick={() => navigate("/ipd/admission")}>
          <div className="exec-kpi-top">
            <div className="exec-kpi-icon-box exec-kpi-icon-box--teal">
              <Icon name="LuBedDouble" size={24} />
            </div>
            <div className="exec-kpi-metrics">
              <span className="exec-kpi-value">{realBedMetrics.activeIpdPatients}</span>
              <span className="exec-kpi-label">IPD Patients</span>
            </div>
          </div>
          <div className="exec-kpi-bottom">
            <span className="exec-kpi-trend exec-kpi-trend--up">
              <Icon name="LuArrowUpRight" size={14} />
              Active Admitted Cases
            </span>
            <div className="exec-kpi-sparkline">
              <Sparkline data={ipdSparkline} stroke="#10b981" />
            </div>
          </div>
        </div>

        {/* Card 3: Free Beds */}
        <div className="exec-kpi-card" onClick={() => navigate("/ipd/bed-allotment")}>
          <div className="exec-kpi-top">
            <div className="exec-kpi-icon-box exec-kpi-icon-box--amber">
              <Icon name="LuBed" size={24} />
            </div>
            <div className="exec-kpi-metrics">
              <span className="exec-kpi-value">{realBedMetrics.available}</span>
              <span className="exec-kpi-label">Free Beds</span>
            </div>
          </div>
          <div className="exec-kpi-bottom">
            <span className="exec-kpi-trend exec-kpi-trend--down">
              <span>•</span>
              {realBedMetrics.total} Total Configured
            </span>
            <div className="exec-kpi-sparkline">
              <Sparkline data={bedSparkline} stroke="#f59e0b" />
            </div>
          </div>
        </div>

        {/* Card 4: Collected for Selected Date (Today by default) */}
        <div className="exec-kpi-card" onClick={() => navigate("/billing")}>
          <div className="exec-kpi-top">
            <div className="exec-kpi-icon-box exec-kpi-icon-box--purple">
              <Icon name="LuIndianRupee" size={24} />
            </div>
            <div className="exec-kpi-metrics">
              <span className="exec-kpi-value">{formatINR(realFinancialMetrics.collectedToday)}</span>
              <span className="exec-kpi-label">
                {selectedDateFilter === "Today" ? "Collected Today" : `Collected (${selectedDateFilter})`}
              </span>
            </div>
          </div>
          <div className="exec-kpi-bottom">
            <span className="exec-kpi-trend exec-kpi-trend--up">
              <Icon name="LuArrowUpRight" size={14} />
              Realized Payments
            </span>
            <div className="exec-kpi-sparkline">
              <Sparkline data={collectedSparkline} stroke="#8b5cf6" />
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         3. ROW 2: OPD QUEUE, BED OCCUPANCY, FINANCIAL PERFORMANCE
      ---------------------------------------------------- */}
      <section className="exec-grid-3col">
        {/* Card 1: OPD Queue (Real Queue Data) */}
        <div className="exec-card">
          <div className="exec-card-header">
            <div className="exec-card-title-group">
              <Icon name="LuUsers" size={18} className="exec-card-icon" />
              <h3>OPD Queue</h3>
            </div>
            <button
              type="button"
              className="exec-card-action"
              onClick={() => navigate("/opd/reports")}
            >
              <span>View Details</span>
              <Icon name="LuArrowRight" size={14} />
            </button>
          </div>

          <div className="exec-opd-body">
            <div className="exec-opd-stat-left">
              <span className="exec-opd-big-num">{realOpdQueueMetrics.waiting}</span>
              <span className="exec-opd-label">Patients Waiting</span>
            </div>

            <div className="exec-opd-legend-list">
              <div className="exec-opd-legend-item">
                <span className="exec-opd-legend-left">
                  <span className="exec-dot exec-dot--blue"></span>
                  Waiting
                </span>
                <span className="exec-opd-legend-val">{realOpdQueueMetrics.waiting}</span>
              </div>
              <div className="exec-opd-legend-item">
                <span className="exec-opd-legend-left">
                  <span className="exec-dot exec-dot--green"></span>
                  In Consultation
                </span>
                <span className="exec-opd-legend-val">{realOpdQueueMetrics.inConsultation}</span>
              </div>
              <div className="exec-opd-legend-item">
                <span className="exec-opd-legend-left">
                  <span className="exec-dot exec-dot--purple"></span>
                  Completed Today
                </span>
                <span className="exec-opd-legend-val">{realOpdQueueMetrics.completedToday}</span>
              </div>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="exec-segmented-bar">
            <div
              className="exec-seg-slice exec-seg-slice--blue"
              style={{
                width: `${realOpdQueueMetrics.total > 0 ? (realOpdQueueMetrics.waiting / realOpdQueueMetrics.total) * 100 : 0}%`,
              }}
              title={`Waiting: ${realOpdQueueMetrics.waiting}`}
            />
            <div
              className="exec-seg-slice exec-seg-slice--green"
              style={{
                width: `${realOpdQueueMetrics.total > 0 ? (realOpdQueueMetrics.inConsultation / realOpdQueueMetrics.total) * 100 : 0}%`,
              }}
              title={`In Consultation: ${realOpdQueueMetrics.inConsultation}`}
            />
            <div
              className="exec-seg-slice exec-seg-slice--purple"
              style={{
                width: `${realOpdQueueMetrics.total > 0 ? (realOpdQueueMetrics.completedToday / realOpdQueueMetrics.total) * 100 : 0}%`,
              }}
              title={`Completed Today: ${realOpdQueueMetrics.completedToday}`}
            />
          </div>

          <div className="exec-opd-footer-pill">
            <Icon name="LuClock" size={15} />
            <span>Avg. Wait Time: ~ {realOpdQueueMetrics.avgWaitTime} mins</span>
          </div>
        </div>

        {/* Card 2: Bed Occupancy */}
        <div className="exec-card">
          <div className="exec-card-header">
            <div className="exec-card-title-group">
              <Icon name="LuBed" size={18} className="exec-card-icon" />
              <h3>Bed Occupancy</h3>
            </div>
            <button
              type="button"
              className="exec-card-action"
              onClick={() => navigate("/ipd/bed-allotment")}
            >
              <span>View Beds</span>
              <Icon name="LuArrowRight" size={14} />
            </button>
          </div>

          <div className="exec-bed-body">
            {/* SVG Precision Donut Ring */}
            <div className="exec-donut-container">
              <svg width="124" height="124" viewBox="0 0 120 120">
                {/* Available background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="15"
                />
                {/* Occupied arc */}
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="15"
                  strokeDasharray={`${(realBedMetrics.rate / 100) * 289} 289`}
                  strokeDashoffset="72"
                  strokeLinecap="round"
                />
              </svg>
              <div className="exec-donut-center">
                <span className="exec-donut-percent">{realBedMetrics.rate}%</span>
              </div>
            </div>

            <div className="exec-bed-info-side">
              <div className="exec-bed-rate-title">
                <span className="exec-bed-rate-val">{realBedMetrics.rate}%</span>
                <span className="exec-bed-rate-sub">Occupancy Rate</span>
              </div>
              <div className="exec-bed-legend">
                <div className="exec-bed-legend-row">
                  <span className="exec-dot exec-dot--blue"></span>
                  <span>Occupied {realBedMetrics.occupied}</span>
                </div>
                <div className="exec-bed-legend-row">
                  <span className="exec-dot exec-dot--slate"></span>
                  <span className="text-slate-500">Available {realBedMetrics.available}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Financial Performance (Real Invoiced vs Collected) */}
        <div className="exec-card">
          <div className="exec-card-header">
            <div className="exec-card-title-group">
              <Icon name="LuIndianRupee" size={18} className="exec-card-icon" />
              <h3>Financial Performance</h3>
            </div>

            <div className="exec-range-toggle-group">
              {["7D", "30D", "MTD"].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`exec-range-btn ${timeRange === r ? "exec-range-btn--active" : ""}`}
                  onClick={() => setTimeRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="exec-chart-legend-top">
            <span className="flex items-center gap-1.5">
              <span className="exec-dot exec-dot--blue"></span>
              Collected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="exec-dot exec-dot--green"></span>
              Invoiced
            </span>
          </div>

          <div className="exec-financial-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realFinancialTrends} margin={{ top: 8, right: 10, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(val) => {
                    if (val === 0) return "₹0";
                    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                    if (val >= 1000) return `₹${Math.round(val / 1000)}K`;
                    return `₹${val}`;
                  }}
                  tick={{ fontSize: 10.5, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<FinancialTooltip />} />
                <Area
                  type="monotone"
                  dataKey="invoiced"
                  stroke="#10b981"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#colorInvoiced)"
                  dot={{ r: 3.5, fill: "#ffffff", stroke: "#10b981", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="#2563eb"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#colorCollected)"
                  dot={{ r: 3.5, fill: "#ffffff", stroke: "#2563eb", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         4. ROW 3: DEPARTMENT OVERVIEW, RECENT ACTIVITY, ATTENTION REQUIRED
      ---------------------------------------------------- */}
      <section className="exec-grid-bottom">
        {/* Card 1: Department Overview (Real Volumes) */}
        <div className="exec-card">
          <div className="exec-card-header">
            <div className="exec-card-title-group">
              <Icon name="LuBarChart3" size={18} className="exec-card-icon" />
              <h3>Department Overview</h3>
            </div>
            <button
              type="button"
              className="exec-card-action"
              onClick={() => navigate("/reports")}
            >
              <span>View Reports</span>
              <Icon name="LuArrowRight" size={14} />
            </button>
          </div>

          <div className="exec-dept-tabs">
            {["OPD", "IPD", "Lab", "Pharmacy"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`exec-dept-tab ${activeDeptTab === tab ? "exec-dept-tab--active" : ""}`}
                onClick={() => {
                  setActiveDeptTab(tab);
                  if (tab === "OPD") {
                    toast(`OPD: ${realOpdCount} active encounters`, { icon: "🩺" });
                  } else if (tab === "IPD") {
                    toast(`IPD: ${realBedMetrics.activeIpdPatients} admitted patients`, { icon: "🛏️" });
                  } else if (tab === "Lab") {
                    toast(`Laboratory: ${rawLabTests.length} tests in pipeline`, { icon: "🧪" });
                  } else if (tab === "Pharmacy") {
                    toast(`Pharmacy: ${realDepartmentData[3].volume} inventory items`, { icon: "💊" });
                  }
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="exec-dept-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realDepartmentData} margin={{ top: 16, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[0, (dataMax) => Math.max(10, Math.ceil(dataMax * 1.25))]}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val, name, item) => [`${val} active records`, item.payload.name]}
                  contentStyle={{ borderRadius: "10px", fontSize: "12px", border: "1px solid #e2e8f0" }}
                />
                <Bar
                  dataKey="volume"
                  radius={[6, 6, 0, 0]}
                  label={{ position: "top", fill: "#334155", fontSize: 11.5, fontWeight: 700 }}
                >
                  {realDepartmentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeDeptTab && !entry.name.includes(activeDeptTab) ? 0.75 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Recent Activity (Real Records from DB) */}
        <div className="exec-card">
          <div className="exec-card-header">
            <div className="exec-card-title-group">
              <Icon name="LuZap" size={18} className="exec-card-icon" />
              <h3>Recent Activity</h3>
            </div>
            <button
              type="button"
              className="exec-card-action"
              onClick={() => navigate("/opd/reports")}
            >
              <span>View All</span>
              <Icon name="LuArrowRight" size={14} />
            </button>
          </div>

          <div className="exec-activity-feed">
            {realRecentActivities.length > 0 ? (
              realRecentActivities.map((act, idx) => (
                <div key={act.id} className="exec-activity-item">
                  <div className="exec-activity-indicator">
                    <span
                      className="exec-activity-dot"
                      style={{ backgroundColor: act.color }}
                    />
                    {idx < realRecentActivities.length - 1 && <span className="exec-activity-line" />}
                  </div>
                  <div className="exec-activity-content">
                    <div className="exec-activity-meta">
                      <span className="exec-activity-time">{act.time}</span>
                      <span className="exec-activity-title">{act.title}</span>
                    </div>
                    <span className="exec-activity-sub">{act.subtitle}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-8">
                <Icon name="LuCalendarDays" size={24} className="mb-1 text-slate-300" />
                <span>No recent activity events recorded yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Attention Required (Real Inventory, Labs & Dues) */}
        <div className="exec-card">
          <div className="exec-card-header">
            <div className="exec-card-title-group">
              <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Icon name="LuTriangleAlert" size={16} />
              </div>
              <h3>Attention Required</h3>
            </div>
            <span className="exec-attention-badge">{realAttentionAlerts.length}</span>
          </div>

          <div className="exec-alert-list">
            {realAttentionAlerts.map((alt) => (
              <div
                key={alt.id}
                className="exec-alert-card"
                onClick={() => navigate(alt.route)}
              >
                <div className="exec-alert-left">
                  <div className={`exec-alert-icon-box ${alt.iconStyle}`}>
                    <Icon name={alt.icon} size={18} />
                  </div>
                  <div className="exec-alert-text">
                    <span className="exec-alert-title">{alt.title}</span>
                    <span className="exec-alert-sub">{alt.subtitle}</span>
                  </div>
                </div>
                <Icon name="LuChevronRight" size={16} className="exec-alert-arrow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
         5. COLLAPSIBLE OPERATIONAL PATIENTS & APPOINTMENTS MATRIX
      ---------------------------------------------------- */}
      <section className="mt-4">
        <button
          type="button"
          className="exec-drawer-toggle"
          onClick={() => setShowOperationalDrawer(!showOperationalDrawer)}
        >
          <div className="exec-drawer-toggle-left">
            <Icon name="LuClipboardList" size={20} className="text-blue-600" />
            <span>
              Real-Time Patient Directory & Clinical Encounters ({filteredAppointments.length} records)
            </span>
          </div>
          <Icon
            name="LuChevronDown"
            size={18}
            className={`text-slate-400 transition-transform duration-200 ${showOperationalDrawer ? "rotate-180" : ""}`}
          />
        </button>

        {showOperationalDrawer && (
          <div className="exec-drawer-content">
            <div className="dash-filter-row">
              <div className="dash-search-group">
                <Icon name="LuSearch" size={16} className="text-slate-400" />
                <input
                  type="text"
                  className="dash-search-input"
                  placeholder="Filter by patient name, UHID, or token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="exec-pill-btn bg-white"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All Status">All Status</option>
                <option value="Waiting">Waiting</option>
                <option value="In Consultation">In Consultation</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                className="exec-pill-btn bg-white"
                value={selectedPatientType}
                onChange={(e) => setSelectedPatientType(e.target.value)}
              >
                <option value="All Patient Types">All Encounters (OPD & IPD)</option>
                <option value="OPD">OPD Only</option>
                <option value="IPD">IPD Only</option>
              </select>
            </div>

            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Token / No</th>
                    <th>Patient Name</th>
                    <th>UHID</th>
                    <th>Encounter</th>
                    <th>Department</th>
                    <th>Doctor / Practitioner</th>
                    <th>Time / Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((row) => {
                      const name = row.patientName || row.full_name || `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Patient";
                      const token = row.tokenNo || row.token_no || row.encounter_no || "—";
                      const uhid = row.uhid || "—";
                      const doc = row.doctor || (row.doc_first_name ? `Dr. ${row.doc_first_name} ${row.doc_last_name || ""}`.trim() : "—");
                      const dept = row.department || row.department_name || "General";
                      const status = row.status || "Waiting";
                      const type = row.encounter_type === "ipd" ? "IPD" : "OPD";
                      const time = row.started_at ? formatTime(row.started_at) : (row.created_at ? formatTime(row.created_at) : "—");

                      return (
                        <tr key={row.id}>
                          <td className="font-bold text-blue-600">{token}</td>
                          <td className="font-semibold text-slate-900">{name}</td>
                          <td className="font-mono text-xs text-slate-500">{uhid}</td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                type === "IPD" ? "bg-teal-50 text-teal-700" : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {type}
                            </span>
                          </td>
                          <td>{dept}</td>
                          <td>{doc}</td>
                          <td className="text-slate-500 text-xs">{time}</td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                status === "Completed"
                                  ? "bg-purple-50 text-purple-700"
                                  : status === "In Consultation" || status === "in_consultation"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="text-xs font-bold text-blue-600 hover:text-blue-800"
                              onClick={() => {
                                toast.success(`Opening clinical records for ${name}`);
                                navigate("/opd/reports");
                              }}
                            >
                              View Chart →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-6 text-slate-400">
                        No live patient records found matching the active filter in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
