import React, { useEffect, useMemo, useState, useRef } from "react";
import Icon from "../../components/common/Icon.jsx";
import settingsService from "../../api/services/settingsService.js";
import {
  DEFAULT_IPD_ADMISSION_SETTINGS,
  IPD_ADMISSION_SETTINGS_KEY,
  SAMPLE_IPD_ADMISSION_DATA,
  COLOR_PALETTES,
  FONT_FAMILIES,
  ELEMENT_DEFINITIONS,
  FIELD_TARGETS,
  cloneIPDAdmissionSettings,
  mergeIPDAdmissionSettings,
} from "./ipdAdmissionPrintConfig.js";
import { IPDAdmissionPrintHandler } from "./IPDAdmissionPrintHandler.js";
import { loadSharedPrintSettings, saveSharedPrintSettings } from "./sharedPrintConfig.js";

const GROUPS = [
  { key: "inspector", title: "Moveable Element Inspector", icon: "LuSlidersHorizontal" },
  { key: "admission", title: "Clinical & Admission Details", icon: "LuClipboardList" },
  { key: "financial", title: "Fee & Advance Deposit", icon: "LuIndianRupee" },
  { key: "patient", title: "Patient Demographics", icon: "LuUserRound" },
  { key: "terms", title: "Terms & Conditions Metadata", icon: "LuAlignLeft" },
  { key: "hospital", title: "Hospital & Letterhead", icon: "LuBuilding2" },
  { key: "header", title: "Ticket Header & Barcode", icon: "LuHeading" },
  { key: "signatures", title: "Signatures & Official Stamp", icon: "LuFileSignature" },
  { key: "page", title: "Page & Layout Geometry", icon: "LuPalette" },
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

function FieldRow({ path, field, onUpdate, onInspect }) {
  if (!field) return null;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(130px,200px)_66px_34px] items-center gap-2 border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs font-medium text-slate-700 truncate">{field.label}</span>
      <input
        type="text"
        aria-label={`${field.label} print label`}
        value={field.label}
        onChange={(e) => onUpdate(`${path}.label`, e.target.value)}
        className="min-w-0 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-emerald-600 focus:outline-none"
      />
      <label className="flex items-center justify-end gap-1.5 text-[11px] text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          checked={field.show !== false}
          onChange={(e) => onUpdate(`${path}.show`, e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
        />
        <span>Print</span>
      </label>
      {onInspect && (
        <button
          type="button"
          onClick={onInspect}
          title="Inspect and align this field"
          className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition-all"
        >
          <Icon name="LuSlidersHorizontal" size={13} />
        </button>
      )}
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
        className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
      />
      <span>Enable {title || "Section"}</span>
    </label>
  );
}

export default function IPDAdmissionPrintSettings() {
  const [settings, setSettings] = useState(DEFAULT_IPD_ADMISSION_SETTINGS);
  const [activeGroup, setActiveGroup] = useState("inspector");
  const [selectedTargetKey, setSelectedTargetKey] = useState("admission.doctor");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);
  const iframeRef = useRef(null);

  // Load saved settings from database
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [ipdData, sharedData] = await Promise.all([
          settingsService.getSetting(IPD_ADMISSION_SETTINGS_KEY).catch(() => null),
          loadSharedPrintSettings().catch(() => null),
        ]);
        if (mounted) {
          const merged = mergeIPDAdmissionSettings(DEFAULT_IPD_ADMISSION_SETTINGS, {
            ...(ipdData || {}),
            ...(sharedData || {}),
            useSharedHeaderFooter: true,
            hospital: { ...(ipdData?.hospital || {}), ...(sharedData?.hospital || {}) },
            footer: { ...(ipdData?.footer || {}), ...(sharedData?.footer || {}) },
            fieldStyles: { ...(ipdData?.fieldStyles || {}), ...(sharedData?.fieldStyles || {}) },
          });
          setSettings(merged);
        }
      } catch (err) {
        console.warn("Could not fetch IPD admission settings:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for clicks inside the preview iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === "SELECT_TARGET" && e.data?.key) {
        setSelectedTargetKey(e.data.key);
        setActiveGroup("inspector");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleUpdate = (path, val) => {
    setSettings((prev) => setPath(prev, path, val));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatus(null);
      await settingsService.updateSetting(IPD_ADMISSION_SETTINGS_KEY, settings);
      setStatus({
        type: "success",
        message: "IPD Admission Ticket settings saved successfully to PostgreSQL database! All inpatient counters will now use this configuration.",
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
    if (window.confirm("Reset all IPD Admission Ticket customizations back to factory defaults?")) {
      setSettings(cloneIPDAdmissionSettings(DEFAULT_IPD_ADMISSION_SETTINGS));
    }
  };

  const handleApplyPalette = (paletteKey) => {
    const pal = COLOR_PALETTES[paletteKey];
    if (!pal) return;
    setSettings((prev) => ({
      ...prev,
      elementStyles: {
        ...prev.elementStyles,
        ticketHeader: {
          ...prev.elementStyles?.ticketHeader,
          bgColor: pal.headerBg,
          borderColor: pal.border,
          textColor: pal.primary,
        },
        financialCard: {
          ...prev.elementStyles?.financialCard,
          borderColor: pal.border,
          bgColor: pal.headerBg,
          textColor: pal.primary,
        },
      },
    }));
  };

  const handleTestPrint = () => {
    IPDAdmissionPrintHandler.printAdmissionTicket(SAMPLE_IPD_ADMISSION_DATA, settings);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdate("hospital.logoUrl", reader.result);
      handleUpdate("hospital.showLogo", true);
      setUploadingLogo(false);
    };
    setUploadingLogo(true);
    reader.readAsDataURL(file);
  };

  // Determine whether current target is an individual field or a card/block
  const isFieldTarget = selectedTargetKey.includes(".");
  const fieldTargetMeta = useMemo(() => {
    if (!isFieldTarget) return null;
    return FIELD_TARGETS.find((f) => f.key === selectedTargetKey) || null;
  }, [isFieldTarget, selectedTargetKey]);

  // Current field style override vs Card style
  const currentFieldStyle = useMemo(() => {
    if (!isFieldTarget) return {};
    return settings.fieldStyles?.[selectedTargetKey] || {};
  }, [isFieldTarget, selectedTargetKey, settings.fieldStyles]);

  const currentCardStyle = useMemo(() => {
    if (isFieldTarget && fieldTargetMeta?.cardKey) {
      return settings.elementStyles?.[fieldTargetMeta.cardKey] || {};
    }
    return settings.elementStyles?.[selectedTargetKey] || {};
  }, [isFieldTarget, fieldTargetMeta, selectedTargetKey, settings.elementStyles]);

  // Sync Header & Footer from Shared Master
  const handleSyncFromSharedMaster = async () => {
    try {
      const shared = await loadSharedPrintSettings();
      if (shared) {
        setSettings((prev) => ({
          ...prev,
          useSharedHeaderFooter: true,
          hospital: { ...(prev.hospital || {}), ...(shared.hospital || {}) },
          footer: { ...(prev.footer || {}), ...(shared.footer || {}) },
          fieldStyles: { ...(prev.fieldStyles || {}), ...(shared.fieldStyles || {}) },
        }));
        setSaveStatus({
          type: "success",
          message: "Synced Hospital Header & Footer from Shared Master!",
        });
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  // Push Header & Footer to Shared Master
  const handlePushToSharedMaster = async () => {
    if (
      window.confirm(
        "Push this Admission Ticket's letterhead and footer settings to the Master Shared Header & Footer?"
      )
    ) {
      try {
        const shared = await loadSharedPrintSettings();
        const updated = {
          ...shared,
          hospital: { ...(shared.hospital || {}), ...(settings.hospital || {}) },
          footer: { ...(shared.footer || {}), ...(settings.footer || {}) },
          fieldStyles: { ...(shared.fieldStyles || {}), ...(settings.fieldStyles || {}) },
        };
        await saveSharedPrintSettings(updated);
        setSaveStatus({
          type: "success",
          message: "Pushed to Shared Master successfully! All slips using master are now updated.",
        });
        setTimeout(() => setSaveStatus(null), 4000);
      } catch (e) {
        console.error("Push error:", e);
      }
    }
  };

  // Nudge stepper (+1px, -1px)
  const handleNudge = (axis, delta) => {
    if (isFieldTarget) {
      const current = Number(currentFieldStyle[axis]) || 0;
      handleUpdate(`fieldStyles.${selectedTargetKey}.${axis}`, current + delta);
    } else {
      const current = Number(currentCardStyle[axis]) || 0;
      handleUpdate(`elementStyles.${selectedTargetKey}.${axis}`, current + delta);
    }
  };

  // Reset selected element/field
  const handleResetCurrentTarget = () => {
    if (isFieldTarget) {
      setSettings((prev) => {
        const next = { ...(prev.fieldStyles || {}) };
        delete next[selectedTargetKey];
        return { ...prev, fieldStyles: next };
      });
    } else {
      const defaultEl = DEFAULT_IPD_ADMISSION_SETTINGS.elementStyles?.[selectedTargetKey];
      if (defaultEl) {
        handleUpdate(`elementStyles.${selectedTargetKey}`, { ...defaultEl });
      }
    }
  };

  // Build live preview HTML with click listeners and horizontal guide lines
  const previewHtml = useMemo(() => {
    return IPDAdmissionPrintHandler.buildAdmissionTicketHTML(SAMPLE_IPD_ADMISSION_DATA, settings, {
      isPreview: true,
      activeTargetKey: selectedTargetKey,
    });
  }, [settings, selectedTargetKey]);

  // Synchronously update preview iframe on every micro-step change
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

  return (
    <div className="space-y-6">
      {/* ── TOP ACTION & TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm">
            <Icon name="LuBed" size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              IPD Admission Ticket Template Designer
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Single-Page Guaranteed
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Granular field-level control with horizontal alignment sync, row baseline guides, and one-page print protection.
            </p>
          </div>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Palettes */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 border-r border-slate-200 pr-3 mr-1">
            <span className="font-semibold text-slate-500">Theme:</span>
            <select
              aria-label="Preset Color Theme"
              onChange={(e) => handleApplyPalette(e.target.value)}
              defaultValue="emerald"
              className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700 focus:outline-none"
            >
              {Object.entries(COLOR_PALETTES).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleReset}
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
            <Icon name="LuPrinter" size={14} /> Test Print (A4)
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Icon name={saving ? "LuLoader" : "LuSave"} size={14} className={saving ? "animate-spin" : ""} />
            {saving ? "Saving to DB..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Save Status Banner */}
      {status && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between ${
            status.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name={status.type === "success" ? "LuCheckCircle2" : "LuAlertCircle"} size={18} />
            <span>{status.message}</span>
          </div>
          <button type="button" onClick={() => setStatus(null)} className="text-xs font-bold opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Shared Master Status & Sync Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-200/90 rounded-xl text-xs">
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
            title="Import the latest Hospital Header and Footer from Shared Master"
          >
            <Icon name="LuDownload" size={13} /> Sync from Master
          </button>
          <button
            type="button"
            onClick={handlePushToSharedMaster}
            className="px-2.5 py-1 text-xs font-bold bg-white text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100 flex items-center gap-1 shadow-xs"
            title="Save this admission ticket's header & footer as the new Shared Master"
          >
            <Icon name="LuUpload" size={13} /> Push to Master
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE: SPLIT GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Group Tabs (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          {/* Navigation Pills */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {GROUPS.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setActiveGroup(g.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeGroup === g.key
                    ? "bg-white text-emerald-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Icon name={g.icon} size={14} />
                <span>{g.title}</span>
              </button>
            ))}
          </div>

          {/* ══════════════ TAB 1: SLIDER & ROW SYNC INSPECTOR ══════════════ */}
          {activeGroup === "inspector" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <Icon name="LuSlidersHorizontal" size={17} />
                    <span>Granular Element & Row Sync Inspector</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCurrentTarget}
                    className="text-[11px] font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Icon name="LuRotateCcw" size={11} /> Reset Style
                  </button>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-1">
                  Click any element or card in the preview on the right, or pick from the dropdown to adjust alignment, row sync, and typography.
                </p>
              </div>

              {/* Target Selector Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Target for Inspection:</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {isFieldTarget ? "🎯 Field Level Override" : "📁 Card / Block Level"}
                  </span>
                </label>
                <select
                  value={selectedTargetKey}
                  onChange={(e) => setSelectedTargetKey(e.target.value)}
                  className="w-full text-xs font-bold text-emerald-950 bg-emerald-50/70 border border-emerald-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <optgroup label="── 🎯 INDIVIDUAL FIELDS (Granular Internal Control) ──">
                    {FIELD_TARGETS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.name} ({f.section})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="── 📁 CARDS & BLOCKS (Macro Control) ──">
                    {ELEMENT_DEFINITIONS.map((el) => (
                      <option key={el.key} value={el.key}>
                        {el.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* ── POSITIONING SLIDERS & MICRO-NUDGE STEPPERS (NO SYNC) ── */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Icon name="LuMove" size={14} className="text-emerald-700" />
                    <span>Independent Element Position</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Free placement (No sibling sync)</span>
                </div>

                {/* Horizontal Position (X Offset) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Horizontal Shift (X Axis):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="-250"
                        max="250"
                        value={(isFieldTarget ? currentFieldStyle.offsetX : currentCardStyle.offsetX) ?? 0}
                        onChange={(e) =>
                          isFieldTarget
                            ? handleUpdate(`fieldStyles.${selectedTargetKey}.offsetX`, Number(e.target.value))
                            : handleUpdate(`elementStyles.${selectedTargetKey}.offsetX`, Number(e.target.value))
                        }
                        className="w-14 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1 py-0.5"
                      />
                      <span className="text-slate-400 text-[11px]">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    step="1"
                    value={(isFieldTarget ? currentFieldStyle.offsetX : currentCardStyle.offsetX) ?? 0}
                    onChange={(e) =>
                      isFieldTarget
                        ? handleUpdate(`fieldStyles.${selectedTargetKey}.offsetX`, Number(e.target.value))
                        : handleUpdate(`elementStyles.${selectedTargetKey}.offsetX`, Number(e.target.value))
                    }
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleNudge("offsetX", -5)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                      -5px
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge("offsetX", -1)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                      -1px
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        isFieldTarget
                          ? handleUpdate(`fieldStyles.${selectedTargetKey}.offsetX`, 0)
                          : handleUpdate(`elementStyles.${selectedTargetKey}.offsetX`, 0)
                      }
                      className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100"
                    >
                      Center 0px
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge("offsetX", 1)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                      +1px
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge("offsetX", 5)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                      +5px
                    </button>
                  </div>
                </div>

                {/* Vertical Position (Y Offset) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Vertical Shift (Y Axis):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="-200"
                        max="200"
                        value={(isFieldTarget ? currentFieldStyle.offsetY : currentCardStyle.offsetY) ?? 0}
                        onChange={(e) =>
                          isFieldTarget
                            ? handleUpdate(`fieldStyles.${selectedTargetKey}.offsetY`, Number(e.target.value))
                            : handleUpdate(`elementStyles.${selectedTargetKey}.offsetY`, Number(e.target.value))
                        }
                        className="w-14 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1 py-0.5"
                      />
                      <span className="text-slate-400 text-[11px]">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    step="1"
                    value={(isFieldTarget ? currentFieldStyle.offsetY : currentCardStyle.offsetY) ?? 0}
                    onChange={(e) =>
                      isFieldTarget
                        ? handleUpdate(`fieldStyles.${selectedTargetKey}.offsetY`, Number(e.target.value))
                        : handleUpdate(`elementStyles.${selectedTargetKey}.offsetY`, Number(e.target.value))
                    }
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleNudge("offsetY", -5)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                      -5px
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge("offsetY", -1)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                      -1px
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        isFieldTarget
                          ? handleUpdate(`fieldStyles.${selectedTargetKey}.offsetY`, 0)
                          : handleUpdate(`elementStyles.${selectedTargetKey}.offsetY`, 0)
                      }
                      className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100"
                    >
                      Baseline 0px
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge("offsetY", 1)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                      +1px
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge("offsetY", 5)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                      +5px
                    </button>
                  </div>
                </div>
              </div>

              {/* Visibility and Custom Text Override */}
              {isFieldTarget && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentFieldStyle.show !== false}
                        onChange={(e) => handleUpdate(`fieldStyles.${selectedTargetKey}.show`, e.target.checked)}
                        className="rounded text-emerald-700"
                      />
                      <span>Visible in Print</span>
                    </label>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Custom Text Override (Optional):</label>
                    <input
                      type="text"
                      value={currentFieldStyle.customText || ""}
                      placeholder="Leave empty for default value"
                      onChange={(e) => handleUpdate(`fieldStyles.${selectedTargetKey}.customText`, e.target.value || undefined)}
                      className="w-full text-xs rounded-md border border-slate-200 px-2 py-1"
                    />
                  </div>
                </div>
              )}

              {/* ── TYPOGRAPHY, COLORS & CARD STYLING ── */}
              <div className="space-y-4 pt-1">
                {/* 3. FONT SIZE & WEIGHT */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Font Size:</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {(isFieldTarget ? currentFieldStyle.fontSize : currentCardStyle.fontSize) || (isFieldTarget ? 11 : 12)}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="24"
                      step="0.5"
                      value={(isFieldTarget ? currentFieldStyle.fontSize : currentCardStyle.fontSize) || (isFieldTarget ? 11 : 12)}
                      onChange={(e) =>
                        isFieldTarget
                          ? handleUpdate(`fieldStyles.${selectedTargetKey}.fontSize`, Number(e.target.value))
                          : handleUpdate(`elementStyles.${selectedTargetKey}.fontSize`, Number(e.target.value))
                      }
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Font Weight:</label>
                    <select
                      value={(isFieldTarget ? currentFieldStyle.fontWeight : currentCardStyle.fontWeight) || "600"}
                      onChange={(e) =>
                        isFieldTarget
                          ? handleUpdate(`fieldStyles.${selectedTargetKey}.fontWeight`, e.target.value)
                          : handleUpdate(`elementStyles.${selectedTargetKey}.fontWeight`, e.target.value)
                      }
                      className="w-full text-xs font-medium border border-slate-200 rounded px-2 py-1 bg-white text-slate-800"
                    >
                      <option value="400">Regular (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi-Bold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra-Bold (800)</option>
                    </select>
                  </div>
                </div>

                {/* 4. TEXT COLOR */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-slate-700">Text Color:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(isFieldTarget ? currentFieldStyle.textColor : currentCardStyle.textColor) || "#0f172a"}
                      onChange={(e) =>
                        isFieldTarget
                          ? handleUpdate(`fieldStyles.${selectedTargetKey}.textColor`, e.target.value)
                          : handleUpdate(`elementStyles.${selectedTargetKey}.textColor`, e.target.value)
                      }
                      className="h-7 w-7 rounded border border-slate-200 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={(isFieldTarget ? currentFieldStyle.textColor : currentCardStyle.textColor) || "#0f172a"}
                      onChange={(e) =>
                        isFieldTarget
                          ? handleUpdate(`fieldStyles.${selectedTargetKey}.textColor`, e.target.value)
                          : handleUpdate(`elementStyles.${selectedTargetKey}.textColor`, e.target.value)
                      }
                      className="w-full text-xs font-mono border border-slate-200 rounded px-2 py-1 uppercase"
                    />
                  </div>
                </div>

                {/* 5. CARD-SPECIFIC CONTROLS (Border, Background & Gradient) */}
                {!isFieldTarget && (
                  <>
                    {/* Border Boldness & Radius */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Border Thickness:</span>
                          <span className="font-mono font-bold text-emerald-700">{currentCardStyle.borderWidth || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="6"
                          step="0.5"
                          value={currentCardStyle.borderWidth || 0}
                          onChange={(e) => handleUpdate(`elementStyles.${selectedTargetKey}.borderWidth`, Number(e.target.value))}
                          className="w-full accent-emerald-700 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Corner Radius:</span>
                          <span className="font-mono font-bold text-emerald-700">{currentCardStyle.borderRadius || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="24"
                          step="1"
                          value={currentCardStyle.borderRadius || 0}
                          onChange={(e) => handleUpdate(`elementStyles.${selectedTargetKey}.borderRadius`, Number(e.target.value))}
                          className="w-full accent-emerald-700 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Background Fill Mode & Gradient */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Background Fill Mode:</span>
                        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleUpdate(`elementStyles.${selectedTargetKey}.bgMode`, "solid")}
                            className={`px-2.5 py-0.5 rounded-md transition-all ${
                              currentCardStyle.bgMode !== "gradient" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500"
                            }`}
                          >
                            Solid Color
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(`elementStyles.${selectedTargetKey}.bgMode`, "gradient")}
                            className={`px-2.5 py-0.5 rounded-md transition-all ${
                              currentCardStyle.bgMode === "gradient" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500"
                            }`}
                          >
                            Color Gradient
                          </button>
                        </div>
                      </div>

                      {currentCardStyle.bgMode === "gradient" ? (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[11px] font-medium text-slate-600">Start Color:</span>
                              <input
                                type="color"
                                value={currentCardStyle.bgColor || "#ffffff"}
                                onChange={(e) => handleUpdate(`elementStyles.${selectedTargetKey}.bgColor`, e.target.value)}
                                className="h-7 w-full rounded border border-slate-200 p-0.5 cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[11px] font-medium text-slate-600">End Color:</span>
                              <input
                                type="color"
                                value={currentCardStyle.bgGradientEnd || "#f8fafc"}
                                onChange={(e) => handleUpdate(`elementStyles.${selectedTargetKey}.bgGradientEnd`, e.target.value)}
                                className="h-7 w-full rounded border border-slate-200 p-0.5 cursor-pointer"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <span>Gradient Angle:</span>
                              <span className="font-mono">{currentCardStyle.bgGradientAngle || 135}°</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              step="5"
                              value={currentCardStyle.bgGradientAngle || 135}
                              onChange={(e) => handleUpdate(`elementStyles.${selectedTargetKey}.bgGradientAngle`, Number(e.target.value))}
                              className="w-full accent-emerald-700 cursor-pointer"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Background Color:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={currentCardStyle.bgColor || "#ffffff"}
                              onChange={(e) => handleUpdate(`elementStyles.${selectedTargetKey}.bgColor`, e.target.value)}
                              className="h-7 w-7 rounded border border-slate-200 p-0.5 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={currentCardStyle.bgColor || "#ffffff"}
                              onChange={(e) => handleUpdate(`elementStyles.${selectedTargetKey}.bgColor`, e.target.value)}
                              className="w-full text-xs font-mono border border-slate-200 rounded px-2 py-1 uppercase"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════════ TAB 2: CLINICAL ADMISSION DETAILS (TARGET 9 FIELDS) ══════════════ */}
          {activeGroup === "admission" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <SectionToggle
                  enabled={settings.admission?.enabled}
                  onChange={(val) => handleUpdate("admission.enabled", val)}
                  title="Clinical Admission Record"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetKey("admissionCard");
                    setActiveGroup("inspector");
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Icon name="LuSlidersHorizontal" size={13} /> Edit in Inspector
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Section Title:</label>
                <input
                  type="text"
                  value={settings.admission?.title || ""}
                  onChange={(e) => handleUpdate("admission.title", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1">
                  Inpatient Admission Fields (Tick/Untick to Print & Customize Label)
                </div>
                <FieldRow
                  path="admission.fields.admissionType"
                  field={settings.admission?.fields?.admissionType}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("admission.admissionType");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="admission.fields.admissionDate"
                  field={settings.admission?.fields?.admissionDate}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("admission.admissionDate");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="admission.fields.department"
                  field={settings.admission?.fields?.department}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("admission.department");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="admission.fields.doctor"
                  field={settings.admission?.fields?.doctor}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("admission.doctor");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="admission.fields.patientProblem"
                  field={settings.admission?.fields?.patientProblem}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("admission.patientProblem");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="admission.fields.duration"
                  field={settings.admission?.fields?.duration}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("admission.duration");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="admission.fields.bedAllotted"
                  field={settings.admission?.fields?.bedAllotted}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("admission.bedAllotted");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="admission.fields.provisionalDiagnosis"
                  field={settings.admission?.fields?.provisionalDiagnosis}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("admission.provisionalDiagnosis");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="admission.fields.referredBy"
                  field={settings.admission?.fields?.referredBy}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("admission.referredBy");
                    setActiveGroup("inspector");
                  }}
                />
              </div>
            </div>
          )}

          {/* ══════════════ TAB 3: FEE & ADVANCE DEPOSIT ══════════════ */}
          {activeGroup === "financial" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <SectionToggle
                  enabled={settings.financial?.enabled}
                  onChange={(val) => handleUpdate("financial.enabled", val)}
                  title="Admission Fee & Advance Deposit"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetKey("financialCard");
                    setActiveGroup("inspector");
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Icon name="LuSlidersHorizontal" size={13} /> Edit in Inspector
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Section Title:</label>
                <input
                  type="text"
                  value={settings.financial?.title || ""}
                  onChange={(e) => handleUpdate("financial.title", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1">
                  Financial Particulars (Tick/Untick to Print & Customize Label)
                </div>
                <FieldRow
                  path="financial.fields.registrationFee"
                  field={settings.financial?.fields?.registrationFee}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("financial.registrationFee");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="financial.fields.advancePayment"
                  field={settings.financial?.fields?.advancePayment}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("financial.advancePayment");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="financial.fields.paymentMode"
                  field={settings.financial?.fields?.paymentMode}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("financial.paymentMode");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="financial.fields.receiptNo"
                  field={settings.financial?.fields?.receiptNo}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("financial.receiptNo");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="financial.fields.amountInWords"
                  field={settings.financial?.fields?.amountInWords}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("financial.amountInWords");
                    setActiveGroup("inspector");
                  }}
                />
              </div>
            </div>
          )}

          {/* ══════════════ TAB 4: PATIENT DEMOGRAPHICS ══════════════ */}
          {activeGroup === "patient" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <SectionToggle
                  enabled={settings.patient?.enabled}
                  onChange={(val) => handleUpdate("patient.enabled", val)}
                  title="Patient Demographics"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetKey("patientCard");
                    setActiveGroup("inspector");
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Icon name="LuSlidersHorizontal" size={13} /> Edit in Inspector
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Section Title:</label>
                <input
                  type="text"
                  value={settings.patient?.title || ""}
                  onChange={(e) => handleUpdate("patient.title", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1">
                  Demographic Fields (Tick/Untick & Edit Labels)
                </div>
                <FieldRow
                  path="patient.fields.name"
                  field={settings.patient?.fields?.name}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("patient.name");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="patient.fields.uhid"
                  field={settings.patient?.fields?.uhid}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("patient.uhid");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="patient.fields.ageGender"
                  field={settings.patient?.fields?.ageGender}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("patient.ageGender");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="patient.fields.mobile"
                  field={settings.patient?.fields?.mobile}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("patient.mobile");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="patient.fields.bloodGroup"
                  field={settings.patient?.fields?.bloodGroup}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("patient.bloodGroup");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="patient.fields.guardian"
                  field={settings.patient?.fields?.guardian}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("patient.guardian");
                    setActiveGroup("inspector");
                  }}
                />
                <FieldRow
                  path="patient.fields.address"
                  field={settings.patient?.fields?.address}
                  onUpdate={handleUpdate}
                  onInspect={() => {
                    setSelectedTargetKey("patient.address");
                    setActiveGroup("inspector");
                  }}
                />
              </div>
            </div>
          )}

          {/* ══════════════ TAB 5: TERMS & CONDITIONS METADATA ══════════════ */}
          {activeGroup === "terms" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <SectionToggle
                  enabled={settings.terms?.enabled}
                  onChange={(val) => handleUpdate("terms.enabled", val)}
                  title="Inpatient Terms & Rules"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetKey("termsCard");
                    setActiveGroup("inspector");
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Icon name="LuSlidersHorizontal" size={13} /> Edit in Inspector
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Section Title:</label>
                <input
                  type="text"
                  value={settings.terms?.title || ""}
                  onChange={(e) => handleUpdate("terms.title", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Terms & Hospital Rules List:</label>
                {(settings.terms?.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{idx + 1}.</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const next = [...(settings.terms?.items || [])];
                        next[idx] = e.target.value;
                        handleUpdate("terms.items", next);
                      }}
                      className="flex-1 text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (settings.terms?.items || []).filter((_, i) => i !== idx);
                        handleUpdate("terms.items", next);
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
                    const next = [...(settings.terms?.items || []), "New hospital policy or admission rule."];
                    handleUpdate("terms.items", next);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-1"
                >
                  <Icon name="LuPlus" size={13} /> Add New Term Rule
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Footer Tagline & Helpline:</label>
                <input
                  type="text"
                  value={settings.terms?.footerTagline || ""}
                  onChange={(e) => handleUpdate("terms.footerTagline", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 text-slate-700"
                />
              </div>
            </div>
          )}

          {/* ══════════════ TAB 6: HOSPITAL & LETTERHEAD ══════════════ */}
          {activeGroup === "hospital" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hospital Letterhead & Identity</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetKey("hospitalHeader");
                    setActiveGroup("inspector");
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Icon name="LuSlidersHorizontal" size={13} /> Edit in Inspector
                </button>
              </div>

              {/* Logo Upload */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {settings.hospital?.showLogo && settings.hospital?.logoUrl ? (
                  <img
                    src={settings.hospital.logoUrl}
                    alt="Hospital Logo"
                    className="h-12 w-28 object-contain bg-white rounded border border-slate-200 p-1"
                  />
                ) : (
                  <div className="h-12 w-28 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-400 font-bold">
                    No Logo
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Hospital Logo Image</label>
                  <div className="flex items-center gap-2">
                    <label className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer text-slate-700">
                      Upload Logo
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.hospital?.showLogo !== false}
                        onChange={(e) => handleUpdate("hospital.showLogo", e.target.checked)}
                        className="h-3.5 w-3.5 rounded text-emerald-700"
                      />
                      <span>Print Logo</span>
                    </label>
                  </div>
                </div>
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
                <label className="text-xs font-bold text-slate-700">Subtitle / Tagline:</label>
                <input
                  type="text"
                  value={settings.hospital?.subtitle || ""}
                  onChange={(e) => handleUpdate("hospital.subtitle", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Registration No:</label>
                  <input
                    type="text"
                    value={settings.hospital?.registrationNo || ""}
                    onChange={(e) => handleUpdate("hospital.registrationNo", e.target.value)}
                    className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">24x7 Emergency Phone:</label>
                  <input
                    type="text"
                    value={settings.hospital?.emergencyPhone || ""}
                    onChange={(e) => handleUpdate("hospital.emergencyPhone", e.target.value)}
                    className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5 text-red-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Address Line:</label>
                <input
                  type="text"
                  value={settings.hospital?.address || ""}
                  onChange={(e) => handleUpdate("hospital.address", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                />
              </div>
            </div>
          )}

          {/* ══════════════ TAB 7: HEADER & BARCODE ══════════════ */}
          {activeGroup === "header" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ticket Title & Barcode Badge</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetKey("ticketHeader");
                    setActiveGroup("inspector");
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Icon name="LuSlidersHorizontal" size={13} /> Edit in Inspector
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Document Main Title:</label>
                <input
                  type="text"
                  value={settings.header?.title || ""}
                  onChange={(e) => handleUpdate("header.title", e.target.value)}
                  className="mt-1 w-full text-xs font-bold rounded-md border border-slate-200 px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Copy Label Badge:</label>
                <input
                  type="text"
                  value={settings.header?.copyType || ""}
                  onChange={(e) => handleUpdate("header.copyType", e.target.value)}
                  className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.header?.showBarcode !== false}
                    onChange={(e) => handleUpdate("header.showBarcode", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                  />
                  <span>Show Barcode</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.header?.showTopUHID !== false}
                    onChange={(e) => handleUpdate("header.showTopUHID", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                  />
                  <span>Show Top UHID</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.header?.showTopAdmissionNo !== false}
                    onChange={(e) => handleUpdate("header.showTopAdmissionNo", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                  />
                  <span>Show Top IPD No</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.header?.showCopyBadge !== false}
                    onChange={(e) => handleUpdate("header.showCopyBadge", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                  />
                  <span>Show Copy Badge</span>
                </label>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 8: SIGNATURES & STAMP ══════════════ */}
          {activeGroup === "signatures" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <SectionToggle
                  enabled={settings.signatures?.enabled}
                  onChange={(val) => handleUpdate("signatures.enabled", val)}
                  title="Signatures & Stamp"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetKey("signaturesCard");
                    setActiveGroup("inspector");
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Icon name="LuSlidersHorizontal" size={13} /> Edit in Inspector
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.signatures?.showDoctor !== false}
                      onChange={(e) => handleUpdate("signatures.showDoctor", e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-700"
                    />
                    <span>Treating Doctor Signature</span>
                  </label>
                  <input
                    type="text"
                    value={settings.signatures?.doctorTitle || ""}
                    onChange={(e) => handleUpdate("signatures.doctorTitle", e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 px-2 py-1"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.signatures?.showNurse !== false}
                      onChange={(e) => handleUpdate("signatures.showNurse", e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-700"
                    />
                    <span>Duty Nursing Officer Signature</span>
                  </label>
                  <input
                    type="text"
                    value={settings.signatures?.nurseTitle || ""}
                    onChange={(e) => handleUpdate("signatures.nurseTitle", e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 px-2 py-1"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.signatures?.showAttendant !== false}
                      onChange={(e) => handleUpdate("signatures.showAttendant", e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-700"
                    />
                    <span>Patient / Attendant Signature</span>
                  </label>
                  <input
                    type="text"
                    value={settings.signatures?.attendantTitle || ""}
                    onChange={(e) => handleUpdate("signatures.attendantTitle", e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 px-2 py-1"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.signatures?.showStamp !== false}
                      onChange={(e) => handleUpdate("signatures.showStamp", e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-700"
                    />
                    <span>Official Hospital Stamp Box</span>
                  </label>
                  <input
                    type="text"
                    value={settings.signatures?.stampTitle || ""}
                    onChange={(e) => handleUpdate("signatures.stampTitle", e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 px-2 py-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 9: PAGE GEOMETRY ══════════════ */}
          {activeGroup === "page" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Page Geometry & Margins</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Paper Size:</label>
                  <select
                    value={settings.page?.size || "A4"}
                    onChange={(e) => handleUpdate("page.size", e.target.value)}
                    className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                  >
                    <option value="A4">A4 (Standard Hospital Sheet)</option>
                    <option value="A5">A5 (Half Sheet)</option>
                    <option value="Letter">US Letter</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Print Margin (mm):</label>
                  <input
                    type="number"
                    min="2"
                    max="15"
                    value={settings.page?.margin ?? 6}
                    onChange={(e) => handleUpdate("page.margin", Number(e.target.value))}
                    className="mt-1 w-full text-xs rounded-md border border-slate-200 px-2.5 py-1.5"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real-Time WYSIWYG Single Page Preview with Guide Lines (7 cols) */}
        <div className="xl:col-span-7 sticky top-4 space-y-3">
          <div className="bg-slate-800 text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name="LuEye" size={15} className="text-emerald-400" />
              <span>Interactive WYSIWYG Preview (Click any field to inspect)</span>
            </div>
            {/* High-Zoom Steppers & Presets (50% to 200%) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.max(50, z - 10))}
                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[11px] font-mono text-emerald-300 min-w-10 text-center">{previewZoom}%</span>
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.min(200, z + 10))}
                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 font-bold"
                title="Zoom In"
              >
                +
              </button>
              <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewZoom(100)}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${previewZoom === 100 ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(150)}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${previewZoom === 150 ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
                >
                  150%
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(200)}
                  className={`px-1.5 py-0.5 text-[10px] rounded ${previewZoom === 200 ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
                >
                  200%
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="bg-slate-200/80 p-4 rounded-2xl border border-slate-300 shadow-inner overflow-auto max-h-[82vh] flex justify-center">
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
              <div className="absolute top-2 right-2 bg-emerald-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm z-10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>
                  Inspecting:{" "}
                  <strong>
                    {isFieldTarget
                      ? fieldTargetMeta?.name || selectedTargetKey
                      : ELEMENT_DEFINITIONS.find((e) => e.key === selectedTargetKey)?.name || selectedTargetKey}
                  </strong>
                </span>
              </div>

              {/* Render Preview iframe with live event messaging */}
              <iframe
                ref={iframeRef}
                title="IPD Admission Ticket Live Preview"
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
