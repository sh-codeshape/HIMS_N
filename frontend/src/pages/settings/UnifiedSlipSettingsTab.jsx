import React, { useState, useEffect, useMemo, useRef } from "react";
import Icon from "../../components/common/Icon.jsx";
import printEngine, { SLIP_SETTINGS_KEYS } from "../../services/printEngine.js";
import { SLIP_SAMPLE_DATA, SLIP_TYPES, loadSharedPrintSettings } from "./sharedPrintConfig.js";

export default function UnifiedSlipSettingsTab({ slipType = "opd", onOpenMaster }) {
  const normType = slipType === "ipd" ? "ipd_admission" : slipType;
  const isReceipt = normType === "ipd_receipt";

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const iframeRef = useRef(null);

  const sampleData = useMemo(() => {
    return SLIP_SAMPLE_DATA[normType] || SLIP_SAMPLE_DATA.all || {};
  }, [normType]);

  const slipMeta = useMemo(() => {
    return SLIP_TYPES.find((t) => t.id === normType) || {
      id: normType,
      label: "Encounter Slip",
      defaultTitle: "HOSPITAL ENCOUNTER SLIP",
      defaultCopy: "PATIENT COPY",
    };
  }, [normType]);

  // Load merged settings on mount or tab change
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const s = await printEngine.loadSlipSettings(normType, true);
        if (mounted) {
          setSettings(s);
        }
      } catch (err) {
        console.warn(`Failed loading settings for ${normType}:`, err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [normType]);

  // Real-time preview HTML matching 1:1 what is printed
  const previewHtml = useMemo(() => {
    if (!settings) return "";
    return printEngine.buildSlipHTML(normType, sampleData, settings, { isPreview: true });
  }, [normType, sampleData, settings]);

  // Write preview HTML to sandboxed iframe
  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      try {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(previewHtml);
          doc.close();
        }
      } catch (e) {
        console.warn("Iframe render fallback:", e);
      }
    }
  }, [previewHtml]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus(null);
      await printEngine.saveSlipSettings(normType, settings);
      setSaveStatus({
        type: "success",
        message: `${slipMeta.label} settings saved successfully! All hospital counters now use this configuration.`,
      });
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncMaster = async () => {
    try {
      setLoading(true);
      const master = await loadSharedPrintSettings();
      if (master) {
        const fresh = await printEngine.loadSlipSettings(normType, true);
        setSettings(fresh);
        setSaveStatus({
          type: "success",
          message: "Synced Hospital Branding, Demographics & Footer from Master Shared Designer!",
        });
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = () => {
    if (!settings) return;
    printEngine.printSlip(normType, sampleData, settings);
  };

  const updateSlipConfig = (field, val) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const prevSlipConfigs = prev.slipConfigs || {};
      const currentConfig = prevSlipConfigs[normType] || {};
      return {
        ...prev,
        slipConfigs: {
          ...prevSlipConfigs,
          [normType]: {
            ...currentConfig,
            [field]: val,
          },
        },
      };
    });
  };

  const updatePage = (field, val) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        page: {
          ...(prev.page || {}),
          [field]: val,
        },
      };
    });
  };

  const updateSection = (section, field, val) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...(prev[section] || {}),
          [field]: val,
        },
      };
    });
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500">
        <Icon name="LuLoader" size={32} className="animate-spin text-sky-600 mb-3" />
        <p className="font-semibold text-sm">Loading {slipMeta.label} configuration...</p>
      </div>
    );
  }

  const currentConfig = settings.slipConfigs?.[normType] || {};
  const currentTitle = currentConfig.title || slipMeta.defaultTitle;
  const currentCopy = currentConfig.copyBadge || slipMeta.defaultCopy;
  const currentPaper = isReceipt ? "A5" : (settings.page?.size || "A4").toUpperCase();

  return (
    <div className="space-y-6">
      {/* Top Action & Sync Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/90 rounded-xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-sky-950">
            {slipMeta.label} — Linked to Master Shared Letterhead &amp; Demographics
          </span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-sky-700 border border-sky-200 shadow-2xs">
            100% In Sync
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncMaster}
            className="px-3 py-1.5 text-xs font-bold bg-white text-sky-800 border border-sky-300 rounded-lg hover:bg-sky-100 flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Import latest branding & footer changes from Master"
          >
            <Icon name="LuDownload" size={13} />
            <span>Sync from Master</span>
          </button>
          <button
            type="button"
            onClick={handleTestPrint}
            className="px-3.5 py-1.5 text-xs font-bold text-sky-900 bg-sky-100/80 hover:bg-sky-200 border border-sky-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Icon name="LuPrinter" size={14} />
            <span>Test Print</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-bold text-white bg-sky-900 hover:bg-sky-950 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Icon name={saving ? "LuLoader" : "LuSave"} size={14} className={saving ? "animate-spin" : ""} />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {saveStatus && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            saveStatus.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name={saveStatus.type === "success" ? "LuCheckCircle" : "LuAlertTriangle"} size={16} />
            <span>{saveStatus.message}</span>
          </div>
          <button type="button" onClick={() => setSaveStatus(null)} className="text-slate-400 hover:text-slate-600">
            <Icon name="LuX" size={14} />
          </button>
        </div>
      )}

      {/* Main Grid: Left Controls (5 cols) & Right True-Print Preview (7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls */}
        <div className="xl:col-span-5 space-y-5">
          {/* Card 1: Master Link & Quick Navigation */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Icon name="LuLayers" size={16} className="text-sky-700" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Master Shared Integration</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This slip inherits the <strong>Hospital Header, Logo, Slogan, Contact Details, Accreditations, Demographics &amp; Footer</strong> from the Master Designer.
            </p>

            {onOpenMaster && (
              <button
                type="button"
                onClick={onOpenMaster}
                className="w-full py-2 px-3 bg-gradient-to-r from-sky-700 to-indigo-800 hover:from-sky-800 hover:to-indigo-900 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 text-xs transition-all"
              >
                <Icon name="LuSlidersHorizontal" size={14} />
                <span>Open Master Designer (Move Elements / Style Letterhead)</span>
              </button>
            )}
          </div>

          {/* Card 2: Slip Identity, Title & Copy Badge */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Icon name="LuHeading" size={16} className="text-sky-700" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Document Banner &amp; Copy Type</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title Banner</label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => updateSlipConfig("title", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold text-sky-950 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Copy Badge Label</label>
              <input
                type="text"
                value={currentCopy}
                onChange={(e) => updateSlipConfig("copyBadge", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold text-slate-700 uppercase"
              />
            </div>

            {/* Paper Size selector (unless A5 half page receipt) */}
            {!isReceipt && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Paper Sheet Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "A4", lbl: "A4 Standard", desc: "210 × 297 mm" },
                    { val: "A5", lbl: "A5 Compact", desc: "148 × 210 mm" },
                    { val: "Letter", lbl: "US Letter", desc: "8.5 × 11 in" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => updatePage("size", p.val)}
                      className={`p-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        currentPaper === p.val.toUpperCase()
                          ? "border-sky-600 bg-sky-50 text-sky-900 shadow-2xs ring-1 ring-sky-400"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold">{p.lbl}</div>
                      <div className="text-[10px] text-slate-400">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Slip-Specific Operational Particulars */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Icon name="LuClipboardList" size={16} className="text-sky-700" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                {slipMeta.label} Specific Content
              </h3>
            </div>

            {/* ── OPD SPECIFIC ── */}
            {normType === "opd" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Default Consult Fee (₹)</label>
                    <input
                      type="number"
                      value={settings.particulars?.consultFee ?? 500}
                      onChange={(e) => updateSection("particulars", "consultFee", Number(e.target.value))}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Fee (₹)</label>
                    <input
                      type="number"
                      value={settings.particulars?.regFee ?? 100}
                      onChange={(e) => updateSection("particulars", "regFee", Number(e.target.value))}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={settings.particulars?.showTable !== false}
                    onChange={(e) => updateSection("particulars", "showTable", e.target.checked)}
                    className="rounded text-sky-600 w-4 h-4"
                  />
                  <span>Show Service Particulars &amp; Amount Breakdown Table</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={
                      !settings.slipConfigs?.[normType]?.inactiveElements?.includes("terms.card") &&
                      settings.fieldStyles?.["terms.card"]?.show !== false &&
                      settings.opd?.showTerms !== false
                    }
                    onChange={(e) => {
                      const show = e.target.checked;
                      setSettings((prev) => {
                        const inactives = new Set(prev.slipConfigs?.[normType]?.inactiveElements || []);
                        if (show) {
                          inactives.delete("terms.card");
                          inactives.delete("terms.title");
                          inactives.delete("terms.list");
                          inactives.delete("terms.helpline");
                          inactives.delete("terms.address");
                        } else {
                          inactives.add("terms.card");
                          inactives.add("terms.title");
                          inactives.add("terms.list");
                          inactives.add("terms.helpline");
                          inactives.add("terms.address");
                        }
                        return {
                          ...prev,
                          opd: {
                            ...(prev.opd || {}),
                            showTerms: show,
                          },
                          fieldStyles: {
                            ...(prev.fieldStyles || {}),
                            "terms.card": {
                              ...(prev.fieldStyles?.["terms.card"] || {}),
                              show,
                            },
                          },
                          slipConfigs: {
                            ...(prev.slipConfigs || {}),
                            [normType]: {
                              ...(prev.slipConfigs?.[normType] || {}),
                              inactiveElements: Array.from(inactives),
                            },
                          },
                        };
                      });
                    }}
                    className="rounded text-sky-600 w-4 h-4"
                  />
                  <span>Show Hospital Instructions &amp; Policies Box (Terms List)</span>
                </label>
              </div>
            )}

            {/* ── IPD ADMISSION SPECIFIC ── */}
            {normType === "ipd_admission" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Advance Deposit (₹)</label>
                  <input
                    type="number"
                    value={settings.admission?.advanceDeposit ?? 10000}
                    onChange={(e) => updateSection("admission", "advanceDeposit", Number(e.target.value))}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>
                <div className="space-y-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.admission?.showBedCard !== false}
                      onChange={(e) => updateSection("admission", "showBedCard", e.target.checked)}
                      className="rounded text-sky-600 w-4 h-4"
                    />
                    <span>Show Bed Allotment &amp; Ward Matrix Section</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.admission?.showVitals !== false}
                      onChange={(e) => updateSection("admission", "showVitals", e.target.checked)}
                      className="rounded text-sky-600 w-4 h-4"
                    />
                    <span>Show Admission Triage Vitals (BP, Pulse, Temp, SpO2)</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── IPD BILLING SPECIFIC ── */}
            {normType === "ipd_billing" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GST / Tax Status</label>
                    <select
                      value={settings.gst?.mode || "exempt"}
                      onChange={(e) => updateSection("gst", "mode", e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    >
                      <option value="exempt">GST Exempt (Healthcare Default)</option>
                      <option value="taxable">Taxable Inpatient Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID for Cashless Settlement</label>
                    <input
                      type="text"
                      value={settings.bankDetails?.upiId || "narayan@upi"}
                      onChange={(e) => updateSection("bankDetails", "upiId", e.target.value)}
                      placeholder="narayan@upi"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.charges?.groupByDepartment !== false}
                      onChange={(e) => updateSection("charges", "groupByDepartment", e.target.checked)}
                      className="rounded text-sky-600 w-4 h-4"
                    />
                    <span>Group Charges by Department (ICU, Pharmacy, Lab, Nursing)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.settlement?.showPaymentBreakdown !== false}
                      onChange={(e) => updateSection("settlement", "showPaymentBreakdown", e.target.checked)}
                      className="rounded text-sky-600 w-4 h-4"
                    />
                    <span>Show Deposits Ledger &amp; Advance Reconciliation Table</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── IPD DISCHARGE SPECIFIC ── */}
            {normType === "ipd_discharge" && (
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.discharge?.showTimeline !== false}
                    onChange={(e) => updateSection("discharge", "showTimeline", e.target.checked)}
                    className="rounded text-sky-600 w-4 h-4"
                  />
                  <span>Show Admission &amp; Discharge Timeline Card</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.discharge?.showMedications !== false}
                    onChange={(e) => updateSection("discharge", "showMedications", e.target.checked)}
                    className="rounded text-sky-600 w-4 h-4"
                  />
                  <span>Show Discharge Medications Table (Dosage, Frequency, Duration)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.discharge?.showAdvice !== false}
                    onChange={(e) => updateSection("discharge", "showAdvice", e.target.checked)}
                    className="rounded text-sky-600 w-4 h-4"
                  />
                  <span>Show Follow-up Instructions &amp; Emergency Warnings</span>
                </label>
              </div>
            )}

            {/* ── IPD RECEIPT SPECIFIC ── */}
            {normType === "ipd_receipt" && (
              <div className="space-y-3">
                <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-lg text-xs text-sky-950">
                  <span className="font-bold">A5 Half-Page Cash Counter Slip:</span> This slip is pre-calibrated to fit half-page thermal or laser receipts with big amount callouts and ledger audit.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive WYSIWYG True-Print Preview */}
        <div className="xl:col-span-7 sticky top-6 space-y-3">
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name="LuEye" size={15} className="text-sky-400" />
              <span>Live True-Print Preview (1:1 Output)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.max(50, z - 10))}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[11px] font-mono text-sky-300 min-w-10 text-center">{previewZoom}%</span>
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.min(200, z + 10))}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(100)}
                className={`px-1.5 py-0.5 text-[10px] rounded ${
                  previewZoom === 100 ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                100%
              </button>
            </div>
          </div>

          <div className="bg-slate-200/90 p-4 rounded-2xl border border-slate-300 shadow-inner overflow-auto max-h-[82vh] flex justify-center">
            <div
              style={{
                width: isReceipt ? "148mm" : "210mm",
                minHeight: isReceipt ? "210mm" : "297mm",
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.12s ease",
              }}
              className="bg-white shadow-2xl rounded-sm p-3 text-slate-900 border border-slate-300 relative select-none"
            >
              <iframe
                ref={iframeRef}
                title={`${slipMeta.label} Live Print Preview`}
                srcDoc={previewHtml}
                className="w-full border-none pointer-events-auto"
                style={{
                  height: isReceipt ? "200mm" : "285mm",
                  background: "#ffffff",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
