import React, { useState, useEffect, useMemo, useRef } from "react";
import Icon from "../../components/common/Icon.jsx";
import {
  IPDReceiptPrintHandler,
  buildReceiptHTML,
  SAMPLE_RECEIPT_PAYLOAD,
} from "./IPDReceiptPrintHandler.js";
import {
  loadSharedPrintSettings,
  saveSharedPrintSettings,
  DEFAULT_SHARED_CONFIG,
} from "./sharedPrintConfig.js";

export default function IPDReceiptPrintSettings() {
  const [settings, setSettings] = useState(DEFAULT_SHARED_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const iframeRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await IPDReceiptPrintHandler.loadDbSettings(true);
        if (data) setSettings(data);
      } catch (err) {
        console.warn("Could not load receipt print settings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const slipCfg = settings.slipConfigs?.ipd_receipt || {
    title: "OFFICIAL PAYMENT RECEIPT & CASH VOUCHER",
    copyBadge: "ORIGINAL FOR PATIENT",
  };

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
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus(null);
      await IPDReceiptPrintHandler.saveSettings(settings);
      setSaveStatus({
        type: "success",
        message: "Payment Receipt Slip (Half Page) settings saved successfully!",
      });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus({
        type: "error",
        message: "Failed to save receipt settings: " + (err.message || "Unknown error"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromSharedMaster = async () => {
    try {
      const master = await loadSharedPrintSettings();
      if (master) {
        setSettings((prev) => ({
          ...prev,
          hospital: {
            ...(prev.hospital || {}),
            ...(master.hospital || {}),
          },
          header: {
            ...(prev.header || {}),
            ...(master.header || {}),
          },
          footer: {
            ...(prev.footer || {}),
            ...(master.footer || {}),
          },
          fieldStyles: {
            ...(prev.fieldStyles || {}),
            ...(master.fieldStyles || {}),
          },
        }));
        setSaveStatus({
          type: "success",
          message: "Synced Branding & Header from Shared Master successfully!",
        });
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  const handleTestPrint = () => {
    IPDReceiptPrintHandler.printReceipt(SAMPLE_RECEIPT_PAYLOAD, settings);
  };

  const previewHtml = useMemo(() => {
    return buildReceiptHTML(SAMPLE_RECEIPT_PAYLOAD, settings, false);
  }, [settings]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <Icon name="LuLoader" size={20} className="animate-spin text-sky-600" />
        <span>Loading Payment Receipt Slip settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-200">
              <Icon name="LuReceipt" size={18} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Payment Receipt Slip Customizer (Half Page)
              </h2>
              <p className="text-xs text-slate-500">
                Compact A5 format for Cash Counter, Advance Deposit, and Running Bill receipts. Shares the Master Hospital Header &amp; Footer.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSyncFromSharedMaster}
            className="px-3 py-1.5 text-xs font-bold text-sky-900 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 flex items-center gap-1.5 transition-all"
            title="Sync latest hospital logo, legal name, address and colors from Shared Master"
          >
            <Icon name="LuRefreshCw" size={13} />
            <span>Sync from Shared Master</span>
          </button>
          <button
            type="button"
            onClick={handleTestPrint}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Icon name="LuPrinter" size={14} />
            <span>Test Print Half-Page</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-1.5 text-xs font-extrabold text-white bg-sky-900 hover:bg-sky-950 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Icon name={saving ? "LuLoader" : "LuSave"} size={14} className={saving ? "animate-spin" : ""} />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            saveStatus.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <Icon name={saveStatus.type === "success" ? "LuCheck" : "LuAlertCircle"} size={16} />
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Main Grid: Left Controls (5 cols) & Right Preview (7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls */}
        <div className="xl:col-span-5 space-y-4">
          {/* Document Header & Titles */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon name="LuHeading" size={14} className="text-sky-700" />
              <span>Document Title &amp; Badges</span>
            </h3>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Printed Slip Title:</label>
              <input
                type="text"
                value={slipCfg.title ?? "OFFICIAL PAYMENT RECEIPT & CASH VOUCHER"}
                onChange={(e) => handleUpdate("slipConfigs.ipd_receipt.title", e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Copy Badge Pill:</label>
              <input
                type="text"
                value={slipCfg.copyBadge ?? "ORIGINAL FOR PATIENT"}
                onChange={(e) => handleUpdate("slipConfigs.ipd_receipt.copyBadge", e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.header?.showBarcode ?? true}
                  onChange={(e) => handleUpdate("header.showBarcode", e.target.checked)}
                  className="rounded text-sky-700"
                />
                <span>Show Barcode</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.header?.showTopUHID ?? true}
                  onChange={(e) => handleUpdate("header.showTopUHID", e.target.checked)}
                  className="rounded text-sky-700"
                />
                <span>Show Top UHID</span>
              </label>
            </div>
          </div>

          {/* Hospital Letterhead Readout */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="LuBuilding2" size={14} className="text-sky-700" />
                <span>Hospital Letterhead (Shared)</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-800 rounded border border-sky-200">
                Shared Master
              </span>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="font-extrabold text-slate-900">{settings.hospital?.name || "Narayan Hospital"}</div>
              <div className="text-[11px] text-slate-600">{settings.hospital?.subtitle}</div>
              <div className="text-[10.5px] text-slate-500">{settings.hospital?.address}</div>
              <div className="text-[10.5px] text-slate-500 font-mono">
                Reg: {settings.hospital?.registrationNo || "REG/UP/2024/098"} • Helpline: {settings.hospital?.emergencyPhone || "+91 9811223344"}
              </div>
            </div>
          </div>

          {/* Signatures & Declarations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon name="LuFileSignature" size={14} className="text-sky-700" />
              <span>Signatures &amp; Official Seal</span>
            </h3>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold cursor-pointer">
                <span>Cashier / Authorized Signatory</span>
                <input
                  type="checkbox"
                  checked={settings.footer?.signatures?.cashier?.show ?? true}
                  onChange={(e) => handleUpdate("footer.signatures.cashier.show", e.target.checked)}
                  className="rounded text-sky-700"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold cursor-pointer">
                <span>Patient / Attendant Signature</span>
                <input
                  type="checkbox"
                  checked={settings.footer?.signatures?.attendant?.show ?? true}
                  onChange={(e) => handleUpdate("footer.signatures.attendant.show", e.target.checked)}
                  className="rounded text-sky-700"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold cursor-pointer">
                <span>Official Hospital Seal / Stamp</span>
                <input
                  type="checkbox"
                  checked={settings.footer?.signatures?.stamp?.show ?? true}
                  onChange={(e) => handleUpdate("footer.signatures.stamp.show", e.target.checked)}
                  className="rounded text-sky-700"
                />
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Half-Page WYSIWYG Preview */}
        <div className="xl:col-span-7 sticky top-4 space-y-3">
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name="LuEye" size={15} className="text-sky-400" />
              <span>Live Preview: Half-Page Receipt Slip (A5)</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.max(60, z - 10))}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
              >
                -
              </button>
              <span className="text-[11px] font-mono text-sky-300 min-w-10 text-center">{previewZoom}%</span>
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.min(160, z + 10))}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(100)}
                className={`ml-1 px-1.5 py-0.5 text-[10px] rounded ${
                  previewZoom === 100 ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                100%
              </button>
            </div>
          </div>

          {/* Half-Page Canvas Wrapper */}
          <div className="bg-slate-200/90 p-4 rounded-2xl border border-slate-300 shadow-inner overflow-auto max-h-[82vh] flex justify-center">
            <div
              style={{
                width: "148mm",
                minHeight: "210mm",
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.12s ease",
              }}
              className="bg-white shadow-2xl rounded-sm p-4 text-slate-900 border border-slate-300 relative select-none"
            >
              <iframe
                ref={iframeRef}
                title="Half-Page Receipt Live Preview"
                srcDoc={previewHtml}
                className="w-full border-none pointer-events-auto"
                style={{
                  height: "200mm",
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
