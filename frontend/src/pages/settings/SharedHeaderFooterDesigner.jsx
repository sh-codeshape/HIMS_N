import React, { useState, useEffect, useMemo, useRef } from "react";
import Icon from "../../components/common/Icon.jsx";
import settingsService from "../../api/services/settingsService.js";
import {
  DEFAULT_SHARED_CONFIG,
  SHARED_ELEMENT_TARGETS,
  SLIP_TYPES,
  SLIP_SAMPLE_DATA,
  SAMPLE_SHARED_DATA,
  loadSharedPrintSettings,
  saveSharedPrintSettings,
  setCachedSharedSettings,
  getCachedSharedSettings,
  applySharedMasterToAllSlips,
  buildSharedPreviewHTML,
  isElementActiveOnSlip,
  toggleSlipElementActive,
  FONT_FAMILIES,
} from "./sharedPrintConfig.js";

const BRAND_PRESET_COLORS = [
  { label: "Master Navy", hex: "#0B3B60" },
  { label: "Deep Slate", hex: "#0F172A" },
  { label: "Medical Emerald", hex: "#047857" },
  { label: "Emergency Red", hex: "#B91C1C" },
  { label: "Royal Indigo", hex: "#4338CA" },
  { label: "Sky Blue", hex: "#0284C7" },
  { label: "Secondary Slate", hex: "#64748B" },
  { label: "Warm Amber", hex: "#D97706" },
];

export default function SharedHeaderFooterDesigner() {
  const [settings, setSettings] = useState(DEFAULT_SHARED_CONFIG);
  const [selectedSlipType, setSelectedSlipType] = useState("all"); // 'all' | 'opd' | 'ipd_admission' | 'ipd_billing' | 'ipd_discharge'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingAll, setApplyingAll] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type, message }
  const [selectedTargetKey, setSelectedTargetKey] = useState("header.hospitalName");
  const [activeTab, setActiveTab] = useState("data-designer"); // 'data-designer' | 'hospital' | 'footer' | 'slips'
  const [dataCategoryFilter, setDataCategoryFilter] = useState("all"); // 'all' | 'header' | 'demographics' | 'footer'
  const [searchQuery, setSearchQuery] = useState("");
  const [previewZoom, setPreviewZoom] = useState(100);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [renderCounter, setRenderCounter] = useState(0);
  const [nudgeStep, setNudgeStep] = useState(2); // 1, 2, 5, 10, 20
  const iframeRef = useRef(null);

  // Load from database on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await loadSharedPrintSettings();
        if (mounted && data) {
          setSettings(data);
        }
      } catch (err) {
        console.warn("Error fetching shared settings:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Keep local cache immediately in sync with every keystroke/slider drag for zero-lag cross-tab sharing
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
    if (!loading && settings) {
      setCachedSharedSettings(settings);
    }
  }, [settings, loading]);

  // Flush any pending save immediately when switching away from this tab
  useEffect(() => {
    return () => {
      if (settingsRef.current) {
        setCachedSharedSettings(settingsRef.current);
        saveSharedPrintSettings(settingsRef.current).catch(() => null);
        applySharedMasterToAllSlips(settingsRef.current).catch(() => null);
      }
    };
  }, []);

  // Debounced auto-sync to DB so switching tabs never loses position changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (loading) return;

    const timer = setTimeout(async () => {
      try {
        await saveSharedPrintSettings(settings);
      } catch (e) {
        console.warn("Background auto-sync failed:", e);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [settings, loading]);

  // Listen to postMessage clicks from preview iframe to select targets
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === "SELECT_TARGET" && e.data?.key) {
        setSelectedTargetKey(e.data.key);
        setActiveTab("data-designer");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Generic deep update helper
  const handleUpdate = (path, value) => {
    setSettings((prev) => {
      const keys = path.split(".");
      const next = JSON.parse(JSON.stringify(prev));
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;

      // Keep target customText in sync when primary brand properties are edited
      if (path === "hospital.name" && next.fieldStyles?.["header.hospitalName"]) {
        delete next.fieldStyles["header.hospitalName"].customText;
      }
      if (path === "hospital.subtitle" && next.fieldStyles?.["header.subtitle"]) {
        delete next.fieldStyles["header.subtitle"].customText;
      }
      if (path === "hospital.slogan" && next.fieldStyles?.["header.slogan"]) {
        delete next.fieldStyles["header.slogan"].customText;
      }
      if (path === "hospital.address" && next.fieldStyles?.["header.address"]) {
        delete next.fieldStyles["header.address"].customText;
      }
      if (path === "hospital.registrationNo" && next.fieldStyles?.["header.regNo"]) {
        delete next.fieldStyles["header.regNo"].customText;
      }
      if (path === "hospital.emergencyPhone" && next.fieldStyles?.["header.emergencyPhone"]) {
        delete next.fieldStyles["header.emergencyPhone"].customText;
      }

      return next;
    });
    setRenderCounter((c) => c + 1);
  };

  // Field style update helper (X/Y Offsets, font, colors, etc.)
  const handleUpdateFieldStyle = (key, prop, value) => {
    setSettings((prev) => {
      const nextStyles = {
        ...(prev.fieldStyles || {}),
        [key]: {
          ...(prev.fieldStyles?.[key] || {}),
          [prop]: value,
        },
      };
      const next = { ...prev, fieldStyles: nextStyles };
      if (key === "header.hospitalName" && prop === "customText" && value) {
        if (!next.hospital) next.hospital = {};
        next.hospital.name = value;
      }
      if (key === "header.logo" && prop === "height" && value) {
        if (!next.hospital) next.hospital = {};
        next.hospital.logoHeight = Number(value);
      }
      return next;
    });
    setRenderCounter((c) => c + 1);
  };

  // Toggle Active / Inactive for a specific data element on the current slip
  const handleToggleActive = (elementKey) => {
    const isCurrentlyActive = isElementActiveOnSlip(elementKey, selectedSlipType, settings);
    setSettings((prev) => toggleSlipElementActive(prev, selectedSlipType, elementKey, !isCurrentlyActive));
    setRenderCounter((c) => c + 1);
  };

  // Reset selected element styles back to defaults
  const handleResetTarget = (key) => {
    setSettings((prev) => {
      const nextStyles = { ...(prev.fieldStyles || {}) };
      delete nextStyles[key];
      return { ...prev, fieldStyles: nextStyles };
    });
    setRenderCounter((c) => c + 1);
  };

  // Save to DB and automatically propagate to all slip templates!
  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMessage(null);
      // 1. Save master configuration
      await saveSharedPrintSettings(settings);
      // 2. Automatically sync and apply to all slips (OPD, Admission, Billing, Discharge)
      const results = await applySharedMasterToAllSlips(settings);
      const successCount = results.filter((r) => r.success).length;
      setStatusMessage({
        type: "success",
        message: `Master Shared Header & Footer saved and synced to all ${successCount} slips (OPD, Admission Ticket, Billing Slip, Discharge Summary)!`,
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error("Save error:", err);
      setStatusMessage({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to save shared settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Apply to all slips in DB
  const handleApplyToAll = async () => {
    if (
      !window.confirm(
        "Apply this Master Header, Footer & Data Configuration to ALL slips (OPD Consultation, IPD Admission Ticket, IPD Billing Slip, Discharge Summary)?\n\nAll existing slips will immediately share and render this exact letterhead, demographics and footer."
      )
    ) {
      return;
    }
    try {
      setApplyingAll(true);
      setStatusMessage(null);
      await saveSharedPrintSettings(settings);
      const results = await applySharedMasterToAllSlips(settings);
      const successCount = results.filter((r) => r.success).length;
      setStatusMessage({
        type: "success",
        message: `Successfully propagated Master Header & Footer with per-slip data rules to ${successCount} slip templates!`,
      });
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err) {
      console.error("Propagation error:", err);
      setStatusMessage({
        type: "error",
        message: err?.message || "Failed to apply to all slips.",
      });
    } finally {
      setApplyingAll(false);
    }
  };

  // Factory reset
  const handleResetDefaults = () => {
    if (window.confirm("Reset all Shared Master customizations back to factory defaults?")) {
      setSettings(DEFAULT_SHARED_CONFIG);
      setRenderCounter((c) => c + 1);
    }
  };

  // Logo upload
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
        }
      } catch (err) {
        console.error("Upload error:", err);
        handleUpdate("hospital.logoUrl", base64);
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Test Print
  const handleTestPrint = () => {
    const html = buildSharedPreviewHTML(settings, null, {
      isPreview: false,
      slipType: selectedSlipType,
    });
    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      setTimeout(() => {
        try {
          win.print();
        } catch (_) {}
      }, 350);
    }
  };

  // Selected target metadata
  const currentTargetMeta = useMemo(() => {
    return (
      SHARED_ELEMENT_TARGETS.find((t) => t.key === selectedTargetKey) || {
        key: selectedTargetKey,
        name: selectedTargetKey,
        section: "Custom Element",
      }
    );
  }, [selectedTargetKey]);

  const currentFieldStyle = useMemo(() => {
    return settings.fieldStyles?.[selectedTargetKey] || {};
  }, [selectedTargetKey, settings.fieldStyles]);

  const getDefaultSizeForTarget = (key) => {
    if (key === "header.logo") return 48;
    if (key === "ticket.barcode") return 24;
    if (key === "header.hospitalName") return 20;
    if (key === "header.subtitle") return 10;
    if (key === "header.slogan") return 9.5;
    if (key === "header.address") return 9;
    if (key === "header.phoneEmail") return 9;
    if (key === "header.regNo") return 9;
    if (key === "header.emergencyPhone") return 9.5;
    if (key === "ticket.title") return 13;
    if (key === "ticket.copyBadge") return 8;
    if (key === "ticket.topUhid") return 11;
    if (key === "ticket.topAdmissionNo") return 11;
    if (key === "patient.name") return 12;
    if (key === "patient.uhid") return 11;
    if (key === "terms.title") return 10.5;
    if (key === "terms.list") return 8.5;
    if (key === "terms.helpline") return 9;
    if (key === "terms.disclaimer") return 8.5;
    return 11;
  };

  const isLogoTarget = selectedTargetKey === "header.logo";
  const isBarcodeTarget = selectedTargetKey === "ticket.barcode";
  const isBannerBoxTarget = selectedTargetKey === "ticket.card";
  const isPureCardTarget = selectedTargetKey.endsWith(".card") || selectedTargetKey === "signatures.row" || selectedTargetKey === "ticket.card";
  const isContainerTarget =
    isPureCardTarget ||
    selectedTargetKey === "terms.list" ||
    selectedTargetKey.startsWith("terms.") ||
    selectedTargetKey.startsWith("signatures.") ||
    selectedTargetKey.includes("badge") ||
    selectedTargetKey.includes("tag") ||
    selectedTargetKey === "header.accreditations";
  const isTextTarget = !isLogoTarget && !isBarcodeTarget && (!isPureCardTarget || selectedTargetKey === "ticket.title");

  // Nudge selected element in 4 directions
  const handleNudge = (direction) => {
    const curX = Number(currentFieldStyle.offsetX) || 0;
    const curY = Number(currentFieldStyle.offsetY) || 0;
    if (direction === "up") {
      handleUpdateFieldStyle(selectedTargetKey, "offsetY", curY - nudgeStep);
    } else if (direction === "down") {
      handleUpdateFieldStyle(selectedTargetKey, "offsetY", curY + nudgeStep);
    } else if (direction === "left") {
      handleUpdateFieldStyle(selectedTargetKey, "offsetX", curX - nudgeStep);
    } else if (direction === "right") {
      handleUpdateFieldStyle(selectedTargetKey, "offsetX", curX + nudgeStep);
    } else if (direction === "center") {
      handleUpdateFieldStyle(selectedTargetKey, "offsetX", 0);
      handleUpdateFieldStyle(selectedTargetKey, "offsetY", 0);
    }
  };

  const handleResetPosition = (key) => {
    handleUpdateFieldStyle(key, "offsetX", 0);
    handleUpdateFieldStyle(key, "offsetY", 0);
  };

  // Keyboard arrow shortcuts to nudge elements when inspecting
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }
      if (activeTab !== "data-designer" || !selectedTargetKey) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleNudge("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleNudge("down");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleNudge("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNudge("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTargetKey, activeTab, nudgeStep, currentFieldStyle]);

  // Selected slip metadata
  const currentSlipMeta = useMemo(() => {
    return SLIP_TYPES.find((s) => s.id === selectedSlipType) || SLIP_TYPES[0];
  }, [selectedSlipType]);

  const isCurrentTargetActive = useMemo(() => {
    return isElementActiveOnSlip(selectedTargetKey, selectedSlipType, settings);
  }, [selectedTargetKey, selectedSlipType, settings]);

  // Filtered targets list for the data catalog
  const filteredTargets = useMemo(() => {
    return SHARED_ELEMENT_TARGETS.filter((t) => {
      // Category filter
      if (dataCategoryFilter === "header") {
        if (t.section !== "Hospital Header" && t.section !== "Document Banner") return false;
      } else if (dataCategoryFilter === "demographics") {
        if (t.section !== "Patient Demographics") return false;
      } else if (dataCategoryFilter === "footer") {
        if (t.section !== "Footer Policies" && t.section !== "Footer Signatures") return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.key.toLowerCase().includes(q) ||
          (t.desc && t.desc.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [dataCategoryFilter, searchQuery]);

  // Build live preview HTML
  const previewHtml = useMemo(() => {
    return buildSharedPreviewHTML(settings, null, {
      isPreview: true,
      activeTargetKey: selectedTargetKey,
      slipType: selectedSlipType,
    });
  }, [settings, selectedTargetKey, selectedSlipType, renderCounter]);

  // Sync iframe document directly on previewHtml change to guarantee 100% instant re-render
  useEffect(() => {
    if (iframeRef.current) {
      try {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(previewHtml);
          doc.close();
        }
      } catch (e) {
        console.warn("Iframe doc write fallback:", e);
      }
    }
  }, [previewHtml]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <Icon name="LuLoader" size={24} className="animate-spin mx-auto mb-2 text-sky-700" />
        <p className="text-sm font-semibold">Loading Master Shared Print Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── TOP ACTION BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-700 to-indigo-800 flex items-center justify-center text-white shadow-sm">
            <Icon name="LuSparkles" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Master Shared Header, Footer &amp; Demographics Designer
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                Global Master Hub
              </span>
            </div>
            <p className="text-xs text-slate-500">
              One shared master layout with <strong>per-slip Active / Inactive data toggles</strong> and direct <strong>X/Y position controls when data is selected</strong>.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            title="Reset to factory defaults"
          >
            <Icon name="LuRotateCcw" size={13} /> Reset
          </button>

          <button
            type="button"
            onClick={handleTestPrint}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 flex items-center gap-1.5 shadow-xs"
          >
            <Icon name="LuPrinter" size={14} /> Test Print ({currentSlipMeta.badge})
          </button>

          <button
            type="button"
            onClick={handleApplyToAll}
            disabled={applyingAll}
            className="px-4 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            title="Sync this Master Header & Footer to OPD, IPD Admission, IPD Billing, and IPD Discharge"
          >
            <Icon name={applyingAll ? "LuLoader" : "LuLayers"} size={14} className={applyingAll ? "animate-spin" : "text-amber-700"} />
            <span>{applyingAll ? "Applying to Slips..." : "⚡ Apply to All Slips"}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-1.5 text-xs font-bold text-white bg-sky-900 hover:bg-sky-950 rounded-lg flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <Icon name={saving ? "LuLoader" : "LuSave"} size={14} className={saving ? "animate-spin" : ""} />
            <span>{saving ? "Saving Master..." : "Save Shared Master"}</span>
          </button>
        </div>
      </div>

      {/* Status Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name={statusMessage.type === "success" ? "LuCheckCircle" : "LuAlertTriangle"} size={18} />
            <span>{statusMessage.message}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <Icon name="LuX" size={16} />
          </button>
        </div>
      )}

      {/* ── 🌟 PROMINENT SLIP TYPE SELECTOR BAR ── */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                Choose Document / Slip Type
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Select a slip to configure which data is <strong>Active/Inactive</strong> on it and preview its exact layout:
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-sky-900/80 text-sky-200 border border-sky-700/50 self-start md:self-auto">
            Viewing Slip: {currentSlipMeta.label}
          </span>
        </div>

        {/* Segmented Buttons for Slip Types */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SLIP_TYPES.map((st) => {
            const isSelected = selectedSlipType === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedSlipType(st.id)}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-gradient-to-b from-sky-600 to-sky-700 text-white border-sky-400 shadow-lg ring-2 ring-sky-400/50"
                    : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-extrabold truncate">{st.label}</span>
                  {isSelected && (
                    <span className="text-[9px] bg-white text-sky-800 font-black px-1.5 py-0.2 rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-200 line-clamp-1">{st.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Controls (5 cols), Right Live WYSIWYG Preview (7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls Panel */}
        <div className="xl:col-span-5 space-y-4">
          {/* Sub-Tabs Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("data-designer")}
              className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "data-designer"
                  ? "bg-white text-sky-900 shadow-sm border border-slate-200 font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon name="LuSlidersHorizontal" size={14} className="text-sky-700" />
              <span>Data &amp; Position Control</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hospital")}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "hospital"
                  ? "bg-white text-sky-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon name="LuBuilding2" size={14} />
              <span>Hospital Brand</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("footer")}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "footer"
                  ? "bg-white text-sky-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon name="LuScroll" size={14} />
              <span>Policies &amp; Sig</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("slips")}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "slips"
                  ? "bg-white text-sky-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon name="LuFileText" size={14} />
              <span>Slip Titles</span>
            </button>
          </div>

          {/* ══════════════ TAB 1: UNIFIED DATA SELECTION & POSITION CONTROLLER ══════════════ */}
          {activeTab === "data-designer" && (
            <div className="space-y-4">
              {/* ── 🎯 DOCKED POSITION CONTROLLER FOR THE SELECTED DATA ELEMENT ── */}
              <div className="bg-gradient-to-b from-sky-50/90 to-white border-2 border-sky-400 rounded-2xl p-4 shadow-sm space-y-4 relative">
                {/* Header: Selected Element Identity & Status */}
                <div className="flex items-start justify-between gap-2 border-b border-sky-200/80 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse"></span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800">
                        Selected Data Element
                      </span>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-300">
                        {currentTargetMeta.section}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {currentTargetMeta.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">{currentTargetMeta.desc}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {/* Active/Inactive Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(selectedTargetKey)}
                      className={`px-3 py-1 text-xs font-black rounded-lg flex items-center gap-1 shadow-xs transition-all ${
                        isCurrentTargetActive
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-600 line-through"
                      }`}
                      title={`Toggle visibility on ${currentSlipMeta.label}`}
                    >
                      <Icon name={isCurrentTargetActive ? "LuCheck" : "LuEyeOff"} size={13} />
                      <span>{isCurrentTargetActive ? "Active on Slip" : "Inactive (Hidden)"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleResetPosition(selectedTargetKey)}
                        className="text-[10px] font-semibold text-slate-500 hover:text-sky-700 bg-white border border-slate-200 hover:border-sky-300 rounded px-2 py-0.5 flex items-center gap-1 transition-all"
                        title="Reset X & Y offsets to 0"
                      >
                        <Icon name="LuRotateCcw" size={10} /> Reset (0,0)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetTarget(selectedTargetKey)}
                        className="text-[10px] font-semibold text-slate-500 hover:text-red-600 bg-white border border-slate-200 hover:border-red-300 rounded px-2 py-0.5 flex items-center gap-1 transition-all"
                        title="Clear all custom styles, text and offsets"
                      >
                        <Icon name="LuTrash2" size={10} /> Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* If element is Inactive, show alert with one-click Activate */}
                {!isCurrentTargetActive && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon name="LuAlertCircle" size={16} className="text-amber-600 flex-shrink-0" />
                      <span>This data is marked <strong>Inactive (Hidden)</strong> on <strong>{currentSlipMeta.label}</strong>.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(selectedTargetKey)}
                      className="px-2.5 py-1 text-[11px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs flex-shrink-0"
                    >
                      Activate Data
                    </button>
                  </div>
                )}

                {/* ── 🕹️ DIRECTIONAL NUDGE PAD (D-PAD) & STEP CONTROLLER ── */}
                <div className="p-3.5 bg-white rounded-xl border border-sky-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Icon name="LuMove" size={14} className="text-sky-700" />
                      <span>Position Arrangement &amp; Nudge Pad</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      Tip: Use ⬆️ ⬇️ ⬅️ ➡️ arrow keys on keyboard
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/90 p-3 rounded-xl border border-slate-200">
                    {/* 3x3 Tactile Directional D-Pad */}
                    <div className="grid grid-cols-3 gap-1.5 w-32 h-32 flex-shrink-0 select-none">
                      <div></div>
                      <button
                        type="button"
                        onClick={() => handleNudge("up")}
                        className="bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 active:bg-sky-100 border border-slate-300 hover:border-sky-400 rounded-lg flex items-center justify-center shadow-xs transition-all active:scale-95"
                        title={`Nudge Up by ${nudgeStep}px`}
                      >
                        <Icon name="LuArrowUp" size={18} />
                      </button>
                      <div></div>
                      <button
                        type="button"
                        onClick={() => handleNudge("left")}
                        className="bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 active:bg-sky-100 border border-slate-300 hover:border-sky-400 rounded-lg flex items-center justify-center shadow-xs transition-all active:scale-95"
                        title={`Nudge Left by ${nudgeStep}px`}
                      >
                        <Icon name="LuArrowLeft" size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudge("center")}
                        className="bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded-lg flex flex-col items-center justify-center text-[9px] font-extrabold shadow-xs transition-all active:scale-95"
                        title="Reset Offsets to (0, 0)"
                      >
                        <Icon name="LuRotateCcw" size={12} className="mb-0.5" />
                        (0,0)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudge("right")}
                        className="bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 active:bg-sky-100 border border-slate-300 hover:border-sky-400 rounded-lg flex items-center justify-center shadow-xs transition-all active:scale-95"
                        title={`Nudge Right by ${nudgeStep}px`}
                      >
                        <Icon name="LuArrowRight" size={18} />
                      </button>
                      <div></div>
                      <button
                        type="button"
                        onClick={() => handleNudge("down")}
                        className="bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 active:bg-sky-100 border border-slate-300 hover:border-sky-400 rounded-lg flex items-center justify-center shadow-xs transition-all active:scale-95"
                        title={`Nudge Down by ${nudgeStep}px`}
                      >
                        <Icon name="LuArrowDown" size={18} />
                      </button>
                      <div></div>
                    </div>

                    {/* Step Size & Offset Readout */}
                    <div className="flex-1 space-y-2.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">Nudge Step:</span>
                        <div className="flex items-center gap-1">
                          {[1, 5, 10, 25, 50].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => setNudgeStep(step)}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                                nudgeStep === step
                                  ? "bg-sky-700 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {step}px
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quick Alignment Across Page */}
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <span className="text-[10px] font-bold text-slate-400">Page Align:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateFieldStyle(selectedTargetKey, "offsetX", 0)}
                            className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                            title="Align to Left Margin (X: 0)"
                          >
                            Left
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateFieldStyle(selectedTargetKey, "textAlign", "center");
                              handleUpdateFieldStyle(selectedTargetKey, "offsetX", 0);
                            }}
                            className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                            title="Center Align"
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateFieldStyle(selectedTargetKey, "textAlign", "right");
                              handleUpdateFieldStyle(selectedTargetKey, "offsetX", 0);
                            }}
                            className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                            title="Right Align"
                          >
                            Right
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateFieldStyle(selectedTargetKey, "offsetX", 0);
                              handleUpdateFieldStyle(selectedTargetKey, "offsetY", 0);
                            }}
                            className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                            title="Reset Position (0, 0)"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Position Status & Direct Input Chips */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">X (Horizontal)</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="number"
                                value={currentFieldStyle.offsetX ?? 0}
                                onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "offsetX", Number(e.target.value))}
                                className="w-16 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-slate-800"
                              />
                              <span className="text-[10px] text-slate-400 font-mono">px</span>
                            </div>
                          </div>
                          {Number(currentFieldStyle.offsetX || 0) !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateFieldStyle(selectedTargetKey, "offsetX", 0)}
                              className="text-[9.5px] text-sky-700 hover:underline font-bold"
                            >
                              0
                            </button>
                          )}
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Y (Vertical)</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="number"
                                value={currentFieldStyle.offsetY ?? 0}
                                onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "offsetY", Number(e.target.value))}
                                className="w-16 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-slate-800"
                              />
                              <span className="text-[10px] text-slate-400 font-mono">px</span>
                            </div>
                          </div>
                          {Number(currentFieldStyle.offsetY || 0) !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateFieldStyle(selectedTargetKey, "offsetY", 0)}
                              className="text-[9.5px] text-sky-700 hover:underline font-bold"
                            >
                              0
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── 📏 DYNAMIC COMPONENT SIZE & SCALE CONTROL (Replaces Continuous X/Y Sliders) ── */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Icon name="LuMaximize2" size={14} className="text-sky-700" />
                        <span>
                          {isLogoTarget
                            ? "🖼️ Logo Size & Dimensions"
                            : isBarcodeTarget
                            ? "📊 Barcode Size & Dimensions"
                            : isBannerBoxTarget
                            ? "🎫 Banner Box Style & Size"
                            : isPureCardTarget
                            ? "📐 Container Scale & Size"
                            : "🔤 Component Text & Font Size"}
                        </span>
                      </span>
                      {/* Current Size Readout Badge */}
                      <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                        {isLogoTarget
                          ? `${currentFieldStyle.height || settings.hospital?.logoHeight || 48}px Height`
                          : isBarcodeTarget
                          ? `${currentFieldStyle.height || 24}px Height`
                          : isBannerBoxTarget || isPureCardTarget
                          ? `${currentFieldStyle.scale || 100}% Scale`
                          : `${currentFieldStyle.fontSize || "Auto"}px Font`}
                      </span>
                    </div>

                    {/* Logo Size Control (Height in px) */}
                    {isLogoTarget && (
                      <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Logo Height:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="20"
                              max="160"
                              step="2"
                              value={currentFieldStyle.height ?? (settings.hospital?.logoHeight || 48)}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                handleUpdateFieldStyle("header.logo", "height", val);
                                handleUpdate("hospital.logoHeight", val);
                              }}
                              className="w-16 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5"
                            />
                            <span className="text-slate-400 text-[11px]">px</span>
                            {Number(currentFieldStyle.height || (settings.hospital?.logoHeight || 48)) !== 48 && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateFieldStyle("header.logo", "height", 48);
                                  handleUpdate("hospital.logoHeight", 48);
                                }}
                                className="text-[10px] text-sky-700 font-bold hover:underline ml-1"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="range"
                          min="20"
                          max="150"
                          step="2"
                          value={currentFieldStyle.height ?? (settings.hospital?.logoHeight || 48)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleUpdateFieldStyle("header.logo", "height", val);
                            handleUpdate("hospital.logoHeight", val);
                          }}
                          className="w-full accent-sky-700 cursor-pointer"
                        />

                        {/* Step Buttons: -10, -2, Default 48px, +2, +10 */}
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          {[-10, -2].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => {
                                const cur = Number(currentFieldStyle.height ?? (settings.hospital?.logoHeight || 48));
                                const nextVal = Math.max(20, Math.min(160, cur + step));
                                handleUpdateFieldStyle("header.logo", "height", nextVal);
                                handleUpdate("hospital.logoHeight", nextVal);
                              }}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                            >
                              {step}px
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateFieldStyle("header.logo", "height", 48);
                              handleUpdate("hospital.logoHeight", 48);
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 rounded hover:bg-sky-100"
                          >
                            48px (Default)
                          </button>
                          {[2, 10].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => {
                                const cur = Number(currentFieldStyle.height ?? (settings.hospital?.logoHeight || 48));
                                const nextVal = Math.max(20, Math.min(160, cur + step));
                                handleUpdateFieldStyle("header.logo", "height", nextVal);
                                handleUpdate("hospital.logoHeight", nextVal);
                              }}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                            >
                              +{step}px
                            </button>
                          ))}
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                          <span className="text-[10px] font-bold text-slate-400 mr-1">Presets:</span>
                          {[
                            { label: "32px", val: 32 },
                            { label: "40px", val: 40 },
                            { label: "48px (Std)", val: 48 },
                            { label: "64px", val: 64 },
                            { label: "80px", val: 80 },
                            { label: "100px", val: 100 },
                          ].map((p) => {
                            const isSelected = Number(currentFieldStyle.height ?? (settings.hospital?.logoHeight || 48)) === p.val;
                            return (
                              <button
                                key={p.val}
                                type="button"
                                onClick={() => {
                                  handleUpdateFieldStyle("header.logo", "height", p.val);
                                  handleUpdate("hospital.logoHeight", p.val);
                                }}
                                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all ${
                                  isSelected
                                    ? "bg-sky-700 text-white font-bold"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Barcode Size Control (Height in px) */}
                    {isBarcodeTarget && (
                      <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Barcode Height:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="14"
                              max="60"
                              step="2"
                              value={currentFieldStyle.height ?? 24}
                              onChange={(e) => handleUpdateFieldStyle("ticket.barcode", "height", Number(e.target.value))}
                              className="w-16 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5"
                            />
                            <span className="text-slate-400 text-[11px]">px</span>
                            {Number(currentFieldStyle.height || 24) !== 24 && (
                              <button
                                type="button"
                                onClick={() => handleUpdateFieldStyle("ticket.barcode", "height", 24)}
                                className="text-[10px] text-sky-700 font-bold hover:underline ml-1"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="range"
                          min="14"
                          max="60"
                          step="2"
                          value={currentFieldStyle.height ?? 24}
                          onChange={(e) => handleUpdateFieldStyle("ticket.barcode", "height", Number(e.target.value))}
                          className="w-full accent-sky-700 cursor-pointer"
                        />

                        {/* Step Buttons */}
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          {[-6, -2].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => {
                                const cur = Number(currentFieldStyle.height ?? 24);
                                handleUpdateFieldStyle("ticket.barcode", "height", Math.max(14, cur + step));
                              }}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                            >
                              {step}px
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleUpdateFieldStyle("ticket.barcode", "height", 24)}
                            className="px-2 py-0.5 text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 rounded hover:bg-sky-100"
                          >
                            24px (Default)
                          </button>
                          {[2, 6].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => {
                                const cur = Number(currentFieldStyle.height ?? 24);
                                handleUpdateFieldStyle("ticket.barcode", "height", Math.min(60, cur + step));
                              }}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                            >
                              +{step}px
                            </button>
                          ))}
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                          <span className="text-[10px] font-bold text-slate-400 mr-1">Presets:</span>
                          {[
                            { label: "18px", val: 18 },
                            { label: "24px (Std)", val: 24 },
                            { label: "32px", val: 32 },
                            { label: "40px", val: 40 },
                            { label: "50px", val: 50 },
                          ].map((p) => {
                            const isSelected = Number(currentFieldStyle.height ?? 24) === p.val;
                            return (
                              <button
                                key={p.val}
                                type="button"
                                onClick={() => handleUpdateFieldStyle("ticket.barcode", "height", p.val)}
                                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all ${
                                  isSelected
                                    ? "bg-sky-700 text-white font-bold"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── 📦 BOX SIZING, BORDER THICKNESS & EDGE SMOOTHNESS DESIGNER ── */}
                    {(isContainerTarget || isBannerBoxTarget || currentFieldStyle.borderWidth !== undefined || currentFieldStyle.borderRadius !== undefined || currentFieldStyle.borderColor !== undefined || currentFieldStyle.bgColor !== undefined) && (
                      <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-xs border-b border-slate-200/80 pb-2">
                          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Icon name="LuSquare" size={14} className="text-sky-700" />
                            <span>Box Sizing, Border Thickness &amp; Edge Smoothness</span>
                          </span>
                          {(currentFieldStyle.borderWidth !== undefined || currentFieldStyle.borderRadius !== undefined || currentFieldStyle.padding !== undefined || currentFieldStyle.width !== undefined || currentFieldStyle.bgColor !== undefined) && (
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateFieldStyle(selectedTargetKey, "borderWidth", undefined);
                                handleUpdateFieldStyle(selectedTargetKey, "borderStyle", undefined);
                                handleUpdateFieldStyle(selectedTargetKey, "borderColor", undefined);
                                handleUpdateFieldStyle(selectedTargetKey, "borderRadius", undefined);
                                handleUpdateFieldStyle(selectedTargetKey, "showBorder", undefined);
                                handleUpdateFieldStyle(selectedTargetKey, "padding", undefined);
                                handleUpdateFieldStyle(selectedTargetKey, "width", undefined);
                                handleUpdateFieldStyle(selectedTargetKey, "bgColor", undefined);
                              }}
                              className="text-[10px] text-sky-700 hover:underline font-bold"
                            >
                              Reset Box &amp; Borders
                            </button>
                          )}
                        </div>

                        {/* Quick Presets for Banner Card */}
                        {isBannerBoxTarget && (
                          <div className="grid grid-cols-2 gap-2 pb-1 border-b border-slate-200/60">
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateFieldStyle("ticket.card", "bgColor", undefined);
                                handleUpdateFieldStyle("ticket.card", "borderColor", undefined);
                                handleUpdateFieldStyle("ticket.card", "borderWidth", undefined);
                                handleUpdateFieldStyle("ticket.card", "borderRadius", undefined);
                                handleUpdateFieldStyle("ticket.card", "showBorder", true);
                              }}
                              className={`p-1.5 rounded-lg text-xs font-bold border transition-all text-left ${
                                !currentFieldStyle.bgColor && currentFieldStyle.showBorder !== false
                                  ? "bg-white border-sky-500 shadow-xs text-sky-800"
                                  : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                              }`}
                            >
                              <span className="block text-[10.5px]">Default Blue Banner</span>
                              <span className="block text-[9px] font-normal text-slate-400">Sky blue gradient &amp; 1px border</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateFieldStyle("ticket.card", "bgColor", "transparent");
                                handleUpdateFieldStyle("ticket.card", "borderColor", "transparent");
                                handleUpdateFieldStyle("ticket.card", "borderWidth", 0);
                                handleUpdateFieldStyle("ticket.card", "showBorder", false);
                              }}
                              className={`p-1.5 rounded-lg text-xs font-bold border transition-all text-left ${
                                currentFieldStyle.showBorder === false || currentFieldStyle.bgColor === "transparent"
                                  ? "bg-white border-sky-500 shadow-xs text-sky-800"
                                  : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                              }`}
                            >
                              <span className="block text-[10.5px]">Borderless / Clean</span>
                              <span className="block text-[9px] font-normal text-slate-400">Transparent (no blue frame)</span>
                            </button>
                          </div>
                        )}

                        {/* Box Width */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] font-bold text-slate-700">Box Width:</span>
                            <span className="text-[10px] font-mono text-slate-500">{currentFieldStyle.width || "Auto (100%)"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                              { label: "100% (Full)", val: "100%" },
                              { label: "80%", val: "80%" },
                              { label: "60%", val: "60%" },
                              { label: "50% (Half)", val: "50%" },
                              { label: "Auto", val: undefined },
                            ].map((w) => (
                              <button
                                key={w.label}
                                type="button"
                                onClick={() => handleUpdateFieldStyle(selectedTargetKey, "width", w.val)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                                  (currentFieldStyle.width === w.val || (!currentFieldStyle.width && w.val === undefined))
                                    ? "bg-sky-700 text-white shadow-xs"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {w.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Box Padding (Inner Breathing Room) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] font-bold text-slate-700">Inner Padding:</span>
                            <span className="text-[10px] font-mono text-slate-500">{currentFieldStyle.padding !== undefined ? `${currentFieldStyle.padding}px` : "Default"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                              { label: "0px (Flush)", val: 0 },
                              { label: "4px (Compact)", val: 4 },
                              { label: "8px (Standard)", val: 8 },
                              { label: "12px (Spacious)", val: 12 },
                              { label: "16px", val: 16 },
                            ].map((p) => (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => handleUpdateFieldStyle(selectedTargetKey, "padding", p.val)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                                  Number(currentFieldStyle.padding) === p.val
                                    ? "bg-sky-700 text-white shadow-xs"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── 📏 BORDER THICKNESS (SLIDER + NUMBER + PRESETS) ── */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-800">Border Thickness:</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white text-sky-800 rounded font-bold border border-slate-200">
                                {currentFieldStyle.showBorder === false || currentFieldStyle.borderWidth === 0
                                  ? "0px (None / Borderless)"
                                  : currentFieldStyle.borderWidth !== undefined
                                  ? `${currentFieldStyle.borderWidth}px`
                                  : "Default (1px)"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={
                                  currentFieldStyle.showBorder === false || currentFieldStyle.borderWidth === 0
                                    ? 0
                                    : currentFieldStyle.borderWidth !== undefined
                                    ? currentFieldStyle.borderWidth
                                    : 1
                                }
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (isNaN(val) || val <= 0) {
                                    handleUpdateFieldStyle(selectedTargetKey, "borderWidth", 0);
                                    handleUpdateFieldStyle(selectedTargetKey, "showBorder", false);
                                  } else {
                                    handleUpdateFieldStyle(selectedTargetKey, "borderWidth", val);
                                    handleUpdateFieldStyle(selectedTargetKey, "showBorder", true);
                                    if (!currentFieldStyle.borderStyle || currentFieldStyle.borderStyle === "none") {
                                      handleUpdateFieldStyle(selectedTargetKey, "borderStyle", "solid");
                                    }
                                  }
                                }}
                                className="w-14 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1 py-0.5"
                              />
                              <span className="text-slate-400 text-[11px]">px</span>
                              {currentFieldStyle.borderWidth !== undefined && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateFieldStyle(selectedTargetKey, "borderWidth", undefined);
                                    handleUpdateFieldStyle(selectedTargetKey, "showBorder", undefined);
                                  }}
                                  className="text-[10px] text-sky-700 font-bold hover:underline ml-1"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="8"
                            step="0.5"
                            value={
                              currentFieldStyle.showBorder === false || currentFieldStyle.borderWidth === 0
                                ? 0
                                : currentFieldStyle.borderWidth !== undefined
                                ? Number(currentFieldStyle.borderWidth)
                                : 1
                            }
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (val === 0) {
                                handleUpdateFieldStyle(selectedTargetKey, "borderWidth", 0);
                                handleUpdateFieldStyle(selectedTargetKey, "showBorder", false);
                              } else {
                                handleUpdateFieldStyle(selectedTargetKey, "borderWidth", val);
                                handleUpdateFieldStyle(selectedTargetKey, "showBorder", true);
                                if (!currentFieldStyle.borderStyle || currentFieldStyle.borderStyle === "none") {
                                  handleUpdateFieldStyle(selectedTargetKey, "borderStyle", "solid");
                                }
                              }
                            }}
                            className="w-full accent-sky-700 cursor-pointer"
                          />

                          <div className="flex items-center gap-1 flex-wrap">
                            {[
                              { label: "0px None", val: 0 },
                              { label: "0.5px Hairline", val: 0.5 },
                              { label: "1px Thin", val: 1 },
                              { label: "1.5px", val: 1.5 },
                              { label: "2px Medium", val: 2 },
                              { label: "3px Thick", val: 3 },
                              { label: "4px Heavy", val: 4 },
                            ].map((b) => {
                              const isSelected =
                                (b.val === 0 && (currentFieldStyle.showBorder === false || currentFieldStyle.borderWidth === 0)) ||
                                (b.val > 0 && currentFieldStyle.showBorder !== false && Number(currentFieldStyle.borderWidth) === b.val) ||
                                (b.val === 1 && currentFieldStyle.borderWidth === undefined && currentFieldStyle.showBorder !== false);
                              return (
                                <button
                                  key={b.label}
                                  type="button"
                                  onClick={() => {
                                    if (b.val === 0) {
                                      handleUpdateFieldStyle(selectedTargetKey, "borderWidth", 0);
                                      handleUpdateFieldStyle(selectedTargetKey, "showBorder", false);
                                    } else {
                                      handleUpdateFieldStyle(selectedTargetKey, "borderWidth", b.val);
                                      handleUpdateFieldStyle(selectedTargetKey, "showBorder", true);
                                      if (!currentFieldStyle.borderStyle || currentFieldStyle.borderStyle === "none") {
                                        handleUpdateFieldStyle(selectedTargetKey, "borderStyle", "solid");
                                      }
                                    }
                                  }}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                                    isSelected
                                      ? "bg-sky-700 text-white shadow-xs"
                                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {b.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Border Style */}
                        <div className="space-y-1 pt-1.5 border-t border-slate-200/60">
                          <label className="text-[10.5px] font-bold text-slate-700 block">Border Line Style:</label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                              { label: "Solid", val: "solid" },
                              { label: "Dashed", val: "dashed" },
                              { label: "Dotted", val: "dotted" },
                              { label: "Double", val: "double" },
                              { label: "None", val: "none" },
                            ].map((st) => (
                              <button
                                key={st.val}
                                type="button"
                                onClick={() => {
                                  if (st.val === "none") {
                                    handleUpdateFieldStyle(selectedTargetKey, "borderStyle", "none");
                                    handleUpdateFieldStyle(selectedTargetKey, "showBorder", false);
                                  } else {
                                    handleUpdateFieldStyle(selectedTargetKey, "borderStyle", st.val);
                                    handleUpdateFieldStyle(selectedTargetKey, "showBorder", true);
                                  }
                                }}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded capitalize transition-all ${
                                  (currentFieldStyle.borderStyle === st.val || (!currentFieldStyle.borderStyle && st.val === "solid" && currentFieldStyle.showBorder !== false))
                                    ? "bg-sky-700 text-white shadow-xs"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── ⚪ EDGE SMOOTHNESS (CORNER RADIUS) ── */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-800">Edge Smoothness:</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white text-sky-800 rounded font-bold border border-slate-200">
                                {currentFieldStyle.borderRadius === 0
                                  ? "0px (Sharp Corners)"
                                  : currentFieldStyle.borderRadius === 999
                                  ? "Pill (Fully Rounded)"
                                  : currentFieldStyle.borderRadius !== undefined
                                  ? `${currentFieldStyle.borderRadius}px Smooth`
                                  : "Default (8px Rounded)"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {/* Live corner curvature indicator */}
                              <div
                                className="w-5 h-5 bg-sky-100 border-2 border-sky-600 transition-all shadow-2xs"
                                style={{
                                  borderRadius: `${Math.min(10, currentFieldStyle.borderRadius !== undefined ? Number(currentFieldStyle.borderRadius) : 8)}px`,
                                }}
                                title="Live Corner Radius Shape"
                              />
                              <input
                                type="number"
                                min="0"
                                max="40"
                                step="1"
                                value={
                                  currentFieldStyle.borderRadius !== undefined
                                    ? currentFieldStyle.borderRadius
                                    : 8
                                }
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  handleUpdateFieldStyle(selectedTargetKey, "borderRadius", isNaN(val) ? 0 : val);
                                }}
                                className="w-14 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1 py-0.5"
                              />
                              <span className="text-slate-400 text-[11px]">px</span>
                              {currentFieldStyle.borderRadius !== undefined && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateFieldStyle(selectedTargetKey, "borderRadius", undefined)}
                                  className="text-[10px] text-sky-700 font-bold hover:underline ml-1"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="1"
                            value={
                              currentFieldStyle.borderRadius !== undefined
                                ? Number(currentFieldStyle.borderRadius)
                                : 8
                            }
                            onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "borderRadius", Number(e.target.value))}
                            className="w-full accent-sky-700 cursor-pointer"
                          />

                          <div className="flex items-center gap-1 flex-wrap">
                            {[
                              { label: "0px Sharp", val: 0 },
                              { label: "2px Crisp", val: 2 },
                              { label: "4px Subtle", val: 4 },
                              { label: "8px Standard", val: 8 },
                              { label: "12px Smooth", val: 12 },
                              { label: "16px Card", val: 16 },
                              { label: "Pill", val: 999 },
                            ].map((r) => {
                              const isSelected =
                                (r.val === 999 && Number(currentFieldStyle.borderRadius) >= 999) ||
                                (r.val !== 999 && Number(currentFieldStyle.borderRadius) === r.val) ||
                                (r.val === 8 && currentFieldStyle.borderRadius === undefined);
                              return (
                                <button
                                  key={r.label}
                                  type="button"
                                  onClick={() => handleUpdateFieldStyle(selectedTargetKey, "borderRadius", r.val)}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                                    isSelected
                                      ? "bg-sky-700 text-white shadow-xs"
                                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {r.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Border Color & Background Fill */}
                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80">
                          <div>
                            <label className="text-[10.5px] font-bold text-slate-700 block mb-1">Border Color:</label>
                            <div className="flex items-center gap-1 mb-1.5">
                              <input
                                type="color"
                                value={currentFieldStyle.borderColor || "#cbd5e1"}
                                onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "borderColor", e.target.value)}
                                className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                              />
                              <input
                                type="text"
                                value={currentFieldStyle.borderColor || ""}
                                placeholder="#cbd5e1"
                                onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "borderColor", e.target.value || undefined)}
                                className="w-20 text-[10px] font-mono rounded border border-slate-200 px-1.5 py-0.5 text-slate-700"
                              />
                              {currentFieldStyle.borderColor && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateFieldStyle(selectedTargetKey, "borderColor", undefined)}
                                  className="text-[9px] text-sky-700 hover:underline font-bold"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {[
                                { label: "Slate", val: "#cbd5e1" },
                                { label: "Gray", val: "#94a3b8" },
                                { label: "Dark", val: "#334155" },
                                { label: "Sky", val: "#0284c7" },
                                { label: "Navy", val: "#0b3b60" },
                              ].map((cp) => (
                                <button
                                  key={cp.label}
                                  type="button"
                                  onClick={() => handleUpdateFieldStyle(selectedTargetKey, "borderColor", cp.val)}
                                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded border transition-all ${
                                    currentFieldStyle.borderColor === cp.val
                                      ? "bg-sky-700 text-white border-sky-700"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {cp.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10.5px] font-bold text-slate-700 block mb-1">Background Fill:</label>
                            <div className="flex items-center gap-1 flex-wrap">
                              {[
                                { label: "None", val: "transparent" },
                                { label: "White", val: "#ffffff" },
                                { label: "Ice Blue", val: "#f0f9ff" },
                                { label: "Light Sky", val: "#e0f2fe" },
                                { label: "Slate", val: "#f8fafc" },
                              ].map((bg) => (
                                <button
                                  key={bg.label}
                                  type="button"
                                  onClick={() => handleUpdateFieldStyle(selectedTargetKey, "bgColor", bg.val)}
                                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded border transition-all ${
                                    currentFieldStyle.bgColor === bg.val
                                      ? "bg-sky-700 text-white border-sky-700"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {bg.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text Element Font Size Control */}
                    {isTextTarget && (
                      <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Text / Font Size:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="7"
                              max="40"
                              value={currentFieldStyle.fontSize ?? ""}
                              placeholder="Auto"
                              onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "fontSize", e.target.value ? Number(e.target.value) : undefined)}
                              className="w-16 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5"
                            />
                            <span className="text-slate-400 text-[11px]">px</span>
                            {currentFieldStyle.fontSize && (
                              <button
                                type="button"
                                onClick={() => handleUpdateFieldStyle(selectedTargetKey, "fontSize", undefined)}
                                className="text-[10px] text-sky-700 font-bold hover:underline ml-1"
                              >
                                Default
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="range"
                          min="7"
                          max="38"
                          step="1"
                          value={currentFieldStyle.fontSize ?? (getDefaultSizeForTarget(selectedTargetKey) || 12)}
                          onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "fontSize", Number(e.target.value))}
                          className="w-full accent-sky-700 cursor-pointer"
                        />

                        {/* Step Buttons: -4, -1, Default, +1, +4 */}
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          {[-4, -1].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => {
                                const cur = Number(currentFieldStyle.fontSize ?? (getDefaultSizeForTarget(selectedTargetKey) || 12));
                                handleUpdateFieldStyle(selectedTargetKey, "fontSize", Math.max(7, cur + step));
                              }}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                            >
                              {step}px
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleUpdateFieldStyle(selectedTargetKey, "fontSize", undefined)}
                            className="px-2 py-0.5 text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 rounded hover:bg-sky-100"
                          >
                            Default
                          </button>
                          {[1, 4].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => {
                                const cur = Number(currentFieldStyle.fontSize ?? (getDefaultSizeForTarget(selectedTargetKey) || 12));
                                handleUpdateFieldStyle(selectedTargetKey, "fontSize", Math.min(40, cur + step));
                              }}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                            >
                              +{step}px
                            </button>
                          ))}
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                          <span className="text-[10px] font-bold text-slate-400 mr-1">Presets:</span>
                          {[8, 9, 11, 13, 16, 20, 24].map((sz) => {
                            const isSelected = currentFieldStyle.fontSize === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => handleUpdateFieldStyle(selectedTargetKey, "fontSize", sz)}
                                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all ${
                                  isSelected
                                    ? "bg-sky-700 text-white font-bold"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {sz}px
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Scale Multiplier (%): Zoom & Scale for any component */}
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Zoom / Scale Multiplier:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="50"
                            max="200"
                            step="5"
                            value={currentFieldStyle.scale ?? 100}
                            onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "scale", Number(e.target.value))}
                            className="w-16 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5"
                          />
                          <span className="text-slate-400 text-[11px]">%</span>
                          {currentFieldStyle.scale && Number(currentFieldStyle.scale) !== 100 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateFieldStyle(selectedTargetKey, "scale", 100)}
                              className="text-[10px] text-sky-700 font-bold hover:underline ml-1"
                            >
                              100%
                            </button>
                          )}
                        </div>
                      </div>

                      <input
                        type="range"
                        min="50"
                        max="180"
                        step="5"
                        value={currentFieldStyle.scale ?? 100}
                        onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "scale", Number(e.target.value))}
                        className="w-full accent-sky-700 cursor-pointer"
                      />

                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        {[-20, -5].map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => {
                              const cur = Number(currentFieldStyle.scale || 100);
                              handleUpdateFieldStyle(selectedTargetKey, "scale", Math.max(50, cur + step));
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                          >
                            {step}%
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleUpdateFieldStyle(selectedTargetKey, "scale", 100)}
                          className="px-2 py-0.5 text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-300 rounded hover:bg-sky-100"
                        >
                          100% (Normal)
                        </button>
                        {[5, 20].map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => {
                              const cur = Number(currentFieldStyle.scale || 100);
                              handleUpdateFieldStyle(selectedTargetKey, "scale", Math.min(200, cur + step));
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                          >
                            +{step}%
                          </button>
                        ))}
                      </div>

                      {/* Scale Presets */}
                      <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                        <span className="text-[10px] font-bold text-slate-400 mr-1">Presets:</span>
                        {[
                          { label: "75%", val: 75 },
                          { label: "90%", val: 90 },
                          { label: "100%", val: 100 },
                          { label: "115%", val: 115 },
                          { label: "130%", val: 130 },
                          { label: "150%", val: 150 },
                        ].map((p) => {
                          const isSelected = Number(currentFieldStyle.scale || 100) === p.val;
                          return (
                            <button
                              key={p.val}
                              type="button"
                              onClick={() => handleUpdateFieldStyle(selectedTargetKey, "scale", p.val)}
                              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all ${
                                isSelected
                                  ? "bg-sky-700 text-white font-bold"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 🎨 TEXT ALIGNMENT, TYPOGRAPHY & BRAND PALETTE ── */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Icon name="LuType" size={14} className="text-indigo-600" />
                    <span>Typography, Alignment &amp; Palette</span>
                  </span>

                  {/* Alignment & Text Case */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Text Alignment &amp; Case:</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Alignment Options */}
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateFieldStyle(selectedTargetKey, "textAlign", "left")}
                          className={`p-1.5 rounded text-xs font-bold transition-all ${
                            currentFieldStyle.textAlign === "left" || !currentFieldStyle.textAlign
                              ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                          title="Align Left"
                        >
                          <Icon name="LuAlignLeft" size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFieldStyle(selectedTargetKey, "textAlign", "center")}
                          className={`p-1.5 rounded text-xs font-bold transition-all ${
                            currentFieldStyle.textAlign === "center"
                              ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                          title="Align Center"
                        >
                          <Icon name="LuAlignCenter" size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFieldStyle(selectedTargetKey, "textAlign", "right")}
                          className={`p-1.5 rounded text-xs font-bold transition-all ${
                            currentFieldStyle.textAlign === "right"
                              ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                          title="Align Right"
                        >
                          <Icon name="LuAlignRight" size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFieldStyle(selectedTargetKey, "textAlign", "justify")}
                          className={`p-1.5 rounded text-xs font-bold transition-all ${
                            currentFieldStyle.textAlign === "justify"
                              ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                          title="Justify"
                        >
                          <Icon name="LuAlignJustify" size={14} />
                        </button>
                      </div>

                      {/* Text Transform Options */}
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateFieldStyle(selectedTargetKey, "textTransform", "")}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            !currentFieldStyle.textTransform
                              ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFieldStyle(selectedTargetKey, "textTransform", "uppercase")}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            currentFieldStyle.textTransform === "uppercase"
                              ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          UPPER
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateFieldStyle(selectedTargetKey, "textTransform", "capitalize")}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            currentFieldStyle.textTransform === "capitalize"
                              ? "bg-white text-sky-800 shadow-xs border border-slate-200"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Capital
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Font Size, Weight & Letter Spacing */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-bold text-slate-700">Font Size (px):</label>
                        {currentFieldStyle.fontSize && (
                          <button
                            type="button"
                            onClick={() => handleUpdateFieldStyle(selectedTargetKey, "fontSize", undefined)}
                            className="text-[9.5px] text-sky-700 hover:underline"
                          >
                            Default
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        min="6"
                        max="42"
                        value={currentFieldStyle.fontSize ?? ""}
                        placeholder="Auto"
                        onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "fontSize", e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full text-xs rounded border border-slate-200 px-2 py-1 font-mono"
                      />
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {[9, 11, 13, 16, 20, 24].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleUpdateFieldStyle(selectedTargetKey, "fontSize", sz)}
                            className={`px-1.5 py-0.2 text-[9.5px] font-mono rounded ${
                              currentFieldStyle.fontSize === sz
                                ? "bg-sky-700 text-white font-bold"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Font Weight:</label>
                      <select
                        value={currentFieldStyle.fontWeight ?? ""}
                        onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "fontWeight", e.target.value || undefined)}
                        className="w-full text-xs rounded border border-slate-200 px-2 py-1"
                      >
                        <option value="">Default</option>
                        <option value="400">Regular (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semibold (600)</option>
                        <option value="700">Bold (700)</option>
                        <option value="800">Extra Bold (800)</option>
                        <option value="900">Black (900)</option>
                      </select>

                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[11px] font-bold text-slate-700">Letter Spacing:</label>
                          {currentFieldStyle.letterSpacing !== undefined && currentFieldStyle.letterSpacing !== "" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateFieldStyle(selectedTargetKey, "letterSpacing", undefined)}
                              className="text-[9.5px] text-sky-700 hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {[-0.5, 0, 1, 2, 3].map((ls) => (
                            <button
                              key={ls}
                              type="button"
                              onClick={() => handleUpdateFieldStyle(selectedTargetKey, "letterSpacing", ls === 0 ? "" : ls)}
                              className={`flex-1 py-0.5 text-[9.5px] font-mono rounded ${
                                String(currentFieldStyle.letterSpacing) === String(ls) || (!currentFieldStyle.letterSpacing && ls === 0)
                                  ? "bg-sky-700 text-white font-bold"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {ls > 0 ? `+${ls}` : ls}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brand Color Swatches */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">Brand Color Palette:</span>
                      {currentFieldStyle.textColor && (
                        <button
                          type="button"
                          onClick={() => handleUpdateFieldStyle(selectedTargetKey, "textColor", undefined)}
                          className="text-[10px] text-sky-700 hover:underline font-bold"
                        >
                          Clear Color
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {BRAND_PRESET_COLORS.map((clr) => {
                        const isClrSelected = currentFieldStyle.textColor?.toLowerCase() === clr.hex.toLowerCase();
                        return (
                          <button
                            key={clr.hex}
                            type="button"
                            onClick={() => handleUpdateFieldStyle(selectedTargetKey, "textColor", clr.hex)}
                            className={`w-6 h-6 rounded-md shadow-xs border transition-all flex items-center justify-center ${
                              isClrSelected
                                ? "ring-2 ring-sky-500 ring-offset-1 scale-110 border-white"
                                : "border-slate-300 hover:scale-105"
                            }`}
                            style={{ backgroundColor: clr.hex }}
                            title={`${clr.label} (${clr.hex})`}
                          >
                            {isClrSelected && <Icon name="LuCheck" size={12} className="text-white drop-shadow-sm" />}
                          </button>
                        );
                      })}
                      <div className="flex items-center gap-1 ml-auto">
                        <input
                          type="color"
                          value={currentFieldStyle.textColor || "#0b3b60"}
                          onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "textColor", e.target.value)}
                          className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                          title="Pick custom color"
                        />
                        <input
                          type="text"
                          value={currentFieldStyle.textColor ?? ""}
                          placeholder="#0b3b60"
                          onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "textColor", e.target.value || undefined)}
                          className="w-20 text-[10.5px] font-mono rounded border border-slate-200 px-1.5 py-1 text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom Text Override */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] font-bold text-slate-700">Custom Text Override (Optional):</label>
                      {currentFieldStyle.customText && (
                        <button
                          type="button"
                          onClick={() => handleUpdateFieldStyle(selectedTargetKey, "customText", "")}
                          className="text-[10px] text-red-600 hover:underline font-bold"
                        >
                          Clear Override
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={currentFieldStyle.customText ?? ""}
                      placeholder="Leave empty for default hospital / system value"
                      onChange={(e) => handleUpdateFieldStyle(selectedTargetKey, "customText", e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* ── 📋 COMPLETE DATA ELEMENTS CATALOG WITH SELECT & MOVE ── */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      All Hospital Slip Data Elements ({filteredTargets.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Click <strong>any row</strong> to select &amp; position it. Click <strong>Active / Inactive</strong> to toggle visibility.
                    </p>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter data..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-40 text-xs rounded-lg border border-slate-200 pl-7 pr-2 py-1 bg-slate-50 focus:bg-white"
                    />
                    <Icon name="LuSearch" size={13} className="absolute left-2 top-2 text-slate-400" />
                  </div>
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDataCategoryFilter("all")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      dataCategoryFilter === "all"
                        ? "bg-slate-900 text-white font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({SHARED_ELEMENT_TARGETS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDataCategoryFilter("header")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      dataCategoryFilter === "header"
                        ? "bg-sky-700 text-white font-bold"
                        : "bg-sky-50 text-sky-800 hover:bg-sky-100"
                    }`}
                  >
                    🏥 Header &amp; Codes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDataCategoryFilter("demographics")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      dataCategoryFilter === "demographics"
                        ? "bg-indigo-700 text-white font-bold"
                        : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                    }`}
                  >
                    👤 Demographics
                  </button>
                  <button
                    type="button"
                    onClick={() => setDataCategoryFilter("footer")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      dataCategoryFilter === "footer"
                        ? "bg-slate-700 text-white font-bold"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    📜 Footer &amp; Signatures
                  </button>
                </div>

                {/* Data Items List */}
                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredTargets.map((target) => {
                    const isSelected = selectedTargetKey === target.key;
                    const isActive = isElementActiveOnSlip(target.key, selectedSlipType, settings);
                    const targetStyle = settings.fieldStyles?.[target.key] || {};
                    const hasOffset = Number(targetStyle.offsetX || 0) !== 0 || Number(targetStyle.offsetY || 0) !== 0;

                    return (
                      <div
                        key={target.key}
                        onClick={() => setSelectedTargetKey(target.key)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-sky-50/80 border-sky-400 ring-2 ring-sky-300 shadow-sm"
                            : isActive
                            ? "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                            : "bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? "bg-sky-600" : isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-extrabold text-slate-800 truncate">
                                  {target.name}
                                </span>
                                {hasOffset && (
                                  <span className="text-[9px] font-mono px-1 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                    X:{targetStyle.offsetX || 0} Y:{targetStyle.offsetY || 0}
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="text-[8.5px] font-extrabold px-1.5 rounded bg-sky-600 text-white">
                                    SELECTED
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 line-clamp-1">
                                {target.desc}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons on the Right */}
                          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedTargetKey(target.key)}
                              className={`px-2 py-1 text-[10.5px] font-bold rounded flex items-center gap-1 transition-all ${
                                isSelected
                                  ? "bg-sky-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                              title="Select element to move"
                            >
                              <Icon name="LuMove" size={11} /> Move
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(target.key)}
                              className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg flex items-center gap-1 shadow-xs transition-all ${
                                isActive
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-slate-200 hover:bg-slate-300 text-slate-600 line-through"
                              }`}
                              title={`Toggle visibility on ${currentSlipMeta.label}`}
                            >
                              <Icon name={isActive ? "LuCheck" : "LuEyeOff"} size={11} />
                              <span>{isActive ? "Active" : "Inactive"}</span>
                            </button>
                          </div>
                        </div>

                        {/* If this row is selected, show an inline mini-stepper bar for instant nudging */}
                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-sky-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-[10.5px] font-bold text-sky-900">
                              Quick Shift:
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono text-slate-500 mr-1">X:</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateFieldStyle(target.key, "offsetX", (Number(targetStyle.offsetX) || 0) - 5);
                                }}
                                className="px-1.5 py-0.5 text-[9.5px] font-bold bg-white border border-slate-300 rounded hover:bg-slate-100"
                              >
                                -5px
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateFieldStyle(target.key, "offsetX", 0);
                                }}
                                className="px-1.5 py-0.5 text-[9.5px] font-bold bg-sky-100 text-sky-800 border border-sky-300 rounded hover:bg-sky-200"
                              >
                                0
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateFieldStyle(target.key, "offsetX", (Number(targetStyle.offsetX) || 0) + 5);
                                }}
                                className="px-1.5 py-0.5 text-[9.5px] font-bold bg-white border border-slate-300 rounded hover:bg-slate-100"
                              >
                                +5px
                              </button>

                              <span className="text-[10px] font-mono text-slate-500 ml-2 mr-1">Y:</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateFieldStyle(target.key, "offsetY", (Number(targetStyle.offsetY) || 0) - 5);
                                }}
                                className="px-1.5 py-0.5 text-[9.5px] font-bold bg-white border border-slate-300 rounded hover:bg-slate-100"
                              >
                                -5px
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateFieldStyle(target.key, "offsetY", 0);
                                }}
                                className="px-1.5 py-0.5 text-[9.5px] font-bold bg-sky-100 text-sky-800 border border-sky-300 rounded hover:bg-sky-200"
                              >
                                0
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateFieldStyle(target.key, "offsetY", (Number(targetStyle.offsetY) || 0) + 5);
                                }}
                                className="px-1.5 py-0.5 text-[9.5px] font-bold bg-white border border-slate-300 rounded hover:bg-slate-100"
                              >
                                +5px
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 2: HOSPITAL BRAND SETTINGS ══════════════ */}
          {activeTab === "hospital" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hospital Branding &amp; Details</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetKey("header.hospitalName");
                    setActiveTab("data-designer");
                  }}
                  className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1"
                >
                  <Icon name="LuSlidersHorizontal" size={13} /> Position in Designer
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Hospital Legal Name:</label>
                <input
                  type="text"
                  value={settings.hospital?.name || ""}
                  onChange={(e) => handleUpdate("hospital.name", e.target.value)}
                  className="mt-1 w-full text-xs font-bold rounded-md border border-slate-200 px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Subtitle / Specialty:</label>
                <input
                  type="text"
                  value={settings.hospital?.subtitle || ""}
                  onChange={(e) => handleUpdate("hospital.subtitle", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Tagline / Slogan:</label>
                <input
                  type="text"
                  value={settings.hospital?.slogan || ""}
                  onChange={(e) => handleUpdate("hospital.slogan", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 italic"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Registration Number:</label>
                  <input
                    type="text"
                    value={settings.hospital?.registrationNo || ""}
                    onChange={(e) => handleUpdate("hospital.registrationNo", e.target.value)}
                    className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Emergency Phone:</label>
                  <input
                    type="text"
                    value={settings.hospital?.emergencyPhone || ""}
                    onChange={(e) => handleUpdate("hospital.emergencyPhone", e.target.value)}
                    className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 text-red-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Hospital Physical Address:</label>
                  <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-semibold border border-sky-200">
                    Printed on Footer (Header is clean)
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={settings.hospital?.address || ""}
                  onChange={(e) => handleUpdate("hospital.address", e.target.value)}
                  placeholder="Street, City, State, PIN code"
                  className="w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Hospital Phone:</label>
                  <input
                    type="text"
                    value={settings.hospital?.phone || ""}
                    onChange={(e) => handleUpdate("hospital.phone", e.target.value)}
                    className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Email Address:</label>
                  <input
                    type="email"
                    value={settings.hospital?.email || ""}
                    onChange={(e) => handleUpdate("hospital.email", e.target.value)}
                    className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block mb-1">Hospital Logo:</label>
                <div className="flex items-center gap-3">
                  {settings.hospital?.logoUrl && (
                    <img
                      src={settings.hospital.logoUrl}
                      alt="Logo preview"
                      className="h-10 max-w-[100px] object-contain border border-slate-200 rounded p-1 bg-white"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 3: POLICIES, SIGNATURES & STAMP ══════════════ */}
          {activeTab === "footer" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Footer Policies &amp; Signatures</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetKey("signatures.doctor");
                    setActiveTab("data-designer");
                  }}
                  className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1"
                >
                  <Icon name="LuSlidersHorizontal" size={13} /> Position in Designer
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Policies Box Title:</label>
                <input
                  type="text"
                  value={settings.footer?.termsTitle || ""}
                  onChange={(e) => handleUpdate("footer.termsTitle", e.target.value)}
                  className="mt-1 w-full text-xs font-semibold rounded-md border border-slate-200 px-2.5 py-1.5"
                />
              </div>

              {/* Terms Items List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Hospital Rules &amp; Patient Instructions:</label>
                {(settings.footer?.termsItems || []).map((term, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{idx + 1}.</span>
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => {
                        const next = [...(settings.footer?.termsItems || [])];
                        next[idx] = e.target.value;
                        handleUpdate("footer.termsItems", next);
                      }}
                      className="flex-1 text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (settings.footer?.termsItems || []).filter((_, i) => i !== idx);
                        handleUpdate("footer.termsItems", next);
                      }}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Icon name="LuTrash2" size={13} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = [...(settings.footer?.termsItems || []), "New hospital guideline or patient notice."];
                    handleUpdate("footer.termsItems", next);
                  }}
                  className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 pt-1"
                >
                  <Icon name="LuPlus" size={13} /> Add Rule / Notice
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Footer Phone &amp; Helpline Number:</label>
                <input
                  type="text"
                  value={settings.footer?.helpline || ""}
                  onChange={(e) => handleUpdate("footer.helpline", e.target.value)}
                  placeholder="24x7 Helpline: +91 7388660408 • Emergency Trauma: +91 9811223344"
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Footer Physical Address:</label>
                <input
                  type="text"
                  value={settings.footer?.address ?? (settings.hospital?.address || "")}
                  onChange={(e) => handleUpdate("footer.address", e.target.value)}
                  placeholder="Hospital Address Line in Footer"
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Recovery Wishes / Disclaimer:</label>
                <input
                  type="text"
                  value={settings.footer?.disclaimer || ""}
                  onChange={(e) => handleUpdate("footer.disclaimer", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 italic text-slate-600"
                />
              </div>

              {/* Signatures & Stamp Titles */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Signatures &amp; Hospital Stamp Titles</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">Doctor Signature</span>
                    <input
                      type="text"
                      value={settings.footer?.signatures?.doctor?.title || ""}
                      onChange={(e) => handleUpdate("footer.signatures.doctor.title", e.target.value)}
                      className="w-full text-xs rounded border border-slate-200 px-2 py-1"
                      placeholder="Title"
                    />
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">Nurse Signature</span>
                    <input
                      type="text"
                      value={settings.footer?.signatures?.nurse?.title || ""}
                      onChange={(e) => handleUpdate("footer.signatures.nurse.title", e.target.value)}
                      className="w-full text-xs rounded border border-slate-200 px-2 py-1"
                      placeholder="Title"
                    />
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">Attendant Signature</span>
                    <input
                      type="text"
                      value={settings.footer?.signatures?.attendant?.title || ""}
                      onChange={(e) => handleUpdate("footer.signatures.attendant.title", e.target.value)}
                      className="w-full text-xs rounded border border-slate-200 px-2 py-1"
                      placeholder="Title"
                    />
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">Official Stamp</span>
                    <input
                      type="text"
                      value={settings.footer?.signatures?.stamp?.title || ""}
                      onChange={(e) => handleUpdate("footer.signatures.stamp.title", e.target.value)}
                      className="w-full text-xs rounded border border-slate-200 px-2 py-1"
                      placeholder="Title"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 4: SLIP TITLES & BADGES ══════════════ */}
          {activeTab === "slips" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Document Titles &amp; Copy Badges Per Slip
                  </h3>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    Customize the exact printed title and copy badge for each slip type.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {SLIP_TYPES.filter((s) => s.id !== "all").map((st) => {
                  const slipCfg = settings.slipConfigs?.[st.id] || {};
                  return (
                    <div key={st.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800">{st.label}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-sky-800 rounded border border-slate-200">
                          {st.badge}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-600 block mb-0.5">Printed Title:</label>
                          <input
                            type="text"
                            value={slipCfg.title ?? st.defaultTitle}
                            onChange={(e) => handleUpdate(`slipConfigs.${st.id}.title`, e.target.value)}
                            className="w-full text-xs rounded border border-slate-300 px-2 py-1 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-600 block mb-0.5">Copy Badge:</label>
                          <input
                            type="text"
                            value={slipCfg.copyBadge ?? st.defaultCopy}
                            onChange={(e) => handleUpdate(`slipConfigs.${st.id}.copyBadge`, e.target.value)}
                            className="w-full text-xs rounded border border-slate-300 px-2 py-1 font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real-Time WYSIWYG Live Preview with High-Zoom Precision (7 cols) */}
        <div className="xl:col-span-7 sticky top-4 space-y-3">
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name="LuEye" size={15} className="text-sky-400" />
              <span>Live Preview: {currentSlipMeta.label}</span>
            </div>

            {/* High-Zoom Controls: 50% to 200% */}
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
              <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewZoom(100)}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${previewZoom === 100 ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(150)}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${previewZoom === 150 ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                >
                  150%
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(200)}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${previewZoom === 200 ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                >
                  200%
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="bg-slate-200/90 p-4 rounded-2xl border border-slate-300 shadow-inner overflow-auto max-h-[82vh] flex justify-center">
            <div
              style={{
                width: "210mm",
                minHeight: "297mm",
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.12s ease",
              }}
              className="bg-white shadow-2xl rounded-sm p-4 text-slate-900 border border-slate-300 relative select-none"
            >
              {/* Active Inspected Element Badge */}
              <div className="absolute top-2 right-2 bg-sky-950/90 text-white text-[9.5px] font-bold px-2.5 py-1 rounded shadow-sm z-10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                <span>
                  Active Target: <strong>{currentTargetMeta.name}</strong>
                </span>
                <span className="font-mono text-[9px] text-sky-200">
                  (X: {Number(currentFieldStyle.offsetX) || 0}px, Y: {Number(currentFieldStyle.offsetY) || 0}px)
                </span>
              </div>

              {/* Render Preview iframe */}
              <iframe
                ref={iframeRef}
                key={`iframe-${selectedSlipType}`}
                title="Master Shared Header & Footer Live Preview"
                srcDoc={previewHtml}
                className="w-full border-none pointer-events-auto"
                style={{
                  height: "285mm",
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
