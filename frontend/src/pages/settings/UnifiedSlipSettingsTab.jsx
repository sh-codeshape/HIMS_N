import React, { useState, useEffect, useMemo, useRef } from "react";
import Icon from "../../components/common/Icon.jsx";
import printEngine, { SLIP_SETTINGS_KEYS, slipVersionService } from "../../services/printEngine.js";
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

  // Version management states (isolated per slip type)
  const [savedVersions, setSavedVersions] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [versionNameInput, setVersionNameInput] = useState("");
  const [isPermanentInput, setIsPermanentInput] = useState(false);
  const [versionsFilter, setVersionsFilter] = useState("all"); // "all" | "permanent" | "recent"

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

  // Load saved versions for this slip type on mount or tab change
  useEffect(() => {
    slipVersionService
      .getVersions(normType)
      .then((v) => {
        setSavedVersions(v || []);
      })
      .catch(() => {});
  }, [normType]);

  const handleOpenSaveModal = () => {
    const count = savedVersions.length;
    const now = new Date();
    const formatted = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + ", " + now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    setVersionNameInput(`Version ${count + 1} • ${formatted}`);
    setIsPermanentInput(false);
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    try {
      setSaving(true);
      setSaveStatus(null);
      // 1. Save slip settings to DB
      await printEngine.saveSlipSettings(normType, settings);
      // 2. Save version snapshot to slipVersionService
      const result = await slipVersionService.saveVersion(normType, settings, versionNameInput, isPermanentInput);
      setSavedVersions(result.allVersions);
      setShowSaveModal(false);
      setSaveStatus({
        type: "success",
        message: `${slipMeta.label} saved as "${result.newVersion.name}"! Version history updated.`,
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

  const handleRestoreVersion = (version) => {
    if (!version || !version.settings) return;
    setSettings(JSON.parse(JSON.stringify(version.settings)));
    setShowVersionsModal(false);
    setSaveStatus({
      type: "success",
      message: `Restored snapshot "${version.name}"! Live preview updated. Click "Save Settings" if you want to commit changes.`,
    });
    setTimeout(() => setSaveStatus(null), 6000);
  };

  const handleTogglePermanent = async (versionId) => {
    const updated = await slipVersionService.togglePermanent(normType, versionId);
    setSavedVersions(updated);
  };

  const handleDeleteVersion = async (versionId) => {
    const updated = await slipVersionService.deleteVersion(normType, versionId);
    setSavedVersions(updated);
  };

  const handleSyncMaster = async () => {
    try {
      setLoading(true);
      const master = await loadSharedPrintSettings();
      if (master) {
        // 1. Collect all inactive elements from Master
        const masterInacts = new Set([
          ...(master.slipConfigs?.[normType]?.inactiveElements || []),
          ...(master.slipConfigs?.all?.inactiveElements || []),
          ...(master.inactiveElements || []),
        ]);
        for (const [k, v] of Object.entries(master.fieldStyles || {})) {
          if (k.startsWith("header.") && v && v.show === false) {
            masterInacts.add(k);
          }
        }

        // 2. Clean out stale header styles and replace with Master
        const cleanFieldStyles = Object.fromEntries(
          Object.entries(settings?.fieldStyles || {}).filter(([k]) => !k.startsWith("header."))
        );
        for (const [k, v] of Object.entries(master.fieldStyles || {})) {
          if (k.startsWith("header.")) {
            cleanFieldStyles[k] = { ...v };
          }
        }
        // 2b. Sanitize all patient demographics fields:
        // Strip any corrupted relative offsets (offsetX, offsetY) so the 3-column CSS grid aligns perfectly!
        const demographicsKeys = [
          "patient.name", "patient.uhid", "patient.ageGender", "patient.mobile",
          "patient.bloodGroup", "patient.guardian", "patient.address", "patient.payer",
          "patient.doctor", "patient.department", "name", "uhid", "ageGender",
          "mobile", "bloodGroup", "guardian", "address", "payer", "doctor", "department"
        ];
        demographicsKeys.forEach((dk) => {
          if (cleanFieldStyles[dk]) {
            delete cleanFieldStyles[dk].offsetX;
            delete cleanFieldStyles[dk].offsetY;
            delete cleanFieldStyles[dk].display;
          }
        });

        // 3. Preserve non-header inactives from current slip (like opd.rxNotes, terms.card, etc.)
        const existingNonHeaderInacts = (
          settings?.slipConfigs?.[normType]?.inactiveElements ||
          settings?.inactiveElements ||
          []
        ).filter((k) => !k.startsWith("header."));

        const resolvedInacts = Array.from(new Set([...masterInacts, ...existingNonHeaderInacts]));

        // Ensure all inactive elements have show: false
        resolvedInacts.forEach((k) => {
          if (!cleanFieldStyles[k]) cleanFieldStyles[k] = {};
          cleanFieldStyles[k].show = false;
        });

        const synced = {
          ...settings,
          useSharedHeaderFooter: true,
          hospital: { ...(master.hospital || {}) },
          header: {
            ...(settings?.header || {}),
            ...(master.header || {}),
            title: settings?.header?.title || master.slipConfigs?.[normType]?.title || settings?.slipConfigs?.[normType]?.title,
            copyType: settings?.header?.copyType || master.slipConfigs?.[normType]?.copyBadge || settings?.slipConfigs?.[normType]?.copyBadge,
          },
          footer: {
            ...(settings?.footer || {}),
            ...(master.footer || {}),
          },
          patientDemographics: { ...(master.patientDemographics || {}) },
          fieldStyles: cleanFieldStyles,
          slipConfigs: {
            ...(settings?.slipConfigs || {}),
            [normType]: {
              ...(settings?.slipConfigs?.[normType] || {}),
              title: settings?.slipConfigs?.[normType]?.title || master.slipConfigs?.[normType]?.title,
              copyBadge: settings?.slipConfigs?.[normType]?.copyBadge || master.slipConfigs?.[normType]?.copyBadge,
              inactiveElements: resolvedInacts,
            },
          },
        };

        // Persist to DB directly and update cache!
        await printEngine.saveSlipSettings(normType, synced);
        setSettings(synced);
        setSaveStatus({
          type: "success",
          message: "Synced and saved Hospital Header & Letterhead from Master Shared Designer!",
        });
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } catch (e) {
      console.error("Sync error:", e);
      setSaveStatus({
        type: "error",
        message: e?.message || "Failed to sync from Master.",
      });
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

  // ── Universal Section Visibility Helpers ──
  const isTermsActive = useMemo(() => {
    if (!settings) return true;
    const inactives = settings.slipConfigs?.[normType]?.inactiveElements || [];
    if (inactives.includes("terms.card")) return false;
    if (settings.fieldStyles?.["terms.card"]?.show === false) return false;
    if (settings[normType]?.showTerms === false) return false;
    if (settings.opd?.showTerms === false && normType === "opd") return false;
    return true;
  }, [settings, normType]);

  const isSignaturesActive = useMemo(() => {
    if (!settings) return true;
    const inactives = settings.slipConfigs?.[normType]?.inactiveElements || [];
    if (inactives.includes("signatures.card")) return false;
    if (settings.fieldStyles?.["signatures.card"]?.show === false) return false;
    if (settings[normType]?.showSignatures === false) return false;
    if (settings.opd?.showSignatures === false && normType === "opd") return false;
    return true;
  }, [settings, normType]);

  const isFooterActive = useMemo(() => {
    if (!settings) return true;
    const inactives = settings.slipConfigs?.[normType]?.inactiveElements || [];
    if (inactives.includes("footer.letterhead")) return false;
    if (settings.fieldStyles?.["footer.letterhead"]?.show === false) return false;
    if (settings.footer?.showLetterheadFooter === false) return false;
    return true;
  }, [settings, normType]);

  const isRxNotesActive = useMemo(() => {
    if (!settings) return true;
    const inactives = settings.slipConfigs?.[normType]?.inactiveElements || [];
    if (inactives.includes("opd.rxNotes")) return false;
    if (settings.opd?.showRxNotes === false) return false;
    return true;
  }, [settings, normType]);

  const toggleTermsSection = (show) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const inactives = new Set(prev.slipConfigs?.[normType]?.inactiveElements || []);
      const termKeys = [
        "terms.card",
        "terms.title",
        "terms.list",
        "terms.helpline",
        "terms.address",
        "terms.footerTagline",
        "terms.disclaimer",
      ];
      if (show) {
        termKeys.forEach((k) => inactives.delete(k));
      } else {
        termKeys.forEach((k) => inactives.add(k));
      }
      return {
        ...prev,
        [normType]: {
          ...(prev[normType] || {}),
          showTerms: show,
        },
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
  };

  const toggleSignaturesSection = (show) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const inactives = new Set(prev.slipConfigs?.[normType]?.inactiveElements || []);
      const sigKeys = [
        "signatures.card",
        "signatures.doctor",
        "signatures.nurse",
        "signatures.attendant",
        "signatures.cashier",
        "signatures.stamp",
      ];
      if (show) {
        sigKeys.forEach((k) => inactives.delete(k));
      } else {
        sigKeys.forEach((k) => inactives.add(k));
      }
      return {
        ...prev,
        [normType]: {
          ...(prev[normType] || {}),
          showSignatures: show,
        },
        opd: {
          ...(prev.opd || {}),
          showSignatures: show,
        },
        fieldStyles: {
          ...(prev.fieldStyles || {}),
          "signatures.card": {
            ...(prev.fieldStyles?.["signatures.card"] || {}),
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
  };

  const toggleHeaderElement = (elementKey, show) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const inactives = new Set(prev.slipConfigs?.[normType]?.inactiveElements || []);
      if (show) {
        inactives.delete(elementKey);
      } else {
        inactives.add(elementKey);
      }
      return {
        ...prev,
        fieldStyles: {
          ...(prev.fieldStyles || {}),
          [elementKey]: {
            ...(prev.fieldStyles?.[elementKey] || {}),
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
  };

  const isHeaderElementActive = (key) => {
    if (!settings) return true;
    const inactives = settings.slipConfigs?.[normType]?.inactiveElements || [];
    if (inactives.includes(key)) return false;
    if (settings.slipConfigs?.all?.inactiveElements?.includes(key)) return false;
    if (settings.inactiveElements?.includes(key)) return false;
    return settings.fieldStyles?.[key]?.show !== false;
  };

  const updateHeaderFontSize = (size) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fieldStyles: {
          ...(prev.fieldStyles || {}),
          "header.hospitalName": {
            ...(prev.fieldStyles?.["header.hospitalName"] || {}),
            fontSize: size,
          },
        },
      };
    });
  };

  const toggleSignatureRole = (roleKey, show) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const inactives = new Set(prev.slipConfigs?.[normType]?.inactiveElements || []);
      if (show) {
        inactives.delete(roleKey);
      } else {
        inactives.add(roleKey);
      }
      return {
        ...prev,
        fieldStyles: {
          ...(prev.fieldStyles || {}),
          [roleKey]: {
            ...(prev.fieldStyles?.[roleKey] || {}),
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
  };

  const toggleFooterSection = (show) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const inactives = new Set(prev.slipConfigs?.[normType]?.inactiveElements || []);
      if (show) {
        inactives.delete("footer.letterhead");
      } else {
        inactives.add("footer.letterhead");
      }
      return {
        ...prev,
        footer: {
          ...(prev.footer || {}),
          showLetterheadFooter: show,
        },
        fieldStyles: {
          ...(prev.fieldStyles || {}),
          "footer.letterhead": {
            ...(prev.fieldStyles?.["footer.letterhead"] || {}),
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
  };

  const toggleRxNotes = (show) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const inactives = new Set(prev.slipConfigs?.[normType]?.inactiveElements || []);
      if (show) {
        inactives.delete("opd.rxNotes");
      } else {
        inactives.add("opd.rxNotes");
      }
      return {
        ...prev,
        opd: {
          ...(prev.opd || {}),
          showRxNotes: show,
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
            onClick={() => setShowVersionsModal(true)}
            className="px-3 py-1.5 text-xs font-bold bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Retrieve or revert to last saved versions"
          >
            <Icon name="LuHistory" size={14} className="text-indigo-600" />
            <span>Versions ({savedVersions.length})</span>
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
            onClick={handleOpenSaveModal}
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
                <span>Open in Master Designer with this slip selected</span>
              </button>
            )}
          </div>

          {/* Card 1b: Hospital Header & Letterhead Appearance on this Slip */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Icon name="LuBuilding2" size={16} className="text-sky-700" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  Hospital Header on {slipMeta.label}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                Per-Slip Elements
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-snug">
              Toggle which hospital header elements appear on this slip. Changes update the live preview on the right instantly.
            </p>

            {/* Header Element Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              {[
                { key: "header.card", label: "Hospital Header Box", icon: "LuBuilding2" },
                { key: "header.logo", label: "Hospital Logo", icon: "LuImage" },
                { key: "header.hospitalName", label: "Hospital Name", icon: "LuHeading" },
                { key: "header.subtitle", label: "Subtitle / Specialty", icon: "LuFileText" },
                { key: "header.slogan", label: "Tagline / Slogan", icon: "LuMessageSquare" },
                { key: "header.topWave", label: "Top ECG / Wave Graphic", icon: "LuActivity" },
                { key: "header.regNo", label: "Registration No. Tag", icon: "LuTag" },
                { key: "header.emergencyPhone", label: "24x7 Emergency Helpline", icon: "LuPhoneCall" },
                { key: "header.address", label: "Header Address Line", icon: "LuMapPin" },
                { key: "header.phoneEmail", label: "Phone & Email", icon: "LuPhone" },
                { key: "header.accreditations", label: "Accreditation Badges", icon: "LuAward" },
              ].map((item) => {
                const active = isHeaderElementActive(item.key);
                return (
                  <label
                    key={item.key}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      active
                        ? "bg-sky-50/70 border-sky-300 text-sky-950 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => toggleHeaderElement(item.key, e.target.checked)}
                      className="rounded text-sky-600 w-3.5 h-3.5"
                    />
                    <span className="truncate">{item.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Quick Header Font Size Preset */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-700">Hospital Name Size:</span>
              <div className="flex items-center gap-1">
                {[16, 18, 19, 22, 24, 26].map((sz) => {
                  const currentSz = Number(settings?.fieldStyles?.["header.hospitalName"]?.fontSize) || (normType === "ipd_receipt" ? 19 : 24);
                  const isCurrent = currentSz === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => updateHeaderFontSize(sz)}
                      className={`px-2 py-0.5 text-[11px] rounded font-bold transition-all ${
                        isCurrent
                          ? "bg-sky-700 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {sz}px
                    </button>
                  );
                })}
              </div>
            </div>
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
              <div className="space-y-4">
                {/* 1. UPI Payment QR Code Toggle & Input */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.billing?.showUpiQr === true || settings.bankDetails?.showUpiQr === true}
                      onChange={(e) => {
                        const show = e.target.checked;
                        updateSection("billing", "showUpiQr", show);
                        updateSection("bankDetails", "showUpiQr", show);
                      }}
                      className="rounded text-sky-600 w-4 h-4"
                    />
                    <span>Show UPI Payment QR Code on Bill</span>
                  </label>
                  {(settings.billing?.showUpiQr === true || settings.bankDetails?.showUpiQr === true) && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        UPI ID for Instant QR Scan &amp; Pay
                      </label>
                      <input
                        type="text"
                        value={settings.billing?.upiId ?? settings.bankDetails?.upiId ?? ""}
                        onChange={(e) => {
                          updateSection("billing", "upiId", e.target.value);
                          updateSection("bankDetails", "upiId", e.target.value);
                        }}
                        placeholder="e.g. hospitalname@okhdfcbank"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* 2. GST / Tax Breakdown Toggle */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.billing?.showTax === true || (settings.gst?.mode && settings.gst?.mode !== "exempt")}
                      onChange={(e) => {
                        const show = e.target.checked;
                        updateSection("billing", "showTax", show);
                        updateSection("gst", "showTax", show);
                        if (!show) {
                          updateSection("billing", "gstMode", "exempt");
                          updateSection("gst", "mode", "exempt");
                        } else {
                          updateSection("billing", "gstMode", "exclusive");
                          updateSection("gst", "mode", "exclusive");
                        }
                      }}
                      className="rounded text-sky-600 w-4 h-4"
                    />
                    <span>Show GST / Tax Line on Bill</span>
                  </label>
                  {(settings.billing?.showTax === true || (settings.gst?.mode && settings.gst?.mode !== "exempt")) && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tax Calculation Mode</label>
                      <select
                        value={settings.billing?.gstMode || settings.gst?.mode || "exclusive"}
                        onChange={(e) => {
                          updateSection("billing", "gstMode", e.target.value);
                          updateSection("gst", "mode", e.target.value);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      >
                        <option value="exclusive">5% GST Added (Exclusive)</option>
                        <option value="inclusive">5% GST Included in Rate</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. Section Toggles */}
                <div className="space-y-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.charges?.groupByDepartment !== false}
                      onChange={(e) => {
                        updateSection("charges", "groupByDepartment", e.target.checked);
                        updateSection("billing", "groupCharges", e.target.checked);
                      }}
                      className="rounded text-sky-600 w-4 h-4"
                    />
                    <span>Group Charges by Category (ICU, Pharmacy, Lab, Nursing)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.settlement?.showPaymentBreakdown !== false}
                      onChange={(e) => {
                        updateSection("settlement", "showPaymentBreakdown", e.target.checked);
                        updateSection("billing", "paymentBreakdown", e.target.checked);
                      }}
                      className="rounded text-sky-600 w-4 h-4"
                    />
                    <span>Show Deposits Ledger &amp; Advance Reconciliation Table</span>
                  </label>
                </div>

                {/* 4. Editable Financial Summary Labels (Simple / Light English) */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Icon name="LuPencilLine" size={13} className="text-sky-700" />
                    <span className="text-xs font-bold text-slate-800">Customize Financial Labels (Light English)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Total Amount Label</label>
                      <input
                        type="text"
                        value={settings.billing?.totalLabel ?? "Total Amount"}
                        onChange={(e) => updateSection("billing", "totalLabel", e.target.value)}
                        placeholder="Total Amount"
                        className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Payable Amount Label</label>
                      <input
                        type="text"
                        value={settings.billing?.payableLabel ?? "Payable Amount"}
                        onChange={(e) => updateSection("billing", "payableLabel", e.target.value)}
                        placeholder="Payable Amount"
                        className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Balance Due Label</label>
                      <input
                        type="text"
                        value={settings.billing?.dueLabel ?? "Balance Due"}
                        onChange={(e) => updateSection("billing", "dueLabel", e.target.value)}
                        placeholder="Balance Due"
                        className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Advance Received Label</label>
                      <input
                        type="text"
                        value={settings.billing?.paidLabel ?? "Advance Received"}
                        onChange={(e) => updateSection("billing", "paidLabel", e.target.value)}
                        placeholder="Advance Received"
                        className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-semibold text-slate-800"
                      />
                    </div>
                  </div>
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

          {/* Card 4: Universal Section Visibility & Print Modules */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Icon name="LuSlidersHorizontal" size={16} className="text-sky-700" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  Section Visibility &amp; Print Modules
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Toggle on / off per slip</span>
            </div>

            <div className="space-y-2.5">
              {/* 1. Hospital Instructions & Policies (Terms List) */}
              <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg hover:border-sky-300 transition-colors">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTermsActive}
                    onChange={(e) => toggleTermsSection(e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      📜 Hospital Instructions &amp; Policies (Terms List)
                    </span>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Visiting rules, attendant pass policy, personal cash/valuables disclaimer &amp; hospital address
                    </span>
                  </div>
                </label>
              </div>

              {/* 2. Signatures & Stamp Block */}
              <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg hover:border-sky-300 transition-colors space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSignaturesActive}
                    onChange={(e) => toggleSignaturesSection(e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      ✍️ Signatures &amp; Official Stamp Box
                    </span>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      Signature columns for consultant doctor, duty nurse, attendant acknowledgment &amp; official stamp
                    </span>
                  </div>
                </label>

                {isSignaturesActive && (
                  <div className="pl-6 pt-2 grid grid-cols-2 gap-2 border-t border-slate-200 text-[11px] text-slate-700">
                    {[
                      { key: "signatures.doctor", label: "Treating Consultant" },
                      { key: "signatures.nurse", label: "Duty Nursing Officer" },
                      { key: "signatures.attendant", label: "Patient / Attendant" },
                      { key: "signatures.cashier", label: "Billing Officer" },
                      { key: "signatures.stamp", label: "Official Stamp Box" },
                    ].map((sig) => {
                      const isActive =
                        !settings.slipConfigs?.[normType]?.inactiveElements?.includes(sig.key) &&
                        settings.fieldStyles?.[sig.key]?.show !== false;
                      return (
                        <label key={sig.key} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => toggleSignatureRole(sig.key, e.target.checked)}
                            className="rounded text-sky-600 w-3.5 h-3.5"
                          />
                          <span>{sig.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Official Letterhead Footer Bar */}
              <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg hover:border-sky-300 transition-colors">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFooterActive}
                    onChange={(e) => toggleFooterSection(e.target.checked)}
                    className="mt-0.5 rounded text-sky-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      🏥 Official Letterhead Contact Footer
                    </span>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      4-column bottom footer: Hospital address, 24x7 helpline, email, website &amp; reg number
                    </span>
                  </div>
                </label>
              </div>

              {/* 4. OPD Clinical Notes Lines (OPD only) */}
              {normType === "opd" && (
                <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg hover:border-sky-300 transition-colors">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRxNotesActive}
                      onChange={(e) => toggleRxNotes(e.target.checked)}
                      className="mt-0.5 rounded text-sky-600 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        🩺 Doctor Rx Notes &amp; Clinical Examination Box
                      </span>
                      <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                        Blank dotted lines for handwritten prescription, vitals, and doctor diagnosis
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
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

      {/* ── SAVE VERSION MODAL ── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-sky-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon name="LuSave" size={18} className="text-sky-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Save Version — {slipMeta.label}</h3>
                  <p className="text-[11px] text-sky-200">Name this snapshot to easily retrieve or revert later</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Version Name / Label
                </label>
                <input
                  type="text"
                  value={versionNameInput}
                  onChange={(e) => setVersionNameInput(e.target.value)}
                  placeholder="e.g. Clean Look - No Policies"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900"
                  autoFocus
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Give this version a recognizable name so you can retrieve it anytime.
                </span>
              </div>

              {/* Permanent Save Checkbox */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPermanentInput}
                    onChange={(e) => setIsPermanentInput(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                      ⭐ Mark as Permanent Save
                    </span>
                    <span className="text-[11px] text-amber-800 leading-snug block mt-0.5">
                      Permanent saves are pinned forever and will NEVER be replaced when recent snapshots exceed 5 versions.
                    </span>
                  </div>
                </label>
              </div>

              {/* Snapshot Summary Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-600">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Current Settings Summary
                </div>
                <div className="flex justify-between">
                  <span>Document Title:</span>
                  <strong className="text-slate-800">{currentTitle}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Hospital Instructions (Policies):</span>
                  <strong className={isTermsActive ? "text-emerald-700" : "text-slate-400"}>
                    {isTermsActive ? "✓ Visible" : "✕ Removed"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Signatures &amp; Stamp:</span>
                  <strong className={isSignaturesActive ? "text-emerald-700" : "text-slate-400"}>
                    {isSignaturesActive ? "✓ Visible" : "✕ Removed"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Letterhead Footer:</span>
                  <strong className={isFooterActive ? "text-emerald-700" : "text-slate-400"}>
                    {isFooterActive ? "✓ Visible" : "✕ Removed"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="px-4 py-1.5 text-xs font-bold text-white bg-sky-900 hover:bg-sky-950 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Icon name={saving ? "LuLoader" : "LuSave"} size={14} className={saving ? "animate-spin" : ""} />
                <span>{saving ? "Saving..." : "Confirm & Save Version"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RETRIEVE / VERSION HISTORY MODAL ── */}
      {showVersionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon name="LuHistory" size={18} className="text-sky-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Saved Versions — {slipMeta.label}</h3>
                  <p className="text-[11px] text-sky-200">
                    Retrieve, inspect, or delete any of the last 5 saved snapshots or marked permanent saves
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVersionsModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            {/* Filter Pills & Quick Actions */}
            <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                {[
                  { id: "all", label: `All (${savedVersions.length})` },
                  { id: "permanent", label: `⭐ Permanent (${savedVersions.filter((v) => v.isPermanent).length})` },
                  { id: "recent", label: `Recent (${savedVersions.filter((v) => !v.isPermanent).length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVersionsFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      versionsFilter === tab.id
                        ? "bg-white text-sky-900 shadow-2xs border border-sky-300"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Keeps last 5 recent + all permanent saves
              </span>
            </div>

            {/* Version List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {(() => {
                const filtered = savedVersions.filter((v) => {
                  if (versionsFilter === "permanent") return v.isPermanent;
                  if (versionsFilter === "recent") return !v.isPermanent;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400">
                      <Icon name="LuHistory" size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-xs text-slate-600">No saved versions found in this filter.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Click "Save Settings" to create your first named snapshot!
                      </p>
                    </div>
                  );
                }

                return filtered.map((v) => (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      v.isPermanent
                        ? "bg-amber-50/40 border-amber-300 hover:border-amber-400 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-sky-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900">{v.name}</h4>
                          {v.isPermanent ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              ⭐ Permanent
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Snapshot
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{v.formattedDate || new Date(v.timestamp).toLocaleString("en-IN")}</span>
                          <span>•</span>
                          <span>Title: "{v.summary?.title || "Encounter Slip"}"</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              v.summary?.showTerms ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            📜 Policies: {v.summary?.showTerms ? "ON" : "OFF"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              v.summary?.showSignatures ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            ✍️ Signatures: {v.summary?.showSignatures ? "ON" : "OFF"}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePermanent(v.id)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                            v.isPermanent
                              ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                          title={v.isPermanent ? "Unpin permanent status" : "Mark as permanent save (prevent auto-deletion)"}
                        >
                          <Icon name="LuStar" size={13} className={v.isPermanent ? "fill-amber-500 text-amber-600" : ""} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete saved version "${v.name}"? This cannot be undone.`)) {
                              handleDeleteVersion(v.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                          title="Delete this saved version"
                        >
                          <Icon name="LuTrash2" size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRestoreVersion(v)}
                          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                          title="Restore this version into the editor"
                        >
                          <Icon name="LuRotateCcw" size={13} />
                          <span>Restore</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>Restoring a version loads it into the editor so you can review before re-saving.</span>
              <button
                type="button"
                onClick={() => setShowVersionsModal(false)}
                className="px-3.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
