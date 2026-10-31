import settingsService from "../../api/services/settingsService.js";
import {
  DEFAULT_IPD_DISCHARGE_SETTINGS,
  IPD_DISCHARGE_SETTINGS_KEY,
  mergeIPDSettings,
  cloneIPDSettings,
} from "./ipdDischargePrintConfig.js";

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function getBillingState(billing = {}) {
  const total = Number(billing.totalCharges || 0);
  const discount = Number(billing.discount || 0);
  const paid = Number(billing.amountPaid || 0);
  const due =
    billing.balance != null
      ? Number(billing.balance)
      : Math.max(total - discount - paid, 0);
  const hasBillingData = [
    billing.totalCharges,
    billing.amountPaid,
    billing.balance,
    billing.clearanceStatus,
  ].some((value) => value !== undefined && value !== null && value !== "");
  return {
    total,
    discount,
    paid,
    due: Math.max(due, 0),
    hasBillingData,
    cleared: billing.isCleared === true && due <= 0,
  };
}

function readField(data, key) {
  if (key === "ageGender")
    return [data.patient?.age, data.patient?.gender]
      .filter(Boolean)
      .join(" / ");
  if (key === "wardBed")
    return [
      data.admission?.ward,
      data.admission?.bed ? `Bed ${data.admission.bed}` : "",
    ]
      .filter(Boolean)
      .join(" • ");
  return (
    data.patient?.[key] ??
    data.admission?.[key] ??
    data.clinical?.[key] ??
    data.vitals?.[key] ??
    data.billing?.[key] ??
    data.advice?.[key] ??
    data.handover?.[key] ??
    ""
  );
}

const LONG_FIELDS = new Set(["allergies", "address", "destination", "referredBy"]);

function renderCardFields(fieldKeys, sectionConfig, data) {
  const fields = sectionConfig.fields || {};
  const standardFields = [];
  const blockFields = [];

  for (const key of fieldKeys) {
    if (fields[key]?.show === false) continue;
    const val = readField(data, key);
    if (val === "" || val == null) continue;

    const label = fields[key]?.label || key;
    const isLong = LONG_FIELDS.has(key) || String(val).length > 32;

    if (isLong) {
      blockFields.push({ key, label, val });
    } else {
      standardFields.push({ key, label, val });
    }
  }

  let html = "";

  if (standardFields.length > 0) {
    html += `<div class="kv-list">`;
    for (const item of standardFields) {
      html += `
        <div class="kv-row">
          <span class="kv-label">${esc(item.label)}:</span>
          <span class="kv-value">${esc(item.val)}</span>
        </div>
      `;
    }
    html += `</div>`;
  }

  if (blockFields.length > 0) {
    html += `<div class="block-list">`;
    for (const item of blockFields) {
      if (item.key === "allergies") {
        html += `
          <div class="allergy-box">
            <div class="allergy-title">⚠ ${esc(item.label).toUpperCase()}</div>
            <div class="allergy-val">${esc(item.val)}</div>
          </div>
        `;
      } else {
        html += `
          <div class="block-kv">
            <span class="block-label">${esc(item.label)}:</span>
            <span class="block-value">${esc(item.val)}</span>
          </div>
        `;
      }
    }
    html += `</div>`;
  }

  return html || `<div class="empty">No details provided.</div>`;
}

export function buildIPDDischargeHTML(
  discharge,
  settings = DEFAULT_IPD_DISCHARGE_SETTINGS,
  autoPrint = true,
) {
  const cfg = mergeIPDSettings(
    cloneIPDSettings(DEFAULT_IPD_DISCHARGE_SETTINGS),
    settings,
  );
  const data = discharge || {};
  const s = cfg.style;
  const primaryColor = s.primary || "#173b63";
  const accentColor = s.accent || "#087fbd";

  const patient = data.patient || {};
  const admission = data.admission || {};
  const clinical = data.clinical || {};
  const vitals = data.vitals || {};
  const billing = data.billing || {};
  const medicines = data.medicines || data.dischargeMedicines || [];
  const advice = data.advice || {};
  const handover = data.handover || {};
  const bill = getBillingState(billing);

  // 1. Header
  const logo =
    cfg.header.showLogo && cfg.hospital.logoUrl
      ? `<img class="hospital-logo" src="${esc(cfg.hospital.logoUrl)}" alt="Logo" onerror="this.onerror=null;this.src='/images/Narayan_Logo.png';" />`
      : `<img class="hospital-logo" src="/images/Narayan_Logo.png" alt="Logo" />`;

  const header = `
    <header class="hospital-header">
      <div class="header-left">
        ${logo}
        <div class="header-badges">
          <span class="badge-accred">NABH ACCREDITED</span>
          <span class="badge-accred">ISO 9001:2015</span>
        </div>
      </div>
      <div class="header-center">
        <h1 class="hospital-name">${esc(cfg.hospital.name || "NARAYAN HOSPITAL")}</h1>
        ${cfg.header.showSubtitle && cfg.hospital.subtitle ? `<div class="hospital-subline">${esc(cfg.hospital.subtitle)}</div>` : ""}
        ${cfg.header.showAddress && cfg.hospital.address ? `<div class="hospital-subline">${esc(cfg.hospital.address)}</div>` : ""}
        <div class="hospital-contacts">
          ${cfg.header.showContact && cfg.hospital.phone ? `<span>Emergency: <b>${esc(cfg.hospital.phone)}</b></span>` : ""}
          ${cfg.header.showContact && cfg.hospital.email ? `<span> · Email: <b>${esc(cfg.hospital.email)}</b></span>` : ""}
          ${cfg.header.showRegistrationNo && cfg.hospital.registrationNo ? `<span> · Reg No: <b>${esc(cfg.hospital.registrationNo)}</b></span>` : ""}
        </div>
      </div>
      <div class="header-right">
        <div class="barcode-badge">
          <div class="barcode-bars">||||| |||| |||||| ||||| ||||</div>
          <div class="barcode-info">
            <div>UHID: <b>${esc(patient.uhid || "NH-2026-98412")}</b></div>
            <div>IPD: <b>${esc(admission.ipdNumber || "IPD-2026-4401")}</b></div>
          </div>
        </div>
      </div>
    </header>
    ${cfg.header.showDocumentLabel ? `<div class="document-ribbon">${esc(cfg.header.title || "INPATIENT DISCHARGE SUMMARY & CLINICAL RECORD")}</div>` : ""}
  `;

  // 2. Demographics & Stay Particulars
  let demographicsHTML = "";
  if (cfg.patient.enabled || cfg.admission.enabled) {
    const patientKeys = [
      "uhid",
      "name",
      "ageGender",
      "mobile",
      "bloodGroup",
      "guardian",
      "relation",
      "address",
      "allergies",
    ];
    const admissionKeys = [
      "ipdNumber",
      "admissionDate",
      "dischargeDate",
      "stay",
      "wardBed",
      "department",
      "consultant",
      "dischargeType",
      "dischargeCondition",
      "destination",
      "referredBy",
    ];

    demographicsHTML = `
      <div class="demographics-grid">
        ${
          cfg.patient.enabled
            ? `
          <div class="card-box">
            <div class="card-header">
              <span class="card-header-icon">👤</span> ${esc(cfg.patient.title || "PATIENT DEMOGRAPHICS")}
            </div>
            <div class="card-body">
              ${renderCardFields(patientKeys, cfg.patient, data)}
            </div>
          </div>
        `
            : ""
        }
        ${
          cfg.admission.enabled
            ? `
          <div class="card-box">
            <div class="card-header">
              <span class="card-header-icon">📋</span> ${esc(cfg.admission.title || "ADMISSION & STAY PARTICULARS")}
            </div>
            <div class="card-body">
              ${renderCardFields(admissionKeys, cfg.admission, data)}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  // 3. Discharge Vitals Bar
  let vitalsHTML = "";
  if (cfg.vitals.enabled) {
    vitalsHTML = `
      <div class="vitals-strip">
        <div class="vitals-strip-title">
          <span class="vitals-icon">♥</span> ${esc(cfg.vitals.title || "DISCHARGE VITALS (शारीरिक स्थिति)")}
        </div>
        <div class="vitals-grid">
          <div class="vital-item">
            <span class="vital-name">BP</span>
            <strong class="vital-value">${esc(vitals.bp || "120/80 mmHg")}</strong>
          </div>
          <div class="vital-item">
            <span class="vital-name">Pulse</span>
            <strong class="vital-value">${esc(vitals.pulse || "76 bpm")}</strong>
          </div>
          <div class="vital-item">
            <span class="vital-name">Temp</span>
            <strong class="vital-value">${esc(vitals.temperature || "98.4 °F")}</strong>
          </div>
          <div class="vital-item">
            <span class="vital-name">SpO₂</span>
            <strong class="vital-value">${esc(vitals.spo2 || "99%")}</strong>
          </div>
          <div class="vital-item">
            <span class="vital-name">Respiration</span>
            <strong class="vital-value">${esc(vitals.respiratoryRate || "18 / min")}</strong>
          </div>
          <div class="vital-item vital-status">
            <span class="vital-name vital-status-label">Condition</span>
            <strong class="vital-value vital-status-val">${esc(vitals.mobility || "Ambulatory")}</strong>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Clinical Summary & Hospital Course
  let clinicalHTML = "";
  if (cfg.diagnosis.enabled) {
    clinicalHTML = `
      <div class="card-box">
        <div class="card-header">
          <span class="card-header-icon">🩺</span> ${esc(cfg.diagnosis.title || "CLINICAL SUMMARY & HOSPITAL COURSE")}
        </div>
        <div class="card-body clinical-body">
          ${
            clinical.primaryDiagnosis
              ? `
            <div class="primary-diag-card">
              <div class="primary-diag-tag">Final Clinical Diagnosis (अंतिम निदान):</div>
              <div class="primary-diag-text">${esc(clinical.primaryDiagnosis)}</div>
              ${
                clinical.secondaryDiagnosis
                  ? `<div class="secondary-diag-text"><b>Associated Diagnoses / Comorbidities:</b> ${esc(clinical.secondaryDiagnosis)}</div>`
                  : ""
              }
            </div>
          `
              : ""
          }

          ${
            clinical.chiefComplaints || clinical.history
              ? `
            <div class="clinical-two-col">
              ${
                clinical.chiefComplaints
                  ? `
                <div class="clinical-subcard">
                  <div class="subcard-title">Chief Complaints on Admission:</div>
                  <div class="subcard-content">${esc(clinical.chiefComplaints)}</div>
                </div>
              `
                  : ""
              }
              ${
                clinical.history
                  ? `
                <div class="clinical-subcard">
                  <div class="subcard-title">Relevant Medical &amp; Clinical History:</div>
                  <div class="subcard-content">${esc(clinical.history)}</div>
                </div>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          ${
            clinical.hospitalCourse
              ? `
            <div class="clinical-subcard course-card">
              <div class="subcard-title">Hospital Stay &amp; Clinical Course:</div>
              <div class="subcard-content">${esc(clinical.hospitalCourse)}</div>
            </div>
          `
              : ""
          }

          ${
            clinical.procedures || clinical.investigations
              ? `
            <div class="clinical-two-col">
              ${
                clinical.procedures
                  ? `
                <div class="clinical-subcard">
                  <div class="subcard-title">Procedures Performed:</div>
                  <div class="subcard-content">${esc(clinical.procedures)}</div>
                </div>
              `
                  : ""
              }
              ${
                clinical.investigations
                  ? `
                <div class="clinical-subcard">
                  <div class="subcard-title">Key Investigation Findings:</div>
                  <div class="subcard-content">${esc(clinical.investigations)}</div>
                </div>
              `
                  : ""
              }
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  // 5. Prescribed Discharge Medications
  let medicinesHTML = "";
  if (cfg.medicines.enabled) {
    const cols = (cfg.medicines.columns || []).filter((c) => c.show !== false);
    const getVal = (m, key, idx) =>
      ({
        sr: idx + 1,
        medicine: m.name || m.medicine_name || m.drug_name || "",
        dose: m.dose || m.dosage || "",
        route: m.route || "",
        frequency: m.frequency || m.timing || "",
        duration: m.duration || "",
        instructions: m.instructions || m.remarks || "",
      })[key] ?? "";

    medicinesHTML = `
      <div class="card-box">
        <div class="card-header flex-header">
          <div><span class="card-header-icon">💊</span> ${esc(cfg.medicines.title || "DISCHARGE MEDICATIONS & DOSAGE REGIMEN")}</div>
          <span class="header-count">${medicines.length} Prescribed</span>
        </div>
        <div class="card-body">
          ${cfg.medicines.note ? `<p class="medicine-warning">⚠ ${esc(cfg.medicines.note)}</p>` : ""}
          ${
            medicines.length > 0
              ? `
            <table class="medicines-table">
              <thead>
                <tr>
                  ${cols.map((col) => `<th style="width:${col.width || 10}%;">${esc(col.label)}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${medicines
                  .map(
                    (med, idx) => `
                  <tr class="${idx % 2 === 0 ? "row-even" : "row-odd"}">
                    ${cols
                      .map((col) => {
                        const val = getVal(med, col.key, idx);
                        if (col.key === "sr") {
                          return `<td class="sr-cell">${esc(val)}</td>`;
                        }
                        if (col.key === "medicine") {
                          return `<td class="med-name"><strong>${esc(val)}</strong></td>`;
                        }
                        if (col.key === "dose") {
                          return `<td><span class="dose-badge">${esc(val || "1 Tab")}</span></td>`;
                        }
                        if (col.key === "instructions") {
                          return `<td class="instructions-cell">${esc(val || "—")}</td>`;
                        }
                        return `<td>${esc(val || "—")}</td>`;
                      })
                      .join("")}
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : cfg.medicines.showEmptyState
                ? `<div class="empty-medicines">No discharge medications prescribed. Follow-up consultation as advised.</div>`
                : ""
          }
        </div>
      </div>
    `;
  }

  // 6. Discharge Advice & Emergency Guidance
  let adviceHTML = "";
  if (cfg.advice.enabled) {
    adviceHTML = `
      <div class="card-box">
        <div class="card-header">
          <span class="card-header-icon">📅</span> ${esc(cfg.advice.title || "DISCHARGE ADVICE & FOLLOW-UP")}
        </div>
        <div class="card-body advice-body">
          <div class="advice-two-col">
            <div class="review-box">
              <div class="review-icon">🗓</div>
              <div>
                <div class="review-tag">NEXT OPD REVIEW DATE</div>
                <div class="review-date">${esc(advice.followUpDate || "After 5 Days")}</div>
                <div class="review-dept">${esc(advice.followUpDepartment || "General Medicine OPD")}</div>
              </div>
            </div>
            <div class="lifestyle-box">
              <div><b>Dietary Advice:</b> ${esc(advice.diet || "Standard Light Diet")}</div>
              <div><b>Physical Activity:</b> ${esc(advice.activity || "Adequate rest. Avoid strenuous exertion.")}</div>
              ${advice.woundCare ? `<div><b>Wound Care:</b> ${esc(advice.woundCare)}</div>` : ""}
            </div>
          </div>

          <div class="emergency-alert-box">
            <div class="emergency-title">
              ⚠ EMERGENCY WARNING SIGNS (खतरे के संकेत - तुरंत अस्पताल आएं):
            </div>
            <p class="emergency-text">
              ${esc(
                advice.warningSigns ||
                  "High fever (>100.4°F), sudden breathlessness, severe chest/abdominal pain, persistent vomiting, or active bleeding.",
              )}
            </p>
            <div class="emergency-contact">
              24×7 Emergency Helpline: <b>${esc(advice.emergencyContact || "+91 7388660408 / +91 744 2450000")}</b>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 7. Billing Clearance & Summary
  let billingHTML = "";
  if (cfg.billing.enabled) {
    const f = cfg.billing.fields || {};
    billingHTML = `
      <div class="card-box">
        <div class="card-header">
          <span class="card-header-icon">₹</span> ${esc(cfg.billing.title || "FINANCIAL CLEARANCE & BILLING SUMMARY")}
        </div>
        <div class="card-body">
          <div class="billing-metrics-grid">
            ${
              f.totalCharges?.show !== false
                ? `
              <div class="bill-box">
                <small>${esc(f.totalCharges?.label || "Total Charges")}</small>
                <strong>${esc(money(bill.total))}</strong>
              </div>
            `
                : ""
            }
            ${
              f.amountPaid?.show !== false
                ? `
              <div class="bill-box">
                <small>${esc(f.amountPaid?.label || "Amount Paid")}</small>
                <strong class="paid-val">${esc(money(bill.paid))}</strong>
              </div>
            `
                : ""
            }
            ${
              f.balance?.show !== false
                ? `
              <div class="bill-box">
                <small>${esc(f.balance?.label || "Outstanding Due")}</small>
                <strong class="${bill.due > 0 ? "due-val" : "paid-val"}">${esc(money(bill.due))}</strong>
              </div>
            `
                : ""
            }
            ${
              f.clearanceStatus?.show !== false
                ? `
              <div class="bill-box">
                <small>${esc(f.clearanceStatus?.label || "Clearance Status")}</small>
                <strong class="${bill.cleared ? "paid-val" : "pending-val"}">
                  ${esc(bill.cleared ? "NO DUES CLEARED" : bill.due > 0 ? "BALANCE DUE" : "UNVERIFIED")}
                </strong>
              </div>
            `
                : ""
            }
          </div>

          ${
            cfg.billing.showNoDuesCertificate
              ? `
            <div class="nodues-certificate-banner ${bill.cleared ? "cert-cleared" : "cert-pending"}">
              <div class="cert-info">
                <div class="cert-title">
                  ${bill.cleared ? "✓ OFFICIAL HOSPITAL NO DUES CERTIFICATE" : "⚠ FINANCIAL CLEARANCE PENDING"}
                </div>
                <div class="cert-subtext">
                  ${
                    bill.cleared
                      ? "All Inpatient Medical, Nursing, Bed & Pharmacy charges have been verified and fully cleared in hospital accounts."
                      : !bill.hasBillingData
                        ? "Financial clearance not verified. Billing information was not provided."
                        : `Patient has pending balance of ${esc(money(bill.due))}. Clearance not complete.`
                  }
                </div>
              </div>
              <div class="cert-badge ${bill.cleared ? "badge-green" : "badge-orange"}">
                ${bill.cleared ? "NIL DUES · 100% CLEARED" : `DUE: ${esc(money(bill.due))}`}
              </div>
            </div>
          `
              : ""
          }

          ${
            cfg.billing.showDepartmentBreakdown && billing.departmentBreakdown?.length
              ? `
            <div class="dept-breakdown">
              ${billing.departmentBreakdown.map((item) => `<span class="dept-item"><b>${esc(item.label)}:</b> ${esc(item.status)}</span>`).join("")}
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  // 8. Handover Details
  let handoverHTML = "";
  if (cfg.handover.enabled) {
    handoverHTML = `
      <div class="card-box">
        <div class="card-header">
          <span class="card-header-icon">📁</span> ${esc(cfg.handover.title || "PATIENT HANDOVER & DOCUMENTS")}
        </div>
        <div class="card-body handover-list">
          <div><b>Documents Handed Over:</b> ${esc(handover.documents || "Discharge summary, test reports, imaging films, prescription.")}</div>
          <div><b>Personal Belongings:</b> ${esc(handover.belongings || "Returned and verified with attendant.")}</div>
          <div><b>Implants / Lines:</b> ${esc(handover.devices || "Cannula and catheters safely removed prior to release.")}</div>
          ${handover.attendant ? `<div><b>Received By (Attendant):</b> ${esc(handover.attendant)}</div>` : ""}
        </div>
      </div>
    `;
  }

  // 9. Custom Sections
  let customHTML = "";
  (cfg.customSections || [])
    .filter((item) => item.enabled)
    .forEach((item) => {
      customHTML += `
        <div class="card-box">
          <div class="card-header">${esc(item.title)}</div>
          <div class="card-body custom-text">${esc(item.content || "—").replace(/\n/g, "<br>")}</div>
        </div>
      `;
    });

  // 10. Signatures & Hospital Seal
  let signaturesHTML = "";
  if (cfg.signatures.enabled) {
    const items = [
      ["showPatient", cfg.signatures.patientLabel || "Patient / Attendant Signature"],
      ["showNurse", cfg.signatures.nurseLabel || "Discharging Nurse Signature"],
      ["showResident", cfg.signatures.residentLabel || "Resident Medical Officer"],
      [
        "showConsultant",
        cfg.signatures.consultantLabel || `Treating Consultant - ${admission.consultant || "Dr."}`,
      ],
    ];

    const activeSigs = items.filter(([prop]) => cfg.signatures[prop]);

    signaturesHTML = `
      <div class="signatures-wrapper">
        <div class="signatures-grid" style="grid-template-columns: repeat(${activeSigs.length || 1}, minmax(0, 1fr));">
          ${activeSigs
            .map(
              ([prop, label]) => `
            <div class="sig-column">
              <div class="sig-space">
                ${prop === "showConsultant" && admission.consultant ? `<span class="consultant-title">${esc(admission.consultant)}</span>` : ""}
              </div>
              <div class="sig-line"></div>
              <div class="sig-label">${esc(label)}</div>
            </div>
          `,
            )
            .join("")}
        </div>
        ${
          cfg.signatures.showStamp
            ? `
          <div class="stamp-wrapper">
            <div class="stamp-box">
              ${esc(cfg.hospital.name || "Narayan Hospital")}<br />
              OFFICIAL SEAL &amp; VERIFIED
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  // 11. Footer
  let footerHTML = "";
  if (cfg.footer.enabled) {
    footerHTML = `
      <footer class="hospital-footer">
        <div class="footer-left">
          ${cfg.footer.showHospitalName ? `<b>${esc(cfg.hospital.name)}</b>` : ""}
          ${cfg.footer.showAddress && cfg.hospital.address ? ` · ${esc(cfg.hospital.address)}` : ""}
          ${cfg.footer.showPhone && cfg.hospital.phone ? ` · Tel: ${esc(cfg.hospital.phone)}` : ""}
          ${cfg.footer.showDisclaimer ? `<div class="footer-disclaimer">${esc(cfg.footer.disclaimer)}</div>` : ""}
        </div>
        <div class="footer-right">
          ${cfg.footer.closingText ? `<div class="footer-closing">${esc(cfg.footer.closingText)}</div>` : ""}
          ${cfg.page.showGeneratedAt ? `<div class="footer-date">Printed: ${esc(data.generatedAt || new Date().toLocaleString("en-IN"))}</div>` : ""}
          ${cfg.page.showPageNumber ? `<div class="footer-page">Page 1 of 1</div>` : ""}
        </div>
      </footer>
    `;
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${esc(cfg.header.title || "Discharge Summary")} - ${esc(patient.name || "Patient")}</title>
  <style>
    @page {
      size: ${esc(cfg.page.size)} ${esc(cfg.page.orientation)};
      margin: ${Math.max(4, Number(cfg.page.margin) || 8)}mm;
    }
    * {
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }
    body {
      margin: 0;
      color: ${s.text || "#17263b"};
      font-family: ${s.fontFamily || "Arial, sans-serif"};
      font-size: ${Math.max(7.5, Number(s.fontSize) || 9.5)}px;
      line-height: 1.4;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .document {
      width: 100%;
      margin: 0 auto;
    }

    /* ── Hospital Header ── */
    .hospital-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${primaryColor};
    }
    .header-left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      width: 140px;
      flex-shrink: 0;
    }
    .hospital-logo {
      max-height: 54px;
      max-width: 130px;
      object-fit: contain;
    }
    .header-badges {
      display: flex;
      gap: 4px;
    }
    .badge-accred {
      font-size: 6.5px;
      font-weight: 800;
      letter-spacing: 0.3px;
      padding: 1.5px 4px;
      border-radius: 2px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .header-center {
      flex: 1;
      text-align: center;
      padding: 0 4px;
    }
    .hospital-name {
      margin: 0;
      color: ${primaryColor};
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .hospital-subline {
      color: ${s.muted || "#64748b"};
      font-size: 8px;
      line-height: 1.35;
      margin-top: 1px;
    }
    .hospital-contacts {
      color: #0f172a;
      font-size: 8px;
      margin-top: 2px;
    }
    .header-right {
      width: 140px;
      flex-shrink: 0;
      text-align: right;
    }
    .barcode-badge {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px 6px;
      background: #f8fafc;
      text-align: center;
      font-size: 7.5px;
    }
    .barcode-bars {
      font-family: monospace;
      letter-spacing: 2px;
      color: #334155;
      font-size: 10px;
      font-weight: bold;
      transform: scaleY(0.9);
    }
    .barcode-info {
      margin-top: 2px;
      border-top: 1px solid #e2e8f0;
      padding-top: 2px;
      color: #0f172a;
      line-height: 1.25;
    }

    /* ── Document Ribbon ── */
    .document-ribbon {
      margin: 6px 0 9px;
      background: ${primaryColor};
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.7px;
      text-align: center;
      text-transform: uppercase;
    }

    /* ── Card Containers ── */
    .card-box {
      border: 1px solid ${s.border || "#cbd5e1"};
      border-radius: 5px;
      background: #ffffff;
      margin-bottom: ${s.compact ? 5 : 8}px;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .card-header {
      background: ${s.sectionBackground || "#f1f5f9"};
      color: ${primaryColor};
      border-bottom: 1px solid ${s.border || "#cbd5e1"};
      padding: 4px 8px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .flex-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-count {
      font-size: 8px;
      font-weight: normal;
      color: #64748b;
    }
    .card-header-icon {
      margin-right: 3px;
      font-size: 9px;
    }
    .card-body {
      padding: ${s.compact ? 5 : 7}px 8px;
    }

    /* ── Demographics Side-by-Side ── */
    .demographics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    .kv-list {
      display: flex;
      flex-direction: column;
    }
    .kv-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 2px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 8.5px;
    }
    .kv-row:last-child {
      border-bottom: none;
    }
    .kv-label {
      color: #64748b;
      font-weight: 600;
      font-size: 8px;
      flex-shrink: 0;
      margin-right: 8px;
      white-space: nowrap;
    }
    .kv-value {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
      word-break: normal;
      overflow-wrap: break-word;
    }
    .block-list {
      margin-top: 4px;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .block-kv {
      font-size: 8px;
    }
    .block-label {
      font-weight: 700;
      color: #475569;
      margin-right: 4px;
    }
    .block-value {
      color: #0f172a;
      font-weight: 600;
      word-break: normal;
    }
    .allergy-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 4px;
      padding: 3.5px 6px;
      margin-top: 2px;
    }
    .allergy-title {
      color: #b91c1c;
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    .allergy-val {
      color: #7f1d1d;
      font-size: 8.5px;
      font-weight: 800;
      margin-top: 1px;
      word-break: normal;
    }

    /* ── Discharge Vitals ── */
    .vitals-strip {
      border: 1px solid ${s.border || "#cbd5e1"};
      border-radius: 5px;
      background: #f8fafc;
      padding: 5px 8px;
      margin-bottom: 8px;
      break-inside: avoid;
    }
    .vitals-strip-title {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #475569;
      margin-bottom: 4px;
    }
    .vitals-icon {
      color: #e11d48;
      font-weight: bold;
    }
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 5px;
    }
    .vital-item {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 3px 2px;
      text-align: center;
    }
    .vital-name {
      display: block;
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .vital-value {
      display: block;
      font-size: 9.5px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 1px;
    }
    .vital-status {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }
    .vital-status-label {
      color: #047857;
    }
    .vital-status-val {
      color: #065f46;
    }

    /* ── Clinical Summary ── */
    .clinical-body {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .primary-diag-card {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-left: 4px solid #0284c7;
      border-radius: 4px;
      padding: 5px 8px;
    }
    .primary-diag-tag {
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #0369a1;
    }
    .primary-diag-text {
      font-size: 11px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 2px;
    }
    .secondary-diag-text {
      font-size: 8px;
      color: #334155;
      margin-top: 2px;
    }
    .clinical-two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .clinical-subcard {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 8px;
    }
    .subcard-title {
      font-weight: 700;
      color: #475569;
      margin-bottom: 2px;
    }
    .subcard-content {
      color: #0f172a;
      line-height: 1.35;
    }
    .course-card {
      margin-top: 2px;
    }

    /* ── Medicines Table ── */
    .medicine-warning {
      color: #b45309;
      font-size: 8px;
      font-style: italic;
      margin: 0 0 5px;
    }
    table.medicines-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 8px;
    }
    .medicines-table th {
      background: ${primaryColor};
      color: #ffffff;
      padding: 4px 6px;
      text-align: left;
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border: 1px solid ${primaryColor};
    }
    .medicines-table td {
      padding: 3.5px 6px;
      border: 1px solid #cbd5e1;
      vertical-align: middle;
      color: #0f172a;
      word-break: normal;
    }
    .row-even td {
      background: #ffffff;
    }
    .row-odd td {
      background: #f8fafc;
    }
    .sr-cell {
      text-align: center;
      color: #64748b;
      font-weight: bold;
    }
    .med-name {
      color: #0f172a;
    }
    .dose-badge {
      display: inline-block;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      color: #0369a1;
      font-weight: 800;
      font-size: 7.5px;
      padding: 1px 4px;
      border-radius: 3px;
    }
    .instructions-cell {
      font-style: italic;
      color: #475569;
    }
    .empty-medicines {
      color: #64748b;
      font-style: italic;
      text-align: center;
      padding: 6px;
      font-size: 8px;
    }

    /* ── Advice & Followup ── */
    .advice-body {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .advice-two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .review-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 4px;
      padding: 5px 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .review-icon {
      font-size: 16px;
      line-height: 1;
    }
    .review-tag {
      font-size: 7px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0369a1;
    }
    .review-date {
      font-size: 11px;
      font-weight: 900;
      color: #0c4a6e;
      margin-top: 1px;
    }
    .review-dept {
      font-size: 8px;
      font-weight: 700;
      color: #0284c7;
    }
    .lifestyle-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 5px 6px;
      font-size: 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .emergency-alert-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 4px;
      padding: 5px 8px;
      color: #7f1d1d;
    }
    .emergency-title {
      font-size: 8px;
      font-weight: 800;
      color: #b91c1c;
      letter-spacing: 0.3px;
    }
    .emergency-text {
      margin: 2px 0 3px;
      font-size: 8px;
      line-height: 1.35;
      color: #991b1b;
    }
    .emergency-contact {
      font-size: 8px;
      font-weight: 700;
      color: #b91c1c;
    }

    /* ── Billing & No Dues ── */
    .billing-metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .bill-box {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px 6px;
      text-align: center;
      background: #ffffff;
    }
    .bill-box small {
      display: block;
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .bill-box strong {
      display: block;
      font-size: 10.5px;
      font-weight: 800;
      margin-top: 1px;
      color: #0f172a;
    }
    .paid-val { color: #047857 !important; }
    .due-val { color: #b91c1c !important; }
    .pending-val { color: #b45309 !important; }

    .nodues-certificate-banner {
      margin-top: 6px;
      padding: 5px 8px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .cert-cleared {
      background: #ecfdf5;
      border: 1px solid #86efac;
      color: #065f46;
    }
    .cert-pending {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      color: #92400e;
    }
    .cert-title {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    .cert-subtext {
      font-size: 7.5px;
      margin-top: 1px;
      opacity: 0.9;
    }
    .cert-badge {
      font-size: 8px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 3px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .badge-green {
      background: #d1fae5;
      border: 1px solid #6ee7b7;
      color: #065f46;
    }
    .badge-orange {
      background: #fef3c7;
      border: 1px solid #fde68a;
      color: #92400e;
    }
    .dept-breakdown {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 10px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 4px;
      margin-top: 5px;
      font-size: 7.5px;
      color: #047857;
    }

    /* ── Handover & Custom ── */
    .handover-list {
      font-size: 8px;
      display: flex;
      flex-direction: column;
      gap: 2.5px;
    }
    .custom-text {
      font-size: 8.5px;
      white-space: pre-wrap;
      line-height: 1.4;
    }

    /* ── Signatures & Stamp ── */
    .signatures-wrapper {
      margin-top: 14px;
      padding-top: 4px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .signatures-grid {
      display: grid;
      gap: 12px;
      text-align: center;
    }
    .sig-column {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .sig-space {
      height: 28px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 2px;
    }
    .consultant-title {
      font-size: 9px;
      font-weight: 800;
      color: ${primaryColor};
    }
    .sig-line {
      border-top: 1px solid #475569;
      margin-bottom: 3px;
    }
    .sig-label {
      font-size: 8px;
      font-weight: 700;
      color: #1e293b;
    }
    .stamp-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 6px;
    }
    .stamp-box {
      border: 1.5px dashed #94a3b8;
      border-radius: 4px;
      padding: 4px 12px;
      text-align: center;
      font-size: 7px;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 1px;
      text-transform: uppercase;
      line-height: 1.3;
    }

    /* ── Footer ── */
    .hospital-footer {
      border-top: 1px solid ${s.border || "#cbd5e1"};
      padding-top: 6px;
      margin-top: 10px;
      color: ${s.muted || "#64748b"};
      font-size: 7.5px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .footer-left {
      flex: 1;
    }
    .footer-disclaimer {
      margin-top: 2px;
      font-size: 7px;
      color: #94a3b8;
    }
    .footer-right {
      text-align: right;
      flex-shrink: 0;
    }
    .footer-closing {
      font-weight: 700;
      color: ${primaryColor};
    }
    .footer-date, .footer-page {
      margin-top: 1px;
      color: #94a3b8;
    }

    @media screen {
      body {
        background: #e2e8f0;
        padding: 20px 10px;
      }
      .document {
        max-width: 210mm;
        margin: 0 auto;
        padding: 8mm 10mm;
        background: #ffffff;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        border-radius: 4px;
      }
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .document {
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .card-box, .vitals-strip, .signatures-wrapper, .hospital-footer {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <main class="document">
    ${header}
    ${demographicsHTML}
    ${vitalsHTML}
    ${clinicalHTML}
    ${medicinesHTML}
    ${adviceHTML}
    ${billingHTML}
    ${handoverHTML}
    ${customHTML}
    ${signaturesHTML}
    ${footerHTML}
  </main>
  ${
    autoPrint
      ? `<script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    });
  </script>`
      : ""
  }
</body>
</html>`;
}

export class IPDDischargePrintHandler {
  static async getSettings() {
    try {
      const response = await settingsService.getSetting(
        IPD_DISCHARGE_SETTINGS_KEY,
      );
      const saved =
        response?.data?.value ??
        response?.data?.settings ??
        response?.data ??
        response?.value ??
        response;
      return mergeIPDSettings(
        cloneIPDSettings(DEFAULT_IPD_DISCHARGE_SETTINGS),
        saved || {},
      );
    } catch (error) {
      console.warn("Using default IPD discharge print settings:", error);
      return cloneIPDSettings(DEFAULT_IPD_DISCHARGE_SETTINGS);
    }
  }

  static buildDischargeHTML(discharge, settings, autoPrint = false) {
    return buildIPDDischargeHTML(
      discharge,
      settings || DEFAULT_IPD_DISCHARGE_SETTINGS,
      autoPrint,
    );
  }

  /**
   * Print an IPD discharge summary.
   * Expected payload shape: see SAMPLE_IPD_DISCHARGE in ipdDischargePrintConfig.js.
   * The caller may pass settings explicitly; otherwise the saved settings are fetched.
   */
  static async printDischargeSummary(discharge, settingsOverride) {
    // Open synchronously, before awaiting settings, to avoid popup blockers.
    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=850,scrollbars=yes",
    );
    if (!printWindow) {
      window.alert(
        "Please allow pop-ups for this site to print the discharge summary.",
      );
      return;
    }
    try {
      printWindow.document.open();
      printWindow.document.write(
        "<!doctype html><html><body style='font-family:Arial;padding:24px;color:#334155'>Preparing IPD discharge summary…</body></html>",
      );
      printWindow.document.close();
      const settings = settingsOverride || (await this.getSettings());
      const html = buildIPDDischargeHTML(discharge, settings);
      if (printWindow.closed) return;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      console.error("IPD discharge summary print failed:", error);
      try {
        printWindow.close();
      } catch (_) {
        /* no-op */
      }
      window.alert(
        "Could not generate the IPD discharge summary. Please try again.",
      );
    }
  }
}

export default IPDDischargePrintHandler;
