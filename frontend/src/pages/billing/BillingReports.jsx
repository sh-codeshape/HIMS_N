import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PageContainer from "../../components/common/PageContainer.jsx";
import Icon from "../../components/common/Icon.jsx";
import billingService from "../../api/services/billingService";

export default function BillingReports() {
  const [activeTab, setActiveTab] = useState("pending-dues");
  const [loading, setLoading] = useState(true);

  // Filter States
  const [dateRange, setDateRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("All");
  const [encounterStateFilter, setEncounterStateFilter] = useState("All");
  const [page, setPage] = useState(1);

  // Data States
  const [summary, setSummary] = useState({
    totalInvoiced: 0,
    totalRevenue: 0,
    outstandingDues: 0,
    todayCollections: 0,
    totalInvoices: 0,
    pendingInvoicesCount: 0,
    labTotalCharges: 0,
    labUnbilledDues: 0,
    labBilledAmount: 0,
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

  // Load KPI Summary
  const loadSummary = async () => {
    try {
      const data = await billingService.getReportsSummary();
      if (data) {
        setSummary(data);
      }
    } catch (err) {
      console.warn("Summary load warning:", err);
    }
  };

  // Load Pending Dues Table
  const loadPendingDues = async () => {
    setLoading(true);
    try {
      const filters = {
        search: searchQuery,
        invoiceType: invoiceTypeFilter,
        encounterStatus: encounterStateFilter,
        page,
        limit: 20,
      };

      if (dateRange === "today") {
        filters.dateFrom = new Date().toISOString().split("T")[0];
      } else if (dateRange === "7days") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        filters.dateFrom = d.toISOString().split("T")[0];
      } else if (dateRange === "month") {
        const d = new Date();
        d.setDate(1);
        filters.dateFrom = d.toISOString().split("T")[0];
      }

      const res = await billingService.getPendingDues(filters);
      setPendingDuesData(res || { invoices: [], pagination: { total: 0 } });
    } catch (err) {
      toast.error("Failed to load pending dues report");
    } finally {
      setLoading(false);
    }
  };

  // Load Collections Ledger
  const loadCollections = async () => {
    try {
      const res = await billingService.getCollections();
      if (res) {
        setCollectionsData(res);
      }
    } catch (err) {
      console.warn("Collections load warning:", err);
    }
  };

  useEffect(() => {
    loadSummary();
    loadCollections();
  }, []);

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

  return (
    <PageContainer
      title="Billing & Revenue Reports"
      subtitle="Comprehensive financial telemetry: outstanding patient dues, department revenue, and collections ledger"
    >
      <div className="space-y-6">
        {/* ── TOP ACTION BAR ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">Period:</span>
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

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              <Icon name="LuPrinter" size={14} />
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={() => {
                loadSummary();
                loadPendingDues();
                loadCollections();
                toast.success("Financial records refreshed!");
              }}
              className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              <Icon name="LuRotateCw" size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── 1. KPI SUMMARY TILES ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Outstanding Patient Dues */}
          <div className="bg-white border-2 border-amber-200 rounded-xl p-5 shadow-sm relative overflow-hidden bg-gradient-to-br from-amber-50/40 to-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Total Outstanding Dues
              </span>
              <span className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <Icon name="LuAlertTriangle" size={18} />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700">
              {formatINR(summary.outstandingDues)}
            </div>
            <div className="text-xs text-amber-800/80 mt-1 font-medium flex items-center justify-between">
              <span>{summary.pendingInvoicesCount} invoices pending payment</span>
              <span className="text-[11px] bg-amber-100 px-1.5 py-0.5 rounded">Action Req.</span>
            </div>
          </div>

          {/* Card 2: Total Realized Collections */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Revenue Collected
              </span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Icon name="LuCheckCircle2" size={18} />
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600">
              {formatINR(summary.totalRevenue)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Realized payments in system</div>
          </div>

          {/* Card 3: Today's Receipts */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today&apos;s Collections
              </span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Icon name="LuCalendar" size={18} />
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {formatINR(summary.todayCollections)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Cash, Card, UPI receipts today</div>
          </div>

          {/* Card 4: Pathology / Lab Charges */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pathology / Lab Volume
              </span>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Icon name="LuFlaskConical" size={18} />
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-purple-700">
              {formatINR(summary.labTotalCharges)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Unbilled Lab Dues: <span className="font-semibold text-amber-600">{formatINR(summary.labUnbilledDues)}</span>
            </div>
          </div>
        </div>

        {/* ── 2. MAIN REPORT TABS ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 pt-4 flex space-x-6">
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
              {summary.pendingInvoicesCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">
                  {summary.pendingInvoicesCount}
                </span>
              )}
            </button>

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

            <button
              type="button"
              onClick={() => setActiveTab("departments")}
              className={`pb-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "departments"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon name="LuBarChart3" size={16} />
              <span>Department Revenue</span>
            </button>
          </div>

          {/* ── TAB 1: PENDING DUES REGISTER ── */}
          {activeTab === "pending-dues" && (
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

          {/* ── TAB 2: COLLECTIONS LEDGER ── */}
          {activeTab === "collections" && (
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

          {/* ── TAB 3: DEPARTMENT BREAKDOWN ── */}
          {activeTab === "departments" && (
            <div className="p-6 space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Department / Module</th>
                      <th className="py-3.5 px-4 text-right">Total Charges Posted</th>
                      <th className="py-3.5 px-4 text-right">Invoiced / Billed</th>
                      <th className="py-3.5 px-4 text-right">Pending / Running Dues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-4 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="p-1.5 bg-purple-50 text-purple-600 rounded">
                          <Icon name="LuFlaskConical" size={16} />
                        </span>
                        <span>Pathology &amp; Laboratory Module</span>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {formatINR(summary.labTotalCharges)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-emerald-600">
                        {formatINR(summary.labBilledAmount)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-amber-700">
                        {formatINR(summary.labUnbilledDues)}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-4 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
                          <Icon name="LuBedDouble" size={16} />
                        </span>
                        <span>Inpatient Department (IPD) Final &amp; Bed Charges</span>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {formatINR(summary.totalInvoiced)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-emerald-600">
                        {formatINR(summary.totalRevenue)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-amber-700">
                        {formatINR(summary.outstandingDues)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: BILL DETAILS ── */}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
