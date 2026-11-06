import React from "react";
import "./OPDConsultationSlip.css";
import {
  DEFAULT_SHARED_CONFIG,
  SHARED_PRINT_CSS,
  buildSharedHeaderHTML,
  buildSharedDemographicsHTML,
  buildSharedFooterHTML,
  mergeSharedSettings,
} from "../../pages/settings/sharedPrintConfig.js";

// SVG Icons tailored for high-DPI print & vector sharpness
const StethoscopeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
    <path d="M9 12.5v3.5a3 3 0 0 0 6 0V11" />
    <circle cx="15" cy="10" r="2" />
    <circle cx="3" cy="3" r="1.5" />
    <circle cx="15" cy="3" r="1.5" />
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export default function OPDConsultationSlip({ data = {}, settings = {}, className = "" }) {
  // Extract or apply defaults from settings
  const styling = settings.styling || {};
  const particularsConfig = settings.particulars || {};

  // Normalized patient data
  const patientName = data.patientName || data.name || data.full_name || "Adeesh";
  const age = data.age || data.ageYrs || "44";
  const gender = data.gender || "Male";
  const phone = data.phone || data.mobile || data.mobile1 || "+91 7287901826";
  const address = data.address || data.address_line1 || "Jansa, Varanasi, Uttar Pradesh, 221405";

  // Normalized visit data
  const token = data.tokenNo || data.token || data.token_number || "T-311026-GEN-03";
  const encounterNo = data.encounterNo || data.uhid || "OPD-26-0044";
  const encounterDate = data.encounterDate || data.date || "31 Oct 2026";

  // Build particulars table rows
  let billingRows = [];
  if (Array.isArray(data.particulars) && data.particulars.length > 0) {
    billingRows = data.particulars;
  } else if (data.consultationFee !== undefined || data.regFee !== undefined || data.fee !== undefined) {
    const consultFee = Number(data.consultFee || data.consultationFee || 500);
    const regFee = Number(data.regFee || data.registrationFee || 100);
    billingRows = [
      { id: "1", particular: "OPD Consultation Fee", amount: consultFee },
      { id: "2", particular: "Registration Fee", amount: regFee },
    ];
  } else if (Array.isArray(particularsConfig.defaultItems) && particularsConfig.defaultItems.length > 0) {
    billingRows = particularsConfig.defaultItems;
  } else {
    billingRows = [
      { id: "1", particular: "OPD Consultation Fee", amount: 500 },
      { id: "2", particular: "Registration Fee", amount: 100 },
    ];
  }

  const totalAmount =
    data.totalAmount !== undefined
      ? Number(data.totalAmount)
      : billingRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const primaryColor = styling.primaryColor || "#0B3B60";
  const secondaryColor = styling.secondaryColor || "#E0F2FE";
  const accentColor = styling.accentColor || "#0284C7";
  const slipBorderColor = styling.slipBorderColor || "#93C5FD";
  const textColor = styling.textColor || "#0F172A";
  const borderRadius =
    styling.shape === "sharp"
      ? "0px"
      : styling.shape === "subtle"
      ? "6px"
      : styling.shape === "pill"
      ? "20px"
      : styling.borderRadius || "12px";

  const fontSizeScale = styling.fontSizeScale || "normal";
  const pageSize = (settings.page?.size || styling.paperSize || "A4").toLowerCase();

  const containerStyle = {
    "--slip-primary": primaryColor,
    "--slip-secondary": secondaryColor,
    "--slip-accent": accentColor,
    "--slip-border": slipBorderColor,
    "--slip-radius": borderRadius,
    "--slip-text": textColor,
  };

  // ── RENDER WITH SHARED MASTER HEADER, DEMOGRAPHICS & FOOTER ──
  const sharedConfig = mergeSharedSettings(DEFAULT_SHARED_CONFIG, settings || {});

  const normalizedEncounter = {
    patientName,
    uhid: encounterNo || "OPD-26-0044",
    encounterNo,
    tokenNo: token,
    ageGender: `${age} Yrs / ${gender}`,
    mobile: phone,
    address,
    bloodGroup: data.bloodGroup || "B+",
    admissionDate: encounterDate || "Today",
    doctor: data.doctor || "Dr. Adeesh Singh",
    department: data.department || "General Medicine",
    ...data,
  };

  const headerHtml = buildSharedHeaderHTML(sharedConfig, {
    isPreview: false,
    slipType: "opd",
    encounterData: normalizedEncounter,
  });

  const demoHtml = buildSharedDemographicsHTML(
    sharedConfig,
    normalizedEncounter,
    null,
    { isPreview: false, slipType: "opd" }
  );

  const footerHtml = buildSharedFooterHTML(sharedConfig, {
    isPreview: false,
    slipType: "opd",
  });

  return (
    <div
      className={`opd-slip-container scale-${fontSizeScale} size-${pageSize} ${className}`}
      style={containerStyle}
      id="narayan-opd-consultation-slip"
    >
      <style>{SHARED_PRINT_CSS}</style>

      {/* ── 1. SHARED MASTER HOSPITAL HEADER & BANNER ── */}
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />

      {/* ── 2. SHARED MASTER PATIENT DEMOGRAPHICS ── */}
      <div dangerouslySetInnerHTML={{ __html: demoHtml }} style={{ marginTop: "6px" }} />

      {/* ── 3. OPD CONSULTATION PARTICULAR & CHARGES TABLE ── */}
      {particularsConfig.showTable !== false && (
        <div className="opd-slip-table-wrap" style={{ marginTop: "8px" }}>
          <table className="opd-slip-table">
            <thead>
              <tr>
                <th className="th-num">{particularsConfig.headerIndex || "#"}</th>
                <th>{particularsConfig.headerParticulars || "Particulars"}</th>
                <th className="th-amt">{particularsConfig.headerAmount || "Amount (₹)"}</th>
              </tr>
            </thead>
            <tbody>
              {billingRows.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td className="td-num">{idx + 1}</td>
                  <td>{row.particular || row.service || "OPD Consultation Fee"}</td>
                  <td className="td-amt">₹ {Number(row.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="2" style={{ textAlign: "center", fontWeight: 800 }}>
                  {particularsConfig.totalLabel || "Total Amount"}
                </td>
                <td className="td-amt" style={{ fontWeight: 900 }}>₹ {totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── 4. SHARED MASTER FOOTER POLICIES, SIGNATURES & STAMP ── */}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} style={{ marginTop: "8px" }} />
    </div>
  );
}
