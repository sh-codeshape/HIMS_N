import React from "react";
import "./OPDConsultationSlip.css";

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

const WaveTop = () => (
  <svg className="opd-slip-wave-top" viewBox="0 0 400 60" preserveAspectRatio="none" fill="none">
    <path
      d="M0,0 C120,45 250,10 400,35 L400,0 L0,0 Z"
      fill="url(#topWaveGrad)"
      opacity="0.85"
    />
    <defs>
      <linearGradient id="topWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
      </linearGradient>
    </defs>
  </svg>
);

const WaveBottom = () => (
  <svg className="opd-slip-wave-bottom" viewBox="0 0 800 24" preserveAspectRatio="none" fill="none">
    <path
      d="M0,12 C200,24 600,0 800,16 L800,24 L0,24 Z"
      fill="url(#botWaveGrad)"
    />
    <defs>
      <linearGradient id="botWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0b3b60" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
  </svg>
);

export default function OPDConsultationSlip({ data = {}, settings = {}, className = "" }) {
  // Extract or apply defaults from settings
  const hospital = settings.hospital || {};
  const styling = settings.styling || {};
  const header = settings.header || {};
  const patientDetails = settings.patientDetails || {};
  const visitDetails = settings.visitDetails || {};
  const particularsConfig = settings.particulars || {};
  const footer = settings.footer || {};

  const hospitalName = hospital.name || "Narayan Hospital";
  const hospitalSubtitle = hospital.subtitle || "Super Speciality Healthcare & Research Institute";
  const hospitalSlogan = hospital.slogan || "Better Care. Healthier Tomorrow.";
  const logoSrc = hospital.logo?.src || "/images/Narayan_Logo.png";
  const showLogo = hospital.logo?.show !== false && header.showLogo !== false;

  // Colors & Shape
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
  const showWaves = styling.showWaveDecorations !== false;

  // Normalized patient data
  const patientName = data.patientName || data.name || data.full_name || "Adeesh";
  const age = data.age || data.ageYrs || "44";
  const gender = data.gender || "Male";
  const phone = data.phone || data.mobile || data.mobile1 || "+91 7287901826";
  const address = data.address || data.address_line1 || "Jansa, Varanasi, Uttar Pradesh, 221405";

  // Normalized visit data
  const token = data.tokenNo || data.token || data.token_number || "T-311026-GEN-03";
  const visitType = data.visitType || data.category || "OPD Consultation";
  const encounterNo = data.encounterNo || data.uhid || "OPD-26-0044";
  const encounterDate = data.encounterDate || data.date || "31 Oct 2026";
  const source = data.source || data.bookingSource || "Offline";
  const status = data.status || "Arrived";

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

  const containerStyle = {
    "--slip-primary": primaryColor,
    "--slip-secondary": secondaryColor,
    "--slip-accent": accentColor,
    "--slip-border": slipBorderColor,
    "--slip-radius": borderRadius,
    "--slip-text": textColor,
  };

  const pageSize = (settings.page?.size || styling.paperSize || "A4").toLowerCase();

  return (
    <div
      className={`opd-slip-container scale-${fontSizeScale} size-${pageSize} ${className}`}
      style={containerStyle}
      id="narayan-opd-consultation-slip"
    >
      {/* Wave Accents */}
      {showWaves && <WaveTop />}
      {showWaves && <WaveBottom />}

      {/* Header Row */}
      <div className="opd-slip-header">
        <div className="opd-slip-brand">
          {showLogo && (
            <img
              src={logoSrc}
              alt={`${hospitalName} Logo`}
              className="opd-slip-logo-img"
              style={{
                height: hospital.logo?.height || "48px",
                maxWidth: hospital.logo?.maxWidth || "160px",
              }}
              onError={(e) => {
                // If local path fails, fallback to NarayanLogo.png in public root
                if (!e.target.src.includes("NarayanLogo.png")) {
                  e.target.src = "/NarayanLogo.png";
                }
              }}
            />
          )}
          <div className="opd-slip-title-group">
            <h1 className="opd-slip-hospital-name">{hospitalName}</h1>
            {hospitalSubtitle && (
              <>
                <span className="opd-slip-header-divider">|</span>
                <span className="opd-slip-subtitle">{hospitalSubtitle}</span>
              </>
            )}
          </div>
        </div>

        {header.showTagline !== false && hospitalSlogan && (
          <div className="opd-slip-slogan">{hospitalSlogan}</div>
        )}
      </div>

      {/* Title & Token Row */}
      <div className="opd-slip-title-row">
        <div className="opd-slip-banner">
          <div className="opd-slip-banner-icon">
            <StethoscopeIcon />
          </div>
          <div className="opd-slip-banner-title">
            {header.badgeTitle || "OPD Consultation Slip"}
          </div>
        </div>

        <div className="opd-slip-token-box">
          <span className="opd-slip-token-lbl">{header.tokenLabel || "OPD Token"}</span>
          <span className="opd-slip-token-val">{token}</span>
        </div>
      </div>

      {/* Two Column Cards */}
      <div className="opd-slip-details-grid">
        {/* Left Card: Patient Details */}
        <div className="opd-slip-card">
          <div className="opd-slip-card-head">
            <UserIcon />
            <span>{patientDetails.cardTitle || "Patient Details"}</span>
          </div>
          <div className="opd-slip-table-rows">
            {patientDetails.showName !== false && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Name</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val">{patientName}</span>
              </div>
            )}
            {patientDetails.showAgeGender !== false && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Age / Gender</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val">{age} Yrs / {gender}</span>
              </div>
            )}
            {patientDetails.showPhone !== false && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Mobile No.</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val">{phone}</span>
              </div>
            )}
            {patientDetails.showAddress !== false && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Address</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val">{address}</span>
              </div>
            )}
            {patientDetails.showBloodGroup && data.bloodGroup && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Blood Group</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val" style={{ color: "#DC2626" }}>🩸 {data.bloodGroup}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Visit & Clinical Details */}
        <div className="opd-slip-card">
          <div className="opd-slip-card-head">
            <CalendarIcon />
            <span>{visitDetails.cardTitle || "Visit & Clinical Details"}</span>
          </div>
          <div className="opd-slip-table-rows">
            {visitDetails.showVisitType !== false && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Visit Type</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val">{visitType}</span>
              </div>
            )}
            {visitDetails.showEncounterNo !== false && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Encounter No.</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val">{encounterNo}</span>
              </div>
            )}
            {visitDetails.showEncounterDate !== false && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Encounter Date</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val">{encounterDate}</span>
              </div>
            )}
            {visitDetails.showDoctor !== false && data.doctor && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Doctor</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val">{data.doctor}</span>
              </div>
            )}
            {visitDetails.showSource !== false && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Source</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val">
                  <span className="opd-slip-badge opd-slip-badge--source">{source}</span>
                </span>
              </div>
            )}
            {visitDetails.showStatus !== false && (
              <div className="opd-slip-row">
                <span className="opd-slip-lbl">Status</span>
                <span className="opd-slip-colon">:</span>
                <span className="opd-slip-val">
                  <span className="opd-slip-badge opd-slip-badge--status">
                    <CheckIcon /> {status}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Particulars / Billing Table */}
      {particularsConfig.showTable !== false && (
        <div className="opd-slip-table-wrap">
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
                  <td>{row.particular || row.service || "OPD Consultation"}</td>
                  <td className="td-amt">₹ {Number(row.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="2" style={{ textAlign: "center" }}>
                  {particularsConfig.totalLabel || "Total Amount"}
                </td>
                <td className="td-amt">₹ {totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Area */}
      <div className="opd-slip-footer">
        {/* Left: Info Bullets */}
        <div className="opd-slip-footer-info">
          <div className="opd-slip-info-icon">i</div>
          <div className="opd-slip-bullet-list">
            {(footer.infoBullets || [
              "Please carry this slip for consultation.",
              "For any assistance, contact reception.",
            ]).map((line, idx) => (
              <span key={idx}>• {line}</span>
            ))}
          </div>
        </div>

        {/* Center: Helpline */}
        {footer.helpline?.show !== false && (
          <div className="opd-slip-helpline-wrap">
            <span className="opd-slip-helpline-icon">
              <PhoneIcon />
            </span>
            <span>{footer.helpline?.label || "Helpline:"} {footer.helpline?.number || hospital.phone || "+91 7388660408"}</span>
          </div>
        )}

        {/* Right: Stamp Box */}
        {footer.stamp?.show !== false && (
          <div className="opd-slip-stamp-box">
            {footer.stamp?.label || "HOSPITAL STAMP"}
          </div>
        )}
      </div>
    </div>
  );
}
