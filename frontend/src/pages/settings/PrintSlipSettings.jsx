import React, { useState, useEffect } from "react";
import Icon from "../../components/common/Icon.jsx";
import OPDConsultationSlip from "../../components/slips/OPDConsultationSlip.jsx";
import settingsService from "../../api/services/settingsService.js";
import PrintSlipHandler from "../../services/PrintSlipHandler.js";
import { DEFAULT_HOSPITAL_CONFIG } from "../../data/printlslip.data.jsx";
import IPDDischargePrintSettings from "./IPDDischargePrintSettings.jsx";
import IPDBillingPrintSettings from "./IPDBillingPrintSettings.jsx";
import IPDAdmissionPrintSettings from "./IPDAdmissionPrintSettings.jsx";
import SharedHeaderFooterDesigner from "./SharedHeaderFooterDesigner.jsx";
import { loadSharedPrintSettings, saveSharedPrintSettings } from "./sharedPrintConfig.js";

const SAMPLE_SLIP_DATA = {
  patientName: "Adeesh",
  age: "44",
  gender: "Male",
  phone: "+91 7287901826",
  address: "Jansa, Varanasi, Uttar Pradesh, 221405",
  bloodGroup: "B+",
  tokenNo: "T-311026-GEN-03",
  visitType: "OPD Consultation",
  encounterNo: "OPD-26-0044",
  encounterDate: "31 Oct 2026",
  source: "Offline",
  status: "Arrived",
  doctor: "Dr. Adeesh Singh",
  department: "General Medicine",
  particulars: [
    { id: "1", particular: "OPD Consultation Fee", amount: 500 },
    { id: "2", particular: "Registration Fee", amount: 100 },
  ],
  totalAmount: 600,
};

const DEFAULT_SETTINGS = {
  hospital: {
    name: "Narayan Hospital",
    subtitle: "Super Speciality Healthcare & Research Institute",
    slogan: "Better Care. Healthier Tomorrow.",
    registrationNo: "REG/UP/2024/098",
    address: "Jansa, Varanasi, Uttar Pradesh, 221405",
    phone: "+91 7388660408",
    logo: {
      src: "/images/Narayan_Logo.png",
      height: "48px",
      maxWidth: "160px",
      show: true,
    },
  },
  page: {
    size: "A4",
    orientation: "portrait",
    margin: 8,
  },
  styling: {
    primaryColor: "#0B3B60",
    secondaryColor: "#E0F2FE",
    accentColor: "#0284C7",
    slipBorderColor: "#93C5FD",
    textColor: "#0F172A",
    borderRadius: "12px",
    shape: "rounded", // 'sharp' | 'subtle' | 'rounded' | 'pill'
    fontSizeScale: "normal", // 'compact' | 'normal' | 'spacious'
    showWaveDecorations: true,
    paperSize: "A4",
  },
  header: {
    showLogo: true,
    showTagline: true,
    showTimestamp: false,
    badgeTitle: "OPD Consultation Slip",
    tokenLabel: "OPD Token",
  },
  patientDetails: {
    cardTitle: "Patient Details",
    showName: true,
    showAgeGender: true,
    showPhone: true,
    showAddress: true,
    showBloodGroup: false,
    showEmergency: false,
  },
  visitDetails: {
    cardTitle: "Visit & Clinical Details",
    showVisitType: true,
    showEncounterNo: true,
    showEncounterDate: true,
    showSource: true,
    showStatus: true,
    showDoctor: true,
    showDepartment: true,
  },
  particulars: {
    showTable: true,
    headerIndex: "#",
    headerParticulars: "Particulars",
    headerAmount: "Amount (₹)",
    defaultItems: [
      { id: "1", particular: "OPD Consultation Fee", amount: 500 },
      { id: "2", particular: "Registration Fee", amount: 100 },
    ],
    totalLabel: "Total Amount",
  },
  footer: {
    infoBullets: [
      "Please carry this slip for consultation.",
      "For any assistance, contact reception.",
    ],
    helpline: {
      show: true,
      label: "Helpline:",
      number: "+91 7388660408",
    },
    stamp: {
      show: true,
      label: "HOSPITAL STAMP",
    },
  },
};

export default function PrintSlipSettings() {
  const [activeTab, setActiveTab] = useState("shared-master"); // 'shared-master' | 'opd' | 'ipd-admission' | 'ipd-billing' | 'ipd-discharge'
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'error', message }
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Load and merge both OPD settings and Master Shared settings on mount and tab switch
  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const [opdData, sharedData] = await Promise.all([
          settingsService.getSetting("print_slip_opd").catch(() => null),
          loadSharedPrintSettings().catch(() => null),
        ]);
        if (mounted) {
          setSettings((prev) => ({
            ...prev,
            ...(opdData || {}),
            ...(sharedData || {}),
            useSharedHeaderFooter: true,
            hospital: {
              ...(prev.hospital || {}),
              ...(opdData?.hospital || {}),
              ...(sharedData?.hospital || {}),
            },
            styling: {
              ...(prev.styling || {}),
              ...(sharedData?.styling || {}),
              ...(opdData?.styling || {}),
            },
            header: {
              ...(prev.header || {}),
              ...(opdData?.header || {}),
              ...(sharedData?.header || {}),
            },
            footer: {
              ...(prev.footer || {}),
              ...(opdData?.footer || {}),
              ...(sharedData?.footer || {}),
            },
            patientDemographics: {
              ...(prev.patientDemographics || {}),
              ...(opdData?.patientDemographics || {}),
              ...(sharedData?.patientDemographics || {}),
            },
            fieldStyles: {
              ...(opdData?.fieldStyles || {}),
              ...(sharedData?.fieldStyles || {}),
            },
            slipConfigs: {
              ...(opdData?.slipConfigs || {}),
              ...(sharedData?.slipConfigs || {}),
            },
          }));
        }
      } catch (err) {
        console.warn("Could not fetch DB settings:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus(null);
      await settingsService.updateSetting("print_slip_opd", settings);
      // Keep shared master in sync if branding or demographic styles were touched
      try {
        const shared = await loadSharedPrintSettings();
        const updatedShared = {
          ...shared,
          hospital: { ...(shared.hospital || {}), ...(settings.hospital || {}) },
          footer: { ...(shared.footer || {}), ...(settings.footer || {}) },
          patientDemographics: { ...(shared.patientDemographics || {}), ...(settings.patientDemographics || {}) },
          fieldStyles: { ...(shared.fieldStyles || {}), ...(settings.fieldStyles || {}) },
          slipConfigs: { ...(shared.slipConfigs || {}), ...(settings.slipConfigs || {}) },
        };
        await saveSharedPrintSettings(updatedShared);
      } catch (_) {}
      // Refresh cache in PrintSlipHandler so subsequent prints use new settings immediately
      await PrintSlipHandler.loadDbSettings(true);
      setSaveStatus({
        type: "success",
        message: "Settings saved successfully to PostgreSQL database! All hospital counters now use this configuration.",
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

  const handleReset = () => {
    if (window.confirm("Reset all OPD slip customizations back to factory defaults?")) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const handleTestPrint = () => {
    PrintSlipHandler.printBooking(SAMPLE_SLIP_DATA, settings);
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
          setSettings((prev) => ({
            ...prev,
            hospital: {
              ...prev.hospital,
              logo: { ...prev.hospital.logo, src: res.url },
            },
          }));
          alert("Logo uploaded to Cloudinary successfully!");
        } else {
          // Cloudinary not configured yet, fallback to base64 or inform user
          setSettings((prev) => ({
            ...prev,
            hospital: {
              ...prev.hospital,
              logo: { ...prev.hospital.logo, src: base64 },
            },
          }));
          alert(
            "Note: Cloudinary credentials not configured in backend .env, loaded image locally for preview. You can also use /images/Narayan_Logo.png."
          );
        }
      } catch (err) {
        console.error("Upload error:", err);
        // Fallback to local base64
        setSettings((prev) => ({
          ...prev,
          hospital: {
            ...prev.hospital,
            logo: { ...prev.hospital.logo, src: base64 },
          },
        }));
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Sync Header, Footer, Demographics & Positioning from Shared Master for OPD
  const handleSyncFromSharedMaster = async () => {
    try {
      const shared = await loadSharedPrintSettings();
      if (shared) {
        setSettings((prev) => ({
          ...prev,
          useSharedHeaderFooter: true,
          hospital: {
            ...prev.hospital,
            ...(shared.hospital || {}),
            name: shared.hospital?.name || prev.hospital?.name,
            subtitle: shared.hospital?.subtitle || prev.hospital?.subtitle,
            slogan: shared.hospital?.slogan || prev.hospital?.slogan,
            registrationNo: shared.hospital?.registrationNo || prev.hospital?.registrationNo,
            address: shared.hospital?.address || prev.hospital?.address,
            phone: shared.hospital?.phone || prev.hospital?.phone,
            logo: {
              ...prev.hospital?.logo,
              src: shared.hospital?.logoUrl || prev.hospital?.logo?.src,
            },
          },
          footer: {
            ...prev.footer,
            ...(shared.footer || {}),
            infoBullets: shared.footer?.termsItems || prev.footer?.infoBullets,
            helpline: {
              show: true,
              label: "Helpline:",
              number: shared.hospital?.phone || prev.footer?.helpline?.number,
            },
          },
          patientDemographics: {
            ...(prev.patientDemographics || {}),
            ...(shared.patientDemographics || {}),
          },
          fieldStyles: {
            ...(prev.fieldStyles || {}),
            ...(shared.fieldStyles || {}),
          },
          slipConfigs: {
            ...(prev.slipConfigs || {}),
            ...(shared.slipConfigs || {}),
          },
        }));
        setSaveStatus({
          type: "success",
          message: "Synced Hospital Header, Demographics & Position Controls from Shared Master successfully!",
        });
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  const handlePushToSharedMaster = async () => {
    if (window.confirm("Push OPD slip's branding & footer to the Master Shared Header & Footer?")) {
      try {
        const shared = await loadSharedPrintSettings();
        const updated = {
          ...shared,
          hospital: {
            ...(shared.hospital || {}),
            name: settings.hospital?.name || shared.hospital?.name,
            subtitle: settings.hospital?.subtitle || shared.hospital?.subtitle,
            slogan: settings.hospital?.slogan || shared.hospital?.slogan,
            registrationNo: settings.hospital?.registrationNo || shared.hospital?.registrationNo,
            address: settings.hospital?.address || shared.hospital?.address,
            phone: settings.hospital?.phone || shared.hospital?.phone,
            logoUrl: settings.hospital?.logo?.src || shared.hospital?.logoUrl,
          },
        };
        await saveSharedPrintSettings(updated);
        setSaveStatus({
          type: "success",
          message: "Pushed to Shared Master successfully!",
        });
        setTimeout(() => setSaveStatus(null), 4000);
      } catch (e) {
        console.error("Push error:", e);
      }
    }
  };

  // Helper state update functions
  const updateHospital = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      hospital: { ...prev.hospital, [field]: val },
    }));
  };

  const updateStyling = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      styling: { ...prev.styling, [field]: val },
    }));
  };

  const updateHeader = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: val },
    }));
  };

  const updatePatientDetails = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      patientDetails: { ...prev.patientDetails, [field]: val },
    }));
  };

  const updateVisitDetails = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      visitDetails: { ...prev.visitDetails, [field]: val },
    }));
  };

  const updateFooter = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      footer: { ...prev.footer, [field]: val },
    }));
  };

  const updatePage = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      page: { ...(prev.page || {}), [field]: val },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("shared-master")}
            className={`px-4 py-2 font-bold text-sm rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "shared-master"
                ? "bg-gradient-to-r from-sky-800 to-indigo-900 text-white shadow-sm ring-2 ring-sky-300"
                : "bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100"
            }`}
          >
            <Icon name="LuSparkles" size={16} className="text-amber-300" />
            <span>Master Shared Header &amp; Footer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("opd")}
            className={`px-4 py-2 font-bold text-sm rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "opd"
                ? "bg-sky-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Icon name="LuReceipt" size={16} />
            <span>OPD Consultation Slip</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ipd-billing")}
            className={`px-4 py-2 font-bold text-sm rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "ipd-billing"
                ? "bg-sky-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Icon name="LuIndianRupee" size={16} />
            <span>IPD Billing Slip / Invoice</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ipd-discharge")}
            className={`px-4 py-2 font-bold text-sm rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "ipd-discharge"
                ? "bg-sky-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Icon name="LuFileCheck" size={16} />
            <span>IPD Discharge Summary</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ipd")}
            className={`px-4 py-2 font-bold text-sm rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "ipd"
                ? "bg-emerald-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Icon name="LuBed" size={16} />
            <span>IPD Admission Ticket</span>
          </button>
        </div>

        {/* Global Action Buttons for OPD */}
        {activeTab === "opd" && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Icon name="LuRotateCcw" size={14} /> Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleTestPrint}
              className="px-4 py-2 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-300 rounded-lg hover:bg-sky-100 flex items-center gap-1.5"
            >
              <Icon name="LuPrinter" size={15} /> Test Print
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-900 rounded-lg hover:bg-sky-950 shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icon name={saving ? "LuLoader" : "LuSave"} size={15} />
              <span>{saving ? "Saving to Database..." : "Save Settings to Database"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Render Master Shared Header & Footer Designer */}
      {activeTab === "shared-master" && <SharedHeaderFooterDesigner />}

      {/* Render IPD Discharge Designer Tab */}
      {activeTab === "ipd-discharge" && <IPDDischargePrintSettings />}

      {/* Render IPD Billing Slip Designer Tab */}
      {activeTab === "ipd-billing" && <IPDBillingPrintSettings />}

      {/* Render IPD Admission Ticket Designer Tab */}
      {activeTab === "ipd" && <IPDAdmissionPrintSettings />}

      {/* Shared Master Status & Sync Ribbon for OPD */}
      {activeTab === "opd" && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/90 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-sky-950 font-bold">
            <Icon name="LuLayers" size={16} className="text-sky-700" />
            <span>Shared Master Header &amp; Footer:</span>
            <label className="flex items-center gap-1.5 cursor-pointer ml-1 text-slate-700">
              <input
                type="checkbox"
                checked={settings.useSharedHeaderFooter !== false}
                onChange={(e) => updateStyling("useSharedHeaderFooter", e.target.checked)}
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
              title="Save this OPD slip's header as the new Shared Master"
            >
              <Icon name="LuUpload" size={13} /> Push to Master
            </button>
          </div>
        </div>
      )}

      {/* Save Notification for OPD */}
      {activeTab === "opd" && saveStatus && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between ${
            saveStatus.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name={saveStatus.type === "success" ? "LuCheckCircle" : "LuAlertTriangle"} size={18} />
            <span>{saveStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <Icon name="LuX" size={16} />
          </button>
        </div>
      )}

      {/* Main Split Grid: Left Form Controls, Right Live Preview */}
      {activeTab === "opd" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Controls Form (5 cols) */}
          <div className="xl:col-span-5 space-y-6">
          {/* Card 1: Master Shared Letterhead & Demographics */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Icon name="LuLayers" size={18} className="text-sky-700" />
                <h3 className="font-bold text-slate-800 text-sm">Master Shared Letterhead &amp; Demographics</h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active &amp; Synced
              </span>
            </div>

            <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-lg text-xs text-sky-950 space-y-2">
              <p className="font-medium text-[11px] leading-relaxed">
                This OPD slip dynamically consumes the <strong>Master Shared Header, Demographics &amp; Footer</strong>.
                All element coordinate adjustments (X/Y position sliders) and Active/Inactive data toggles made in the Master Designer are live here!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("shared-master")}
                className="w-full py-1.5 px-3 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-md shadow-xs flex items-center justify-center gap-1.5 text-xs transition-colors"
              >
                <Icon name="LuSlidersHorizontal" size={14} />
                <span>Open Master Designer to Reposition Elements or Toggle Data</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name</label>
              <input
                type="text"
                value={settings.hospital.name || ""}
                onChange={(e) => updateHospital("name", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Facility Category</label>
              <input
                type="text"
                value={settings.hospital.subtitle || ""}
                onChange={(e) => updateHospital("subtitle", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Tagline / Slogan</label>
              <input
                type="text"
                value={settings.hospital.slogan || ""}
                onChange={(e) => updateHospital("slogan", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 italic"
              />
            </div>

            {/* Logo Settings */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Display Logo</span>
                <input
                  type="checkbox"
                  checked={settings.header.showLogo !== false}
                  onChange={(e) => updateHeader("showLogo", e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
              </div>

              {settings.header.showLogo !== false && (
                <>
                  <div className="flex items-center gap-4">
                    <img
                      src={settings.hospital.logo?.src || "/images/Narayan_Logo.png"}
                      alt="Logo preview"
                      className="h-12 w-28 object-contain border border-slate-200 rounded p-1 bg-slate-50"
                      onError={(e) => {
                        e.target.src = "/NarayanLogo.png";
                      }}
                    />
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSettings((p) => ({
                              ...p,
                              hospital: {
                                ...p.hospital,
                                logo: { ...p.hospital.logo, src: "/images/Narayan_Logo.png" },
                              },
                            }))
                          }
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
                        >
                          Use Narayan Logo
                        </button>
                        <label className="px-2.5 py-1 text-xs bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded font-medium cursor-pointer">
                          <span>{uploadingLogo ? "Uploading..." : "Upload New"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Default fallback is <code>Narayan_Logo.png</code>. Cloudinary can be enabled in <code>.env</code>.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Direct Logo URL</label>
                    <input
                      type="text"
                      value={settings.hospital.logo?.src || ""}
                      onChange={(e) =>
                        setSettings((p) => ({
                          ...p,
                          hospital: {
                            ...p.hospital,
                            logo: { ...p.hospital.logo, src: e.target.value },
                          },
                        }))
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-sky-500 font-mono text-slate-600"
                      placeholder="/images/Narayan_Logo.png or https://..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card 2: Colors, Shape & Size Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Icon name="LuPalette" size={18} className="text-sky-700" />
              <h3 className="font-bold text-slate-800 text-sm">Theme, Colors &amp; Shape</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Banner &amp; Header Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.styling.primaryColor || "#0B3B60"}
                    onChange={(e) => updateStyling("primaryColor", e.target.value)}
                    className="w-9 h-9 p-0.5 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.styling.primaryColor || "#0B3B60"}
                    onChange={(e) => updateStyling("primaryColor", e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Token &amp; Total Bar Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.styling.secondaryColor || "#E0F2FE"}
                    onChange={(e) => updateStyling("secondaryColor", e.target.value)}
                    className="w-9 h-9 p-0.5 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.styling.secondaryColor || "#E0F2FE"}
                    onChange={(e) => updateStyling("secondaryColor", e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Shape / Border Radius Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Card Shape &amp; Corner Style (Curvature)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "sharp", label: "Sharp (0px)", icon: "▪" },
                  { value: "subtle", label: "Subtle (6px)", icon: "▢" },
                  { value: "rounded", label: "Rounded (12px)", icon: "◯" },
                  { value: "pill", label: "Pill (20px)", icon: "⬭" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => updateStyling("shape", s.value)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      (settings.styling.shape || "rounded") === s.value
                        ? "border-sky-600 bg-sky-50 text-sky-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div>{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Size & Page Compatibility */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paper Size &amp; Page Compatibility (A4 / A5 / Letter)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "A4", label: "A4 (Standard Sheet)", desc: "210 × 297 mm" },
                  { value: "A5", label: "A5 (Compact Slip)", desc: "148 × 210 mm" },
                  { value: "Letter", label: "Letter (US)", desc: "8.5 × 11 in" },
                ].map((p) => {
                  const currentSize = settings.page?.size || settings.styling?.paperSize || "A4";
                  const isSelected = currentSize.toUpperCase() === p.value.toUpperCase();
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        updatePage("size", p.value);
                        updateStyling("paperSize", p.value);
                      }}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        isSelected
                          ? "border-sky-600 bg-sky-50 text-sky-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold">{p.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Scale & Wave Decoration */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Font Scaling</label>
                <select
                  value={settings.styling.fontSizeScale || "normal"}
                  onChange={(e) => updateStyling("fontSizeScale", e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="compact">Compact (Dense)</option>
                  <option value="normal">Standard / Normal</option>
                  <option value="spacious">Spacious (Large)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decorative Waves</label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="waveToggle"
                    checked={settings.styling.showWaveDecorations !== false}
                    onChange={(e) => updateStyling("showWaveDecorations", e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                  <label htmlFor="waveToggle" className="text-xs text-slate-600 cursor-pointer">
                    Show Blue Wave Ribbons
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Field Visibility & Toggles */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Icon name="LuSliders" size={18} className="text-sky-700" />
              <h3 className="font-bold text-slate-800 text-sm">Visible Information &amp; Toggles</h3>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Details Card</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.patientDetails.showAgeGender !== false}
                    onChange={(e) => updatePatientDetails("showAgeGender", e.target.checked)}
                    className="rounded text-sky-600 w-3.5 h-3.5"
                  />
                  <span>Age / Gender</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.patientDetails.showPhone !== false}
                    onChange={(e) => updatePatientDetails("showPhone", e.target.checked)}
                    className="rounded text-sky-600 w-3.5 h-3.5"
                  />
                  <span>Mobile Number</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.patientDetails.showAddress !== false}
                    onChange={(e) => updatePatientDetails("showAddress", e.target.checked)}
                    className="rounded text-sky-600 w-3.5 h-3.5"
                  />
                  <span>Full Address</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.patientDetails.showBloodGroup === true}
                    onChange={(e) => updatePatientDetails("showBloodGroup", e.target.checked)}
                    className="rounded text-sky-600 w-3.5 h-3.5"
                  />
                  <span>Blood Group 🩸</span>
                </label>
              </div>

              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2 border-t border-slate-100">
                Visit &amp; Clinical Details Card
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.visitDetails.showVisitType !== false}
                    onChange={(e) => updateVisitDetails("showVisitType", e.target.checked)}
                    className="rounded text-sky-600 w-3.5 h-3.5"
                  />
                  <span>Visit Type</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.visitDetails.showEncounterNo !== false}
                    onChange={(e) => updateVisitDetails("showEncounterNo", e.target.checked)}
                    className="rounded text-sky-600 w-3.5 h-3.5"
                  />
                  <span>Encounter No.</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.visitDetails.showSource !== false}
                    onChange={(e) => updateVisitDetails("showSource", e.target.checked)}
                    className="rounded text-sky-600 w-3.5 h-3.5"
                  />
                  <span>Source Badge (Offline)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.visitDetails.showStatus !== false}
                    onChange={(e) => updateVisitDetails("showStatus", e.target.checked)}
                    className="rounded text-sky-600 w-3.5 h-3.5"
                  />
                  <span>Status Badge (Arrived)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 4: Footer & Helplines */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Icon name="LuPhoneCall" size={18} className="text-sky-700" />
              <h3 className="font-bold text-slate-800 text-sm">Footer Notes &amp; Contacts</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Helpline Phone Number</label>
              <input
                type="text"
                value={settings.footer.helpline?.number || ""}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    footer: {
                      ...p.footer,
                      helpline: { ...p.footer.helpline, number: e.target.value },
                    },
                  }))
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold text-sky-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Line 1</label>
                <input
                  type="text"
                  value={settings.footer.infoBullets?.[0] || ""}
                  onChange={(e) => {
                    const bullets = [...(settings.footer.infoBullets || [])];
                    bullets[0] = e.target.value;
                    updateFooter("infoBullets", bullets);
                  }}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Line 2</label>
                <input
                  type="text"
                  value={settings.footer.infoBullets?.[1] || ""}
                  onChange={(e) => {
                    const bullets = [...(settings.footer.infoBullets || [])];
                    bullets[1] = e.target.value;
                    updateFooter("infoBullets", bullets);
                  }}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive WYSIWYG Preview (7 cols) */}
        <div className="xl:col-span-7 sticky top-6 space-y-3">
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <Icon name="LuEye" size={16} className="text-sky-700" />
              Live Interactive Slip Preview
            </span>
            <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
              Real-time update as you change settings
            </span>
          </div>

          <div className="bg-slate-200/50 p-4 rounded-2xl border border-slate-300/80 shadow-inner overflow-x-auto">
            <OPDConsultationSlip data={SAMPLE_SLIP_DATA} settings={settings} />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
