import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PageContainer from "../../components/common/PageContainer.jsx";
import Icon from "../../components/common/Icon.jsx";
import billingService from "../../api/services/billingService";
import { useRole } from "../../hooks/useRole.js";
import {
  RevenueTrendChart,
  DepartmentBreakdownChart,
  DoctorRevenueChart,
  DiagnosticTestVolumeChart,
  PaymentModeDonutChart,
  AnalyticsKpiCard,
} from "../../components/analytics";

export default function BillingReports() {
  const { roles, permissions, hasRole, hasPermission, isSuperAdmin, isDeveloper } = useRole();

  // ── RBAC PERMISSION EVALUATION ──
  const isDoctorRole = hasRole(["doctor"]);
  const isAdminOrManager =
    isSuperAdmin ||
    isDeveloper ||
    hasRole(["admin", "super_admin", "developer", "accountant", "hospital_admin"]) ||
    hasPermission("billing.manage");

  const canViewFinancials =
    isAdminOrManager ||
    hasPermission("billing.view") ||
    hasPermission("reports.view") ||
    isDoctorRole;

  const canViewDoctorRevenue =
    isAdminOrManager ||
    isDoctorRole ||
    hasPermission("billing.view") ||
    hasPermission("reports.view");

  const canViewPathology =
    isAdminOrManager ||
    isDoctorRole ||
    hasPermission("billing.view") ||
    hasPermission("laboratory.view");

  const canViewDuesRegister =
    isAdminOrManager ||
    hasPermission("billing.view") ||
    hasRole(["reception", "billing_clerk"]);

  const canCollectDues =
    isSuperAdmin ||
    isDeveloper ||
    hasPermission("billing.create") ||
    hasPermission("billing.edit") ||
    hasRole(["admin", "reception", "billing_clerk", "accountant"]);

  const canViewCollections =
    isAdminOrManager ||
    hasPermission("billing.view") ||
    hasRole(["accountant", "reception"]);

  // Role title label for visual telemetry badge
  const roleBadgeLabel = isSuperAdmin
    ? "👑 Super Admin View"
    : isDeveloper
    ? "⚡ Developer Mode"
    : hasRole(["admin"])
    ? "🛡️ Administrator Full View"
    : isDoctorRole
    ? "🩺 Practitioner Scoped View"
    : hasRole(["reception", "billing_clerk"])
    ? "💼 Billing & Cashier Desk"
    : "📊 Read-Only View";

  // Tab State (Default to overview if permitted, otherwise first permitted tab)
  const [activeTab, setActiveTab] = useState(
    canViewFinancials ? "overview" : canViewDuesRegister ? "pending-dues" : "collections"
  );
  const [loading, setLoading] = useState(true);

  // Filter States
  const [dateRange, setDateRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("All");
  const [encounterStateFilter, setEncounterStateFilter] = useState("All");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [page, setPage] = useState(1);

  // Data States
  const [analytics, setAnalytics] = useState({
    kpis: {
      totalInvoiced: 0,
      totalRevenue: 0,
      outstandingDues: 0,
      todayCollections: 0,
      totalInvoices: 0,
      pendingInvoicesCount: 0,
      collectionEfficiency: 0,
    },
    revenueTrends: [],
    departmentRevenue: [],
    doctorRevenue: [],
    pathologyAnalytics: {
      totalRevenue: 0,
      billedAmount: 0,
      unbilledDues: 0,
      totalTests: 0,
      topTests: [],
    },
    paymentModes: [],
    byInvoiceType: [],
  });

  const [pendingDuesData, setPendingDuesData] = useState({
    invoices: [],
    pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
  });

  const [collectionsData, setCollectionsData] = useState({
    byPaymentMode: [],
    ledger: [],
  });

  // Selected Invoice Modal for Bill Preview
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Helper to compute date boundaries
  const getDateParams = (range) => {
    if (range === "today") {
      const today = new Date().toISOString().split("T")[0];
      return { dateFrom: today, dateTo: today };
    } else if (range === "7days") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { dateFrom: d.toISOString().split("T")[0] };
    } else if (range === "month") {
      const d = new Date();
      d.setDate(1);
      return { dateFrom: d.toISOString().split("T")[0] };
    }
    return {};
  };

  // Load High-Performance Live Analytics
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const dateParams = getDateParams(dateRange);
      const data = await billingService.getReportsAnalytics(dateParams);
      if (data) {
        setAnalytics(data);
      }
    } catch (err) {
      console.warn("Analytics load warning:", err);
      toast.error("Failed to load real-time analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Load Pending Dues Table
  const loadPendingDues = async () => {
    try {
      const dateParams = getDateParams(dateRange);
      const filters = {
        search: searchQuery,
        invoiceType: invoiceTypeFilter,
        encounterStatus: encounterStateFilter,
        page,
        limit: 20,
        ...dateParams,
      };

      const res = await billingService.getPendingDues(filters);
      setPendingDuesData(res || { invoices: [], pagination: { total: 0 } });
    } catch (err) {
      console.warn("Pending dues error:", err);
    }
  };

  // Load Collections Ledger
  const loadCollections = async () => {
    try {
      const dateParams = getDateParams(dateRange);
      const res = await billingService.getCollections(dateParams);
      if (res) {
        setCollectionsData(res);
      }
    } catch (err) {
      console.warn("Collections load warning:", err);
    }
  };

  // Refresh all data
  const refreshAll = () => {
    loadAnalytics();
    loadPendingDues();
    loadCollections();
    toast.success("Financial records refreshed!");
  };

  useEffect(() => {
    loadAnalytics();
    loadCollections();
  }, [dateRange]);

  useEffect(() => {
    if (activeTab === "pending-dues") {
      loadPendingDues();
    }
  }, [activeTab, searchQuery, invoiceTypeFilter, encounterStateFilter, dateRange, page]);

  // Format currency in Indian Rupees
  const formatINR = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter doctors in Doctor tab
  const filteredDoctors = analytics.doctorRevenue.filter((doc) => {
    if (!doctorSearch.trim()) return true;
    const term = doctorSearch.toLowerCase();
    return (
      doc.doctorName?.toLowerCase().includes(term) ||
      doc.specialty?.toLowerCase().includes(term)
    );
  });

  return (
    <PageContainer
      title="Billing & Revenue Reports"
      subtitle="Comprehensive real-time financial telemetry: revenue curves, doctor attribution, and collections ledger"
    >
      <div className="space-y-6">
        {/* ── TOP ACTION BAR & RBAC BADGE ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">
              Period:
            </span>
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "7days", label: "Last 7 Days" },
              { id: "month", label: "This Month" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setDateRange(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  dateRange === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action buttons + Role Badge */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span>{roleBadgeLabel}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              >
                <Icon name="LuPrinter" size={14} />
                <span className="hidden sm:inline">Print Report</span>
              </button>
              <button
                type="button"
                onClick={refreshAll}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
              >
                <Icon name="LuRotateCw" size={14} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 1. MODULAR KPI SUMMARY TILES ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsKpiCard
            title="Total Revenue Collected"
            value={analytics.kpis.totalRevenue}
            subtext={`${analytics.kpis.collectionEfficiency}% collection rate`}
            icon="LuCheckCircle2"
            colorScheme="emerald"
            badge="Realized"
          />

          <AnalyticsKpiCard
            title="Total Outstanding Dues"
            value={analytics.kpis.outstandingDues}
            subtext={`${analytics.kpis.pendingInvoicesCount} invoices pending payment`}
            icon="LuAlertTriangle"
            colorScheme="amber"
            badge={analytics.kpis.pendingInvoicesCount > 0 ? "Action Req." : "Clear"}
          />

          <AnalyticsKpiCard
            title="Today's Receipts"
            value={analytics.kpis.todayCollections}
            subtext="Cash, UPI & Card collections today"
            icon="LuCalendar"
            colorScheme="blue"
          />

          <AnalyticsKpiCard
            title="Total Invoiced Gross"
            value={analytics.kpis.totalInvoiced}
            subtext={`${analytics.kpis.totalInvoices} patient invoices issued`}
            icon="LuReceipt"
            colorScheme="indigo"
          />
        </div>

        {/* ── 2. MAIN REPORT TABS (RBAC GUARDED) ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 pt-4 flex flex-wrap gap-x-6 gap-y-2">
            {canViewFinancials && (
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`pb-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === "overview"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon name="LuLineChart" size={16} />
                <span>Financial Overview &amp; Telemetry</span>
              </button>
            )}

            {canViewDoctorRevenue && (
              <button
                type="button"
                onClick={() => setActiveTab("doctor-revenue")}
                className={`pb-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === "doctor-revenue"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon name="LuStethoscope" size={16} />
                <span>Doctor Revenue Attribution</span>
              </button>
            )}

            {canViewPathology && (
              <button
                type="button"
                onClick={() => setActiveTab("pathology")}
                className={`pb-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === "pathology"
                    ? "border-purple-600 text-purple-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon name="LuFlaskConical" size={16} />
                <span>Pathology &amp; Diagnostics</span>
              </button>
            )}

            {canViewDuesRegister && (
              <button
                type="button"
                onClick={() => setActiveTab("pending-dues")}
                className={`pb-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === "pending-dues"
                    ? "border-amber-500 text-amber-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon name="LuAlertCircle" size={16} />
                <span>Pending Dues Register</span>
                {analytics.kpis.pendingInvoicesCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">
                    {analytics.kpis.pendingInvoicesCount}
                  </span>
                )}
              </button>
            )}

            {canViewCollections && (
              <button
                type="button"
                onClick={() => setActiveTab("collections")}
                className={`pb-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === "collections"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon name="LuWallet" size={16} />
                <span>Collections Ledger</span>
              </button>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: FINANCIAL OVERVIEW & RECHARTS TELEMETRY
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && canViewFinancials && (
            <div className="p-6 space-y-6">
              {/* Modular Recharts Area Trendline */}
              <RevenueTrendChart
                data={analytics.revenueTrends}
                height={340}
                title="Revenue & Collections Telemetry Curve"
                subtitle="Real-time daily progression of invoiced billing, realized receipts, and outstanding balances"
              />

              {/* Two Column Grid: Department Breakdown & Payment Mode Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <DepartmentBreakdownChart
                    data={analytics.departmentRevenue}
                    height={320}
                    title="Revenue by Hospital Department"
                    subtitle="Real-time breakdown of billed vs unbilled running charges across clinical & diagnostic modules"
                  />
                </div>
                <div>
                  <PaymentModeDonutChart
                    data={analytics.paymentModes}
                    height={320}
                    title="Payment Mode Distribution"
                    subtitle="Share of collections across Cash, UPI and Card payment methods"
                  />
                </div>
              </div>

              {/* Invoice Type Distribution Cards */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Billing Episode Distribution
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {analytics.byInvoiceType.map((inv, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3">
                      <div className="text-xs font-semibold text-slate-500 capitalize">
                        {inv.type?.replace("_", " ")} Bills
                      </div>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {formatINR(inv.totalAmount)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between">
                        <span>{inv.count} bills</span>
                        <span className="text-amber-700 font-medium">Due: {formatINR(inv.dueAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: DOCTOR REVENUE ATTRIBUTION
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "doctor-revenue" && canViewDoctorRevenue && (
            <div className="p-6 space-y-6">
              {/* Modular Doctor Revenue Horizontal Bar Chart */}
              <DoctorRevenueChart
                data={analytics.doctorRevenue}
                height={320}
                title="Doctor Revenue Ranking & Breakdown"
                subtitle="Comparison of revenue generated by practitioners from patient consultations and procedures"
              />

              {/* Doctor Search & Telemetry Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-800">
                    Practitioner Financial Ledger ({analytics.doctorRevenue.length} Doctors)
                  </h4>
                  <div className="w-full sm:w-72 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Icon name="LuSearch" size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search doctor or specialty..."
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Doctor Name</th>
                        <th className="py-3 px-4">Specialty / Role</th>
                        <th className="py-3 px-4 text-center">Patients Seen</th>
                        <th className="py-3 px-4 text-right">Consultation Fees</th>
                        <th className="py-3 px-4 text-right">Procedures &amp; Tests</th>
                        <th className="py-3 px-4 text-right">Total Attributed</th>
                        <th className="py-3 px-4 text-center">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400">
                            No practitioners matching search.
                          </td>
                        </tr>
                      ) : (
                        filteredDoctors.map((doc, idx) => {
                          const totalHospital = analytics.kpis.totalInvoiced || 1;
                          const sharePct = ((doc.totalRevenue / totalHospital) * 100).toFixed(1);

                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                  {doc.doctorName?.replace(/^Dr\.?\s*/i, "")?.[0] || "D"}
                                </span>
                                <span>{doc.doctorName}</span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 text-xs">
                                {doc.specialty}
                              </td>
                              <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                                {doc.encounterCount}
                              </td>
                              <td className="py-3.5 px-4 text-right text-indigo-700 font-medium">
                                {formatINR(doc.consultationRevenue)}
                              </td>
                              <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                                {formatINR(doc.procedureRevenue)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-base">
                                {formatINR(doc.totalRevenue)}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                                  {sharePct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: PATHOLOGY & DIAGNOSTIC ANALYTICS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "pathology" && canViewPathology && (
            <div className="p-6 space-y-6">
              {/* Pathology KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    Total Lab Revenue
                  </div>
                  <div className="text-2xl font-black text-purple-900 mt-1">
                    {formatINR(analytics.pathologyAnalytics.totalRevenue)}
                  </div>
                  <div className="text-xs text-purple-600 mt-0.5">
                    {analytics.pathologyAnalytics.totalTests} total lab investigations
                  </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Billed / Realized
                  </div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">
                    {formatINR(analytics.pathologyAnalytics.billedAmount)}
                  </div>
                  <div className="text-xs text-emerald-600 mt-0.5">Settled diagnostic billing</div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Unbilled / Running Dues
                  </div>
                  <div className="text-2xl font-black text-amber-900 mt-1">
                    {formatINR(analytics.pathologyAnalytics.unbilledDues)}
                  </div>
                  <div className="text-xs text-amber-600 mt-0.5">In-progress or awaiting discharge bill</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Diagnostic Modality
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">In-House Lab</div>
                  <div className="text-xs text-slate-500 mt-0.5">Hematology &amp; Biochemistry</div>
                </div>
              </div>

              {/* Diagnostic Test Volume Chart */}
              <DiagnosticTestVolumeChart
                data={analytics.pathologyAnalytics.topTests}
                height={320}
                title="Top Diagnostic Investigations by Revenue & Volume"
                subtitle="Realized revenue from routine panels (CBC, KFT, LFT, Lipid, HbA1c, ECG)"
              />

              {/* Detailed Tests Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Laboratory Investigation Breakdown
                </div>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                      <th className="py-3 px-4">Test / Investigation Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Volume Ordered</th>
                      <th className="py-3 px-4 text-right">Standard Rate</th>
                      <th className="py-3 px-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.pathologyAnalytics.topTests.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                          <span className="p-1 bg-purple-100 text-purple-700 rounded">
                            <Icon name="LuFlaskConical" size={14} />
                          </span>
                          <span>{t.name}</span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-medium">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {t.volume}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {formatINR(t.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-purple-800 text-base">
                          {formatINR(t.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4: PENDING DUES REGISTER
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "pending-dues" && canViewDuesRegister && (
            <div className="p-6 space-y-4">
              {/* Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Icon name="LuSearch" size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by UHID, patient name, invoice no..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <select
                    value={invoiceTypeFilter}
                    onChange={(e) => {
                      setInvoiceTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="All">All Invoice Types</option>
                    <option value="ipd_final">IPD Final Discharge Bill</option>
                    <option value="opd">OPD Consultation &amp; Services</option>
                    <option value="pharmacy">Pharmacy Bill</option>
                    <option value="laboratory">Laboratory Bill</option>
                  </select>
                </div>

                <div>
                  <select
                    value={encounterStateFilter}
                    onChange={(e) => {
                      setEncounterStateFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="All">All Patient States</option>
                    <option value="Discharged">Discharged Patients (With Dues)</option>
                    <option value="Admitted">Currently Admitted (IPD)</option>
                    <option value="Active">Active Ambulatory / OPD</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="inline-block animate-spin text-amber-600 mb-2">
                    <Icon name="LuRotateCw" size={24} />
                  </div>
                  <p className="text-sm">Retrieving pending dues register...</p>
                </div>
              ) : pendingDuesData.invoices.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Icon name="LuCheckCircle2" size={32} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-base font-semibold text-slate-800">No Outstanding Dues Found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    All patient accounts matching the selected criteria are fully settled.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Invoice No</th>
                        <th className="py-3 px-4">Patient / UHID</th>
                        <th className="py-3 px-4">Bill Type</th>
                        <th className="py-3 px-4 text-center">Patient State</th>
                        <th className="py-3 px-4 text-right">Total Bill</th>
                        <th className="py-3 px-4 text-right">Paid</th>
                        <th className="py-3 px-4 text-right text-amber-800 bg-amber-50/50">
                          Due Amount
                        </th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingDuesData.invoices.map((inv) => {
                        const isDischarged = inv.patient_encounter_state === "Discharged";
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                              {inv.invoice_no}
                              <div className="text-[11px] font-sans text-slate-400">
                                {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString("en-GB") : "—"}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900">
                                {inv.first_name} {inv.last_name || ""}
                              </div>
                              <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                <span>{inv.uhid}</span>
                                {inv.phone && <span className="text-[11px] text-slate-400">· {inv.phone}</span>}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                                {inv.invoice_type?.replace("_", " ") || "Bill"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {isDischarged ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  Discharged
                                </span>
                              ) : inv.patient_encounter_state === "Admitted" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  Admitted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                  Active
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                              {formatINR(inv.total_amount)}
                            </td>

                            <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                              {formatINR(inv.paid_amount)}
                            </td>

                            <td className="py-3.5 px-4 text-right font-black text-amber-700 bg-amber-50/40 text-base">
                              {formatINR(inv.due_amount)}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 capitalize">
                                {inv.invoice_status || "issued"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(inv)}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                              >
                                View Bill
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 5: COLLECTIONS LEDGER
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "collections" && canViewCollections && (
            <div className="p-6 space-y-6">
              {/* Payment Mode Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {collectionsData.byPaymentMode.map((m, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {m.payment_mode}
                    </div>
                    <div className="mt-1 text-xl font-bold text-slate-900">
                      {formatINR(m.total_collected)}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {m.transaction_count} transaction(s)
                    </div>
                  </div>
                ))}
              </div>

              {/* Ledger Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Recent Payment Receipts
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-xs">
                        <th className="py-3 px-4">Receipt No</th>
                        <th className="py-3 px-4">Date / Time</th>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Payment Mode</th>
                        <th className="py-3 px-4 text-right">Amount Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {collectionsData.ledger.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-slate-400">
                            No payment receipts recorded yet.
                          </td>
                        </tr>
                      ) : (
                        collectionsData.ledger.map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">
                              {pay.receipt_no}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500">
                              {pay.paid_at ? new Date(pay.paid_at).toLocaleString("en-GB") : "—"}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {pay.first_name} {pay.last_name || ""}
                              {pay.uhid && (
                                <span className="text-xs text-slate-400 font-mono ml-1.5">
                                  ({pay.uhid})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {pay.payment_method_name || "Cash"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600">
                              {formatINR(pay.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: BILL DETAILS & RBAC-CONTROLLED ACTIONS ── */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Invoice Details</h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedInvoice.invoice_no}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedInvoice.first_name} {selectedInvoice.last_name || ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UHID:</span>
                  <span className="font-mono font-medium text-slate-700">{selectedInvoice.uhid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Type:</span>
                  <span className="capitalize font-medium text-slate-700">
                    {selectedInvoice.invoice_type?.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient State:</span>
                  <span className="font-semibold text-amber-700">
                    {selectedInvoice.patient_encounter_state}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatINR(selectedInvoice.subtotal)}</span>
                </div>
                {Number(selectedInvoice.tax_total) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax:</span>
                    <span>{formatINR(selectedInvoice.tax_total)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-base pt-1 border-t border-slate-100">
                  <span>Total Amount:</span>
                  <span>{formatINR(selectedInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Paid to Date:</span>
                  <span>{formatINR(selectedInvoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-black text-lg pt-1 border-t border-dashed border-slate-200">
                  <span>Outstanding Due:</span>
                  <span>{formatINR(selectedInvoice.due_amount)}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Close
                </button>

                {/* RBAC-controlled action button: only users with billing write permission can collect dues */}
                {canCollectDues ? (
                  <button
                    type="button"
                    onClick={() => {
                      toast.success(`Payment collection slip for ${selectedInvoice.invoice_no} triggered`);
                      setSelectedInvoice(null);
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition shadow-sm"
                  >
                    Collect Dues
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    Read-Only (Collection restricted)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
