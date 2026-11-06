import React, { useEffect, useMemo, useState } from "react";
import Icon from "../../components/common/Icon.jsx";
import settingsService from "../../api/services/settingsService.js";
import {
  DEFAULT_IPD_BILLING_SETTINGS,
  IPD_BILLING_SETTINGS_KEY,
  SAMPLE_IPD_BILLING_DATA,
  PRESETS,
  COLOR_PALETTES,
  cloneIPDBillingSettings,
  mergeIPDBillingSettings,
} from "./ipdBillingPrintConfig.js";
import { IPDBillingPrintHandler, buildBillingHTML } from "./IPDBillingPrintHandler.js";
import {
  loadSharedPrintSettings,
  saveSharedPrintSettings,
  getCachedSharedSettings,
} from "./sharedPrintConfig.js";

const GROUPS = [
  { key: "hospital", title: "Hospital & Letterhead", icon: "LuBuilding2" },
  { key: "header", title: "Document Header & Copy", icon: "LuHeading" },
  { key: "gst", title: "GST & Taxation Controls", icon: "LuPercent" },
  { key: "patient", title: "Patient Demographics", icon: "LuUserRound" },
  { key: "admission", title: "Admission & Encounter", icon: "LuClipboardList" },
  { key: "charges", title: "Itemized Charges & HSN", icon: "LuFileSpreadsheet" },
  { key: "settlement", title: "Settlement & Ledger", icon: "LuIndianRupee" },
  { key: "bank", title: "Bank & UPI QR Payment", icon: "LuQrCode" },
  { key: "signatures", title: "Signatures & Declaration", icon: "LuFileSignature" },
  { key: "terms", title: "Terms & Conditions", icon: "LuAlignLeft" },
  { key: "page", title: "Page & Styling", icon: "LuPalette" },
];

function getPath(obj, path) {
  return path.split(".").reduce((curr, k) => curr?.[k], obj);
}

function setPath(obj, path, val) {
  const keys = path.split(".");
  const res = { ...obj };
  let target = res;
  let src = obj;
  keys.forEach((k, idx) => {
    if (idx === keys.length - 1) {
      target[k] = val;
    } else {
      target[k] = { ...(src?.[k] || {}) };
      target = target[k];
      src = src?.[k];
    }
  });
  return res;
}

function FieldRow({ path, field, onUpdate }) {
  if (!field) return null;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(130px,210px)_66px] items-center gap-2 border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs font-medium text-slate-700 truncate">{field.label}</span>
      <input
        type="text"
        aria-label={`${field.label} print label`}
        value={field.label}
        onChange={(e) => onUpdate(`${path}.label`, e.target.value)}
        className="min-w-0 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-sky-600 focus:outline-none"
      />
      <label className="flex items-center justify-end gap-1.5 text-[11px] text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          checked={field.show !== false}
          onChange={(e) => onUpdate(`${path}.show`, e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
        />
        <span>Print</span>
      </label>
    </div>
  );
}

function SectionToggle({ enabled, onChange, title }) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
      <input
        type="checkbox"
        checked={enabled !== false}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
      />
      <span>Enable {title || "Section"}</span>
    </label>
  );
}

export default function IPDBillingPrintSettings() {
  const [settings, setSettings] = useState(DEFAULT_IPD_BILLING_SETTINGS);
  const [activeGroup, setActiveGroup] = useState("hospital");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);

  // Load saved settings from database
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [billData, sharedData] = await Promise.all([
          settingsService.getSetting(IPD_BILLING_SETTINGS_KEY).catch(() => null),
          loadSharedPrintSettings().catch(() => null),
        ]);
        const cached = getCachedSharedSettings() || {};
        const masterShared = sharedData || cached;
        if (mounted) {
          const merged = mergeIPDBillingSettings(DEFAULT_IPD_BILLING_SETTINGS, {
            ...(billData || {}),
            useSharedHeaderFooter: true,
            hospital: { ...(billData?.hospital || {}), ...(masterShared?.hospital || {}) },
            header: { ...(billData?.header || {}), ...(masterShared?.header || {}) },
            footer: { ...(billData?.footer || {}), ...(masterShared?.footer || {}) },
            fieldStyles: { ...(billData?.fieldStyles || {}), ...(masterShared?.fieldStyles || {}) },
            slipConfigs: { ...(billData?.slipConfigs || {}), ...(masterShared?.slipConfigs || {}) },
          });
          setSettings(merged);
        }
      } catch (err) {
        console.warn("Could not fetch IPD billing settings:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdate = (path, val) => {
    setSettings((prev) => setPath(prev, path, val));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatus(null);
      await settingsService.updateSetting(IPD_BILLING_SETTINGS_KEY, settings);
      await IPDBillingPrintHandler.loadDbSettings(true);
      setStatus({
        type: "success",
        message: "IPD Billing Slip settings saved successfully! All counters and billing desks will now use this configuration.",
      });
      setTimeout(() => setStatus(null), 5000);
    } catch (err) {
      console.error("Save error:", err);
      setStatus({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset all IPD billing customizations back to factory defaults?")) {
      setSettings(cloneIPDBillingSettings(DEFAULT_IPD_BILLING_SETTINGS));
    }
  };

  const handleApplyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    if (window.confirm(`Apply preset "${preset.name}"?`)) {
      setSettings((prev) => preset.apply(prev));
    }
  };

  const handleApplyPalette = (paletteKey) => {
    const pal = COLOR_PALETTES[paletteKey];
    if (!pal) return;
    setSettings((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        theme: paletteKey,
        primary: pal.primary,
        accent: pal.accent,
        text: pal.text,
        muted: pal.muted,
        border: pal.border,
        headerBg: pal.headerBg,
      },
    }));
  };

  const handleTestPrint = () => {
    IPDBillingPrintHandler.printBillingSlip(SAMPLE_IPD_BILLING_DATA, settings);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        setUploadingLogo(true);
        const res = await settingsService.uploadLogo(base64);
        if (res?.configured && res?.url) {
          handleUpdate("hospital.logoUrl", res.url);
          alert("Logo uploaded to Cloudinary successfully!");
        } else {
          handleUpdate("hospital.logoUrl", base64);
          alert("Logo loaded for preview (Cloudinary not configured).");
        }
      } catch (err) {
        console.warn("Upload error, using local base64:", err);
        handleUpdate("hospital.logoUrl", base64);
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Terms helpers
  const handleAddTerm = () => {
    const current = settings.terms?.items || [];
    handleUpdate("terms.items", [...current, "New invoice condition or compliance note."]);
  };

  const handleRemoveTerm = (index) => {
    const current = [...(settings.terms?.items || [])];
    current.splice(index, 1);
    handleUpdate("terms.items", current);
  };

  const handleTermChange = (index, val) => {
    const current = [...(settings.terms?.items || [])];
    current[index] = val;
    handleUpdate("terms.items", current);
  };

  // Accreditation badges helpers
  const handleAddAccreditation = () => {
    const current = settings.hospital?.accreditations || [];
    handleUpdate("hospital.accreditations", [...current, "NABH ACCREDITED"]);
  };

  const handleRemoveAccreditation = (index) => {
    const current = [...(settings.hospital?.accreditations || [])];
    current.splice(index, 1);
    handleUpdate("hospital.accreditations", current);
  };

  const handleAccreditationChange = (index, val) => {
    const current = [...(settings.hospital?.accreditations || [])];
    current[index] = val;
    handleUpdate("hospital.accreditations", current);
  };

  // Sync Header & Footer from Shared Master
  const handleSyncFromSharedMaster = async () => {
    try {
      const shared = await loadSharedPrintSettings();
      if (shared) {
        setSettings((prev) => ({
          ...prev,
          useSharedHeaderFooter: true,
          hospital: {
            ...(prev.hospital || {}),
            ...(shared.hospital || {}),
          },
          header: {
            ...(prev.header || {}),
            ...(shared.header || {}),
          },
          fieldStyles: {
            ...(prev.fieldStyles || {}),
            ...(shared.fieldStyles || {}),
          },
          slipConfigs: {
            ...(prev.slipConfigs || {}),
            ...(shared.slipConfigs || {}),
          },
          terms: {
            ...(prev.terms || {}),
            items: shared.footer?.termsItems || prev.terms?.items,
            footerTagline: shared.footer?.tagline || prev.terms?.footerTagline,
            disclaimer: shared.footer?.disclaimer || prev.terms?.disclaimer,
          },
        }));
        setStatus({
          type: "success",
          message: "Synced Hospital Header & Footer from Shared Master successfully!",
        });
        setTimeout(() => setStatus(null), 4000);
      }
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  // Push Header & Footer to Shared Master
  const handlePushToSharedMaster = async () => {
    if (
      window.confirm(
        "Push this billing slip's letterhead and footer settings to the Master Shared Header & Footer?"
      )
    ) {
      try {
        const shared = await loadSharedPrintSettings();
        const updated = {
          ...shared,
          hospital: { ...(shared.hospital || {}), ...(settings.hospital || {}) },
          footer: {
            ...(shared.footer || {}),
            termsItems: settings.terms?.items || shared.footer?.termsItems,
            tagline: settings.terms?.footerTagline || shared.footer?.tagline,
            disclaimer: settings.terms?.disclaimer || shared.footer?.disclaimer,
          },
        };
        await saveSharedPrintSettings(updated);
        setStatus({
          type: "success",
          message: "Pushed to Shared Master successfully! All slips using master are now updated.",
        });
        setTimeout(() => setStatus(null), 4000);
      } catch (e) {
        console.error("Push error:", e);
      }
    }
  };

  // Live HTML generation for preview
  const previewHtml = useMemo(() => {
    return buildBillingHTML(SAMPLE_IPD_BILLING_DATA, settings, false);
  }, [settings]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-3">
        <Icon name="LuLoader" size={24} className="animate-spin text-sky-700" />
        <span>Loading IPD Billing Slip customization designer...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner & Presets Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon name="LuReceipt" size={20} className="text-sky-700" />
            <span>IPD Billing Slip &amp; Inpatient Tax Invoice Customizer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete control over Hospital Letterhead, GST Breakdown, Department Groupings, HSN/SAC, Status Stamps, UPI QR, and Signatures.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Presets dropdown / pills */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 px-1.5 uppercase">Presets:</span>
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleApplyPreset(key)}
                className="px-2.5 py-1 font-semibold rounded bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-800 shadow-xs transition-colors"
                title={p.description}
              >
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            title="Reset to factory defaults"
          >
            <Icon name="LuRotateCcw" size={14} /> Reset
          </button>
          <button
            type="button"
            onClick={handleTestPrint}
            className="px-3.5 py-2 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-300 rounded-lg hover:bg-sky-100 flex items-center gap-1.5"
            title="Print test invoice with sample patient data"
          >
            <Icon name="LuPrinter" size={15} /> Test Print
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-900 rounded-lg hover:bg-sky-950 shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            <Icon name={saving ? "LuLoader" : "LuSave"} size={15} className={saving ? "animate-spin" : ""} />
            <span>{saving ? "Saving..." : "Save Configuration"}</span>
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {status && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
            status.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name={status.type === "success" ? "LuCheckCircle2" : "LuAlertTriangle"} size={16} />
            <span>{status.message}</span>
          </div>
          <button type="button" onClick={() => setStatus(null)} className="text-slate-400 hover:text-slate-600">
            <Icon name="LuX" size={14} />
          </button>
        </div>
      )}

      {/* Shared Master Status & Sync Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/90 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-sky-950 font-bold">
          <Icon name="LuLayers" size={16} className="text-sky-700" />
          <span>Shared Master Header &amp; Footer:</span>
          <label className="flex items-center gap-1.5 cursor-pointer ml-1 text-slate-700">
            <input
              type="checkbox"
              checked={settings.useSharedHeaderFooter !== false}
              onChange={(e) => handleUpdate("useSharedHeaderFooter", e.target.checked)}
              className="rounded text-sky-700"
            />
            <span className="font-semibold">Linked to Shared Master</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncFromSharedMaster}
            className="px-2.5 py-1 text-xs font-bold bg-white text-sky-800 border border-sky-300 rounded-lg hover:bg-sky-100 flex items-center gap-1 shadow-xs"
            title="Import latest Header and Footer from Shared Master"
          >
            <Icon name="LuDownload" size={13} /> Sync from Master
          </button>
          <button
            type="button"
            onClick={handlePushToSharedMaster}
            className="px-2.5 py-1 text-xs font-bold bg-white text-indigo-800 border border-indigo-300 rounded-lg hover:bg-indigo-100 flex items-center gap-1 shadow-xs"
            title="Save this billing slip's header & footer as the new Shared Master"
          >
            <Icon name="LuUpload" size={13} /> Push to Master
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Controls on Left (5 cols), Live Preview on Right (7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Visual Settings Panels */}
        <div className="xl:col-span-5 space-y-4">
          {/* Navigation Tabs for Groups */}
          <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex flex-wrap gap-1.5">
            {GROUPS.map((g) => {
              const isActive = activeGroup === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setActiveGroup(g.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-sky-800 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <Icon name={g.icon} size={14} />
                  <span>{g.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Settings Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            {/* 1. Hospital & Letterhead */}
            {activeGroup === "hospital" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuBuilding2" size={17} className="text-sky-700" />
                    Hospital Identity &amp; Header
                  </h3>
                </div>

                {/* Letterhead Mode Selector */}
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 space-y-2">
                  <label className="block text-xs font-bold text-sky-900">Hospital Letterhead Print Mode</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-sky-300 cursor-pointer">
                      <input
                        type="radio"
                        name="letterheadMode"
                        checked={settings.hospital.letterheadMode !== "stationery"}
                        onChange={() => handleUpdate("hospital.letterheadMode", "full")}
                        className="text-sky-700"
                      />
                      <div>
                        <div className="font-bold text-slate-800">Print Full Letterhead</div>
                        <div className="text-[10px] text-slate-500">Prints hospital name, logo &amp; address</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-sky-300 cursor-pointer">
                      <input
                        type="radio"
                        name="letterheadMode"
                        checked={settings.hospital.letterheadMode === "stationery"}
                        onChange={() => handleUpdate("hospital.letterheadMode", "stationery")}
                        className="text-sky-700"
                      />
                      <div>
                        <div className="font-bold text-slate-800">Pre-printed Paper</div>
                        <div className="text-[10px] text-slate-500">Leaves blank margin for physical pads</div>
                      </div>
                    </label>
                  </div>
                  {settings.hospital.letterheadMode === "stationery" && (
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">Top Blank Margin (mm):</span>
                      <input
                        type="number"
                        min="20"
                        max="80"
                        value={settings.hospital.stationeryTopMargin || 45}
                        onChange={(e) => handleUpdate("hospital.stationeryTopMargin", Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-sky-300 rounded text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name</label>
                  <input
                    type="text"
                    value={settings.hospital.name || ""}
                    onChange={(e) => handleUpdate("hospital.name", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={settings.hospital.subtitle || ""}
                    onChange={(e) => handleUpdate("hospital.subtitle", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Registration No</label>
                    <input
                      type="text"
                      value={settings.hospital.registrationNo || ""}
                      onChange={(e) => handleUpdate("hospital.registrationNo", e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Helpline / Phone</label>
                    <input
                      type="text"
                      value={settings.hospital.phone || ""}
                      onChange={(e) => handleUpdate("hospital.phone", e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Address</label>
                  <input
                    type="text"
                    value={settings.hospital.address || ""}
                    onChange={(e) => handleUpdate("hospital.address", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="text"
                      value={settings.hospital.email || ""}
                      onChange={(e) => handleUpdate("hospital.email", e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
                    <input
                      type="text"
                      value={settings.hospital.website || ""}
                      onChange={(e) => handleUpdate("hospital.website", e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Logo & Position */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Hospital Logo</span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={settings.header.showLogo !== false}
                        onChange={(e) => handleUpdate("header.showLogo", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-700"
                      />
                      <span>Show Logo</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={settings.hospital.logoUrl || ""}
                      onChange={(e) => handleUpdate("hospital.logoUrl", e.target.value)}
                      placeholder="/images/Narayan_Logo.png or URL"
                      className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                    />
                    <label className="px-3 py-2 text-xs font-semibold bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer flex items-center gap-1">
                      <Icon name="LuUpload" size={13} />
                      <span>{uploadingLogo ? "Uploading..." : "Upload"}</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Accreditation Badges */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Quality Accreditations &amp; Certifications</span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.hospital.showAccreditationBadges !== false}
                        onChange={(e) => handleUpdate("hospital.showAccreditationBadges", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-700"
                      />
                      <span>Show Badges on Letterhead</span>
                    </label>
                  </div>
                  {settings.hospital.showAccreditationBadges !== false && (
                    <div className="space-y-1.5 pt-1">
                      {(settings.hospital.accreditations || []).map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-1 rounded border border-sky-200">
                            ✓
                          </span>
                          <input
                            type="text"
                            value={badge}
                            onChange={(e) => handleAccreditationChange(idx, e.target.value)}
                            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-sky-500 font-semibold"
                            placeholder="e.g. NABH ACCREDITED"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAccreditation(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                            title="Remove badge"
                          >
                            <Icon name="LuTrash2" size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddAccreditation}
                        className="mt-1 text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                      >
                        <Icon name="LuPlus" size={13} />
                        <span>Add Quality Accreditation</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Document Header & Copy */}
            {activeGroup === "header" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuHeading" size={17} className="text-sky-700" />
                    Document Banner &amp; Copy Type
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Document Title</label>
                  <input
                    type="text"
                    value={settings.header.title || ""}
                    onChange={(e) => handleUpdate("header.title", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Subtitle / Legal Citation</label>
                  <input
                    type="text"
                    value={settings.header.subTitle || ""}
                    onChange={(e) => handleUpdate("header.subTitle", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Copy Type Badge */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Document Copy Classification</label>
                    <select
                      value={settings.header.copyType || "ORIGINAL FOR RECIPIENT"}
                      onChange={(e) => handleUpdate("header.copyType", e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="ORIGINAL FOR RECIPIENT">ORIGINAL FOR RECIPIENT</option>
                      <option value="DUPLICATE FOR HOSPITAL">DUPLICATE FOR HOSPITAL</option>
                      <option value="TRIPLICATE FOR TPA / INSURANCE">TRIPLICATE FOR TPA / INSURANCE</option>
                      <option value="PATIENT RECORD COPY">PATIENT RECORD COPY</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.header.showCopyBadge !== false}
                        onChange={(e) => handleUpdate("header.showCopyBadge", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-700"
                      />
                      <span>Show Copy Type Pill</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={settings.header.showQRCode !== false}
                      onChange={(e) => handleUpdate("header.showQRCode", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Verified Invoice QR Code (top header)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.header.showTaxBox !== false}
                      onChange={(e) => handleUpdate("header.showTaxBox", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Tax Invoice &amp; GST Credentials Box</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.header.showBarcode !== false}
                      onChange={(e) => handleUpdate("header.showBarcode", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Vector Barcode for Invoice No.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.header.showTopUHID !== false}
                      onChange={(e) => handleUpdate("header.showTopUHID", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show UHID in Top Document Banner</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.header.showTopAdmissionNo !== false}
                      onChange={(e) => handleUpdate("header.showTopAdmissionNo", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Admission No. in Top Document Banner</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.page.showGeneratedAt !== false}
                      onChange={(e) => handleUpdate("page.showGeneratedAt", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Print Generation Timestamp</span>
                  </label>
                </div>
              </div>
            )}

            {/* 3. GST & Taxation Controls */}
            {activeGroup === "gst" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuPercent" size={17} className="text-sky-700" />
                    GST &amp; Taxation Configuration
                  </h3>
                  <SectionToggle
                    enabled={settings.gst.enabled}
                    onChange={(val) => handleUpdate("gst.enabled", val)}
                    title="GST System"
                  />
                </div>

                {/* GST Mode Choice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <label className="block text-xs font-bold text-amber-900">Hospital GST Treatment Mode</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-start gap-2 p-2 bg-white rounded border border-amber-300 cursor-pointer">
                      <input
                        type="radio"
                        name="gstMode"
                        checked={settings.gst.mode === "exempt"}
                        onChange={() => {
                          handleUpdate("gst.mode", "exempt");
                          handleUpdate("gst.taxRate", 0);
                        }}
                        className="text-amber-700 mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-800">Healthcare Exempt (0% GST)</div>
                        <div className="text-[10px] text-slate-500">Exempt under Notification 12/2017-CT(Rate) Sl. 74</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 bg-white rounded border border-amber-300 cursor-pointer">
                      <input
                        type="radio"
                        name="gstMode"
                        checked={settings.gst.mode === "taxable"}
                        onChange={() => {
                          handleUpdate("gst.mode", "taxable");
                          handleUpdate("gst.taxRate", 5);
                        }}
                        className="text-amber-700 mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-800">Taxable Supply (CGST+SGST/IGST)</div>
                        <div className="text-[10px] text-slate-500">For room rent &gt; ₹5,000/day or pharmacy supplies</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Tax Rates if Taxable */}
                {settings.gst.mode === "taxable" && (
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Standard Tax Rate (%)</label>
                      <select
                        value={settings.gst.taxRate || 5}
                        onChange={(e) => handleUpdate("gst.taxRate", Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-bold"
                      >
                        <option value="5">5% (2.5% CGST + 2.5% SGST)</option>
                        <option value="12">12% (6% CGST + 6% SGST)</option>
                        <option value="18">18% (9% CGST + 9% SGST)</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.gst.isInterState === true}
                          onChange={(e) => handleUpdate("gst.isInterState", e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-700"
                        />
                        <span>Inter-State Supply (Apply IGST)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Detailed GST Table Toggle */}
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.gst.showTaxTable !== false}
                    onChange={(e) => handleUpdate("gst.showTaxTable", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-700"
                  />
                  <span>Show Formal HSN/SAC GST Breakdown Table on Invoice</span>
                </label>

                {/* GST Registration Details */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="block text-xs font-bold text-slate-700 mb-2">Statutory GST Identifiers</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Hospital GSTIN *</label>
                      <input
                        type="text"
                        value={settings.gst.hospitalGstin || ""}
                        onChange={(e) => handleUpdate("gst.hospitalGstin", e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Hospital PAN *</label>
                      <input
                        type="text"
                        value={settings.gst.hospitalPan || ""}
                        onChange={(e) => handleUpdate("gst.hospitalPan", e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">State Name &amp; Code</label>
                      <input
                        type="text"
                        value={settings.gst.stateName || ""}
                        onChange={(e) => handleUpdate("gst.stateName", e.target.value)}
                        placeholder="Rajasthan"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">State Code Number</label>
                      <input
                        type="text"
                        value={settings.gst.stateCode || ""}
                        onChange={(e) => handleUpdate("gst.stateCode", e.target.value)}
                        placeholder="08"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Reverse Charge Mechanism (RCM)</label>
                      <select
                        value={settings.gst.reverseCharge || "No"}
                        onChange={(e) => handleUpdate("gst.reverseCharge", e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Place of Supply</label>
                      <input
                        type="text"
                        value={settings.gst.placeOfSupply || ""}
                        onChange={(e) => handleUpdate("gst.placeOfSupply", e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Exemption Notification Text */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Exemption Legal Citation Note</label>
                  <textarea
                    rows={2}
                    value={settings.gst.exemptionNotification || ""}
                    onChange={(e) => handleUpdate("gst.exemptionNotification", e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg text-slate-600"
                  />
                </div>
              </div>
            )}

            {/* 4. Patient Demographics */}
            {activeGroup === "patient" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuUserRound" size={17} className="text-sky-700" />
                    Patient Demographics &amp; TPA
                  </h3>
                  <SectionToggle
                    enabled={settings.patient.enabled}
                    onChange={(val) => handleUpdate("patient.enabled", val)}
                    title="Demographics Card"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section Card Title</label>
                  <input
                    type="text"
                    value={settings.patient.title || ""}
                    onChange={(e) => handleUpdate("patient.title", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(130px,210px)_66px] gap-2 pb-1 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                    <span>Field Key</span>
                    <span>Print Label</span>
                    <span className="text-right">Visible</span>
                  </div>
                  {Object.entries(settings.patient.fields || {}).map(([key, f]) => (
                    <FieldRow
                      key={key}
                      path={`patient.fields.${key}`}
                      field={f}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 5. Admission Details */}
            {activeGroup === "admission" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuClipboardList" size={17} className="text-sky-700" />
                    Admission &amp; Visit Details
                  </h3>
                  <SectionToggle
                    enabled={settings.admission.enabled}
                    onChange={(val) => handleUpdate("admission.enabled", val)}
                    title="Admission Card"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section Card Title</label>
                  <input
                    type="text"
                    value={settings.admission.title || ""}
                    onChange={(e) => handleUpdate("admission.title", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(130px,210px)_66px] gap-2 pb-1 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                    <span>Field Key</span>
                    <span>Print Label</span>
                    <span className="text-right">Visible</span>
                  </div>
                  {Object.entries(settings.admission.fields || {}).map(([key, f]) => (
                    <FieldRow
                      key={key}
                      path={`admission.fields.${key}`}
                      field={f}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 6. Itemized Charges Table */}
            {activeGroup === "charges" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuFileSpreadsheet" size={17} className="text-sky-700" />
                    Itemized Charges Table &amp; HSN/SAC
                  </h3>
                  <SectionToggle
                    enabled={settings.charges.enabled}
                    onChange={(val) => handleUpdate("charges.enabled", val)}
                    title="Charges Table"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Table Title</label>
                  <input
                    type="text"
                    value={settings.charges.title || ""}
                    onChange={(e) => handleUpdate("charges.title", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Grouping & Department Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.charges.groupByDepartment === true}
                      onChange={(e) => handleUpdate("charges.groupByDepartment", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Group by Department / Category</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.charges.showDepartmentTotals !== false}
                      onChange={(e) => handleUpdate("charges.showDepartmentTotals", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Subtotal per Department</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.charges.showDepartmentSummary !== false}
                      onChange={(e) => handleUpdate("charges.showDepartmentSummary", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Department Badges Pill Row</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.charges.showDiscountsBreakdown !== false}
                      onChange={(e) => handleUpdate("charges.showDiscountsBreakdown", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Concession Tags with Authorizer</span>
                  </label>
                </div>

                {/* Columns Table */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="block text-xs font-bold text-slate-700 mb-2">Column Headers &amp; Visibility</span>
                  <div className="space-y-1">
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(130px,210px)_66px] gap-2 pb-1 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                      <span>Column</span>
                      <span>Header Title</span>
                      <span className="text-right">Visible</span>
                    </div>
                    {Object.entries(settings.charges.columns || {}).map(([key, col]) => (
                      <div key={key} className="grid grid-cols-[minmax(0,1fr)_minmax(130px,210px)_66px] items-center gap-2 border-b border-slate-100 py-1.5 last:border-0">
                        <span className="text-xs font-medium text-slate-700 uppercase">{key}</span>
                        <input
                          type="text"
                          value={col.label}
                          onChange={(e) => handleUpdate(`charges.columns.${key}.label`, e.target.value)}
                          className="min-w-0 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                        />
                        <label className="flex items-center justify-end gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={col.show !== false}
                            onChange={(e) => handleUpdate(`charges.columns.${key}.show`, e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-sky-700"
                          />
                          <span>Show</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. Settlement & Ledger */}
            {activeGroup === "settlement" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuIndianRupee" size={17} className="text-sky-700" />
                    Settlement Reconciliation &amp; Rubber Seals
                  </h3>
                  <SectionToggle
                    enabled={settings.settlement.enabled}
                    onChange={(val) => handleUpdate("settlement.enabled", val)}
                    title="Settlement Card"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.settlement.showAmountInWords !== false}
                      onChange={(e) => handleUpdate("settlement.showAmountInWords", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Print Invoiced Amount in Words (Indian numbering: Lakhs/Crores)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.settlement.showPaymentBreakdown !== false}
                      onChange={(e) => handleUpdate("settlement.showPaymentBreakdown", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Deposit &amp; Interim Payment Audit Breakdown</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.settlement.showPaymentReceiptsTable !== false}
                      onChange={(e) => handleUpdate("settlement.showPaymentReceiptsTable", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Print Full Payment Receipts History Table</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.page.roundOffToRupee !== false}
                      onChange={(e) => handleUpdate("page.roundOffToRupee", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Auto Round-Off Total Bill to Nearest Integer Rupee</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.settlement.showOfficialStamp !== false}
                      onChange={(e) => handleUpdate("settlement.showOfficialStamp", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Official Hospital Clearance Rubber Stamp Seal</span>
                  </label>
                </div>

                {/* Stamp Text Customization */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="block text-xs font-bold text-slate-700">Custom Stamp Texts</span>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Paid In Full Clearance Seal</label>
                      <input
                        type="text"
                        value={settings.settlement.stampTextPaid || ""}
                        onChange={(e) => handleUpdate("settlement.stampTextPaid", e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-bold text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Balance Outstanding Seal</label>
                      <input
                        type="text"
                        value={settings.settlement.stampTextDue || ""}
                        onChange={(e) => handleUpdate("settlement.stampTextDue", e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-bold text-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Excess Advance Credit Seal</label>
                      <input
                        type="text"
                        value={settings.settlement.stampTextExcess || ""}
                        onChange={(e) => handleUpdate("settlement.stampTextExcess", e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded font-bold text-blue-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Bank & UPI QR Payment */}
            {activeGroup === "bank" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuQrCode" size={17} className="text-sky-700" />
                    Bank Details &amp; Dynamic UPI QR
                  </h3>
                  <SectionToggle
                    enabled={settings.bankDetails.show}
                    onChange={(val) => handleUpdate("bankDetails.show", val)}
                    title="Bank & UPI Section"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Beneficiary Bank Name</label>
                    <input
                      type="text"
                      value={settings.bankDetails.bankName || ""}
                      onChange={(e) => handleUpdate("bankDetails.bankName", e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={settings.bankDetails.accountName || ""}
                      onChange={(e) => handleUpdate("bankDetails.accountName", e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={settings.bankDetails.accountNo || ""}
                      onChange={(e) => handleUpdate("bankDetails.accountNo", e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={settings.bankDetails.ifsc || ""}
                      onChange={(e) => handleUpdate("bankDetails.ifsc", e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                    <input
                      type="text"
                      value={settings.bankDetails.branch || ""}
                      onChange={(e) => handleUpdate("bankDetails.branch", e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">UPI VPA (Virtual Payment Address)</label>
                    <input
                      type="text"
                      value={settings.bankDetails.upiId || ""}
                      onChange={(e) => handleUpdate("bankDetails.upiId", e.target.value)}
                      placeholder="narayan.hospital@sbi"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.bankDetails.showUpiQr !== false}
                      onChange={(e) => handleUpdate("bankDetails.showUpiQr", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Print Dynamic UPI QR Code on Invoice (allows scanning with GPay/PhonePe to pay pending dues)</span>
                  </label>
                </div>
              </div>
            )}

            {/* 9. Signatures & Declaration */}
            {activeGroup === "signatures" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuFileSignature" size={17} className="text-sky-700" />
                    Signatures &amp; Legal Patient Declaration
                  </h3>
                  <SectionToggle
                    enabled={settings.signatures.enabled}
                    onChange={(val) => handleUpdate("signatures.enabled", val)}
                    title="Signatures"
                  />
                </div>

                <div className="space-y-3 text-xs">
                  {/* Cashier */}
                  <div className="border border-slate-200 rounded-lg p-2.5 space-y-2">
                    <label className="flex items-center justify-between font-bold text-slate-700 cursor-pointer">
                      <span>1. Billing Cashier Signature</span>
                      <input
                        type="checkbox"
                        checked={settings.signatures.showCashier !== false}
                        onChange={(e) => handleUpdate("signatures.showCashier", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-700"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={settings.signatures.cashierTitle || ""}
                        onChange={(e) => handleUpdate("signatures.cashierTitle", e.target.value)}
                        placeholder="Title (e.g. Billing Cashier)"
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={settings.signatures.cashierSub || ""}
                        onChange={(e) => handleUpdate("signatures.cashierSub", e.target.value)}
                        placeholder="Subtitle (e.g. Counter 1)"
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Accounts */}
                  <div className="border border-slate-200 rounded-lg p-2.5 space-y-2">
                    <label className="flex items-center justify-between font-bold text-slate-700 cursor-pointer">
                      <span>2. Accounts Officer Signature</span>
                      <input
                        type="checkbox"
                        checked={settings.signatures.showAccounts !== false}
                        onChange={(e) => handleUpdate("signatures.showAccounts", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-700"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={settings.signatures.accountsTitle || ""}
                        onChange={(e) => handleUpdate("signatures.accountsTitle", e.target.value)}
                        placeholder="Title (e.g. Accounts Officer)"
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={settings.signatures.accountsSub || ""}
                        onChange={(e) => handleUpdate("signatures.accountsSub", e.target.value)}
                        placeholder="Subtitle (e.g. Internal Audit)"
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Doctor */}
                  <div className="border border-slate-200 rounded-lg p-2.5 space-y-2">
                    <label className="flex items-center justify-between font-bold text-slate-700 cursor-pointer">
                      <span>3. Treating Consultant Signature</span>
                      <input
                        type="checkbox"
                        checked={settings.signatures.showDoctor === true}
                        onChange={(e) => handleUpdate("signatures.showDoctor", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-700"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={settings.signatures.doctorTitle || ""}
                        onChange={(e) => handleUpdate("signatures.doctorTitle", e.target.value)}
                        placeholder="Title (e.g. Treating Consultant)"
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={settings.signatures.doctorSub || ""}
                        onChange={(e) => handleUpdate("signatures.doctorSub", e.target.value)}
                        placeholder="Subtitle (e.g. Clinical Verification)"
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Patient / Attendant */}
                  <div className="border border-slate-200 rounded-lg p-2.5 space-y-2">
                    <label className="flex items-center justify-between font-bold text-slate-700 cursor-pointer">
                      <span>4. Patient / Attendant Acceptance Signature</span>
                      <input
                        type="checkbox"
                        checked={settings.signatures.showPatient !== false}
                        onChange={(e) => handleUpdate("signatures.showPatient", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-700"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={settings.signatures.patientTitle || ""}
                        onChange={(e) => handleUpdate("signatures.patientTitle", e.target.value)}
                        placeholder="Title (e.g. Patient / Attendant)"
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={settings.signatures.patientSub || ""}
                        onChange={(e) => handleUpdate("signatures.patientSub", e.target.value)}
                        placeholder="Subtitle (e.g. Verification)"
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Medical Superintendent */}
                  <div className="border border-slate-200 rounded-lg p-2.5 space-y-2">
                    <label className="flex items-center justify-between font-bold text-slate-700 cursor-pointer">
                      <span>5. Medical Superintendent Signature</span>
                      <input
                        type="checkbox"
                        checked={settings.signatures.showSuperintendent !== false}
                        onChange={(e) => handleUpdate("signatures.showSuperintendent", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-700"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={settings.signatures.superintendentTitle || ""}
                        onChange={(e) => handleUpdate("signatures.superintendentTitle", e.target.value)}
                        placeholder="Title (e.g. Medical Superintendent)"
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={settings.signatures.superintendentSub || ""}
                        onChange={(e) => handleUpdate("signatures.superintendentSub", e.target.value)}
                        placeholder="Subtitle (e.g. Authorized Signatory)"
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Patient Declaration text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Printed Patient Legal Declaration Text</label>
                    <textarea
                      rows={2}
                      value={settings.signatures.patientDeclaration || ""}
                      onChange={(e) => handleUpdate("signatures.patientDeclaration", e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 10. Terms & Conditions */}
            {activeGroup === "terms" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuAlignLeft" size={17} className="text-sky-700" />
                    Terms, Disclaimers &amp; Footer Notes
                  </h3>
                  <SectionToggle
                    enabled={settings.terms.enabled}
                    onChange={(val) => handleUpdate("terms.enabled", val)}
                    title="Terms Section"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Invoice Terms &amp; Conditions</span>
                    <button
                      type="button"
                      onClick={handleAddTerm}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                    >
                      <Icon name="LuPlus" size={13} /> Add Term
                    </button>
                  </div>
                  {(settings.terms?.items || []).map((term, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs text-slate-400 mt-2 font-mono">#{idx + 1}</span>
                      <textarea
                        rows={2}
                        value={term}
                        onChange={(e) => handleTermChange(idx, e.target.value)}
                        className="flex-1 text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTerm(idx)}
                        className="text-slate-400 hover:text-red-600 mt-2 p-1"
                        title="Delete term"
                      >
                        <Icon name="LuTrash2" size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Footer Tagline &amp; Emergency Helpline</label>
                  <input
                    type="text"
                    value={settings.terms.footerTagline || ""}
                    onChange={(e) => handleUpdate("terms.footerTagline", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Closing Greeting / Disclaimer</label>
                  <input
                    type="text"
                    value={settings.terms.disclaimer || ""}
                    onChange={(e) => handleUpdate("terms.disclaimer", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* 11. Page & Styling */}
            {activeGroup === "page" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="LuPalette" size={17} className="text-sky-700" />
                    Page Geometry &amp; Color Palettes
                  </h3>
                </div>

                {/* Color Palettes quick chooser */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Executive Color Palettes</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(COLOR_PALETTES).map(([key, pal]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleApplyPalette(key)}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between ${
                          settings.style.theme === key
                            ? "border-sky-600 bg-sky-50/50 ring-1 ring-sky-500"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-semibold text-slate-800">{pal.name.split(" ")[0]}</span>
                        <div className="flex gap-1">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ background: pal.primary }} />
                          <span className="w-3.5 h-3.5 rounded-full" style={{ background: pal.accent }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Paper Size</label>
                    <select
                      value={settings.page.size || "A4"}
                      onChange={(e) => handleUpdate("page.size", e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="A4">A4 (Standard 210 × 297 mm)</option>
                      <option value="A5">A5 (Half Sheet 148 × 210 mm)</option>
                      <option value="Letter">Letter (8.5 × 11 in)</option>
                      <option value="Thermal">Thermal POS Slip (80mm Roll)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Orientation</label>
                    <select
                      value={settings.page.orientation || "portrait"}
                      onChange={(e) => handleUpdate("page.orientation", e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Page Margins (mm)</label>
                    <input
                      type="number"
                      min="2"
                      max="25"
                      value={settings.page.margin || 8}
                      onChange={(e) => handleUpdate("page.margin", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Base Font Size (px)</label>
                    <input
                      type="number"
                      min="8"
                      max="14"
                      value={settings.page.fontSize || 10}
                      onChange={(e) => handleUpdate("page.fontSize", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Custom Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.style.primary || "#0f2e5a"}
                        onChange={(e) => handleUpdate("style.primary", e.target.value)}
                        className="h-8 w-10 p-0 border border-slate-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.style.primary || "#0f2e5a"}
                        onChange={(e) => handleUpdate("style.primary", e.target.value)}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Custom Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.style.accent || "#0284c7"}
                        onChange={(e) => handleUpdate("style.accent", e.target.value)}
                        className="h-8 w-10 p-0 border border-slate-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.style.accent || "#0284c7"}
                        onChange={(e) => handleUpdate("style.accent", e.target.value)}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.page.compact === true}
                      onChange={(e) => handleUpdate("page.compact", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Compact Mode (reduces paddings to save paper &amp; fit onto single sheet)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.style.zebraStriping !== false}
                      onChange={(e) => handleUpdate("style.zebraStriping", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Zebra Striping on Itemized Rows</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.page.showWatermark === true}
                      onChange={(e) => handleUpdate("page.showWatermark", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    <span>Show Background Watermark</span>
                  </label>
                  {settings.page.showWatermark && (
                    <div className="pl-6">
                      <input
                        type="text"
                        value={settings.page.watermarkText || "TAX INVOICE"}
                        onChange={(e) => handleUpdate("page.watermarkText", e.target.value)}
                        placeholder="Watermark Text"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive WYSIWYG Preview (7 cols) */}
        <div className="xl:col-span-7 sticky top-6 space-y-2.5">
          {/* Preview Controls Bar */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-2 font-bold text-slate-800">
              <Icon name="LuEye" size={17} className="text-sky-700" />
              <span>Live Executive Slip Preview</span>
              <span className="text-[11px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-semibold">
                {settings.page.size} • {settings.gst.mode === "exempt" ? "0% GST Exempt" : `${settings.gst.taxRate}% GST`}
              </span>
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Zoom:</span>
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.max(50, z - 10))}
                className="w-6 h-6 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-[11px] font-bold flex items-center justify-center"
              >
                -
              </button>
              <span className="font-mono text-[11px] min-w-9 text-center font-bold text-sky-800">{previewZoom}%</span>
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.min(200, z + 10))}
                className="w-6 h-6 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-[11px] font-bold flex items-center justify-center"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(100)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${previewZoom === 100 ? "bg-sky-700 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(150)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${previewZoom === 150 ? "bg-sky-700 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
              >
                150%
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(200)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${previewZoom === 200 ? "bg-sky-700 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
              >
                200%
              </button>
            </div>
          </div>

          {/* Sandboxed Live HTML Iframe Preview Container */}
          <div
            className="bg-slate-300/60 p-4 rounded-2xl border border-slate-300 shadow-inner overflow-auto flex justify-center"
            style={{ minHeight: "720px", maxHeight: "88vh" }}
          >
            <div
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease",
                width: settings.page.size === "Thermal" ? "340px" : "800px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                borderRadius: "4px",
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              <iframe
                title="IPD Billing Slip Preview"
                srcDoc={previewHtml}
                style={{
                  width: "100%",
                  height: settings.page.size === "Thermal" ? "920px" : "1280px",
                  border: "none",
                  display: "block",
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
