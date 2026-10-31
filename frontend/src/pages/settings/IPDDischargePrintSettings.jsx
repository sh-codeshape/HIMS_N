import React, { useEffect, useMemo, useState } from "react";
import Icon from "../../components/common/Icon.jsx";
import settingsService from "../../api/services/settingsService.js";
import {
  DEFAULT_IPD_DISCHARGE_SETTINGS,
  IPD_DISCHARGE_SETTINGS_KEY,
  SAMPLE_IPD_DISCHARGE,
  cloneIPDSettings,
  mergeIPDSettings,
} from "./ipdDischargePrintConfig.js";
import { IPDDischargePrintHandler } from "./IPDDischargePrintHandler.js";

const GROUPS = [
  { key: "hospital", title: "Hospital & header", icon: "LuBuilding2" },
  { key: "patient", title: "Patient details", icon: "LuUserRound" },
  { key: "admission", title: "Admission details", icon: "LuClipboardList" },
  { key: "diagnosis", title: "Clinical summary", icon: "LuStethoscope" },
  { key: "vitals", title: "Discharge vitals", icon: "LuActivity" },
  { key: "billing", title: "Billing & no-dues", icon: "LuIndianRupee" },
  { key: "medicines", title: "Discharge medicines", icon: "LuPill" },
  { key: "advice", title: "Advice & follow-up", icon: "LuCalendarCheck" },
  { key: "handover", title: "Handover details", icon: "LuFolderCheck" },
  { key: "signatures", title: "Signatures", icon: "LuFileSignature" },
  { key: "footer", title: "Footer & disclaimer", icon: "LuAlignLeft" },
  { key: "customSections", title: "Custom sections", icon: "LuLayers3" },
  { key: "page", title: "Page & appearance", icon: "LuPalette" },
];

const FIELD_HINTS = {
  patient: ["uhid", "name", "ageGender", "mobile", "address", "bloodGroup", "allergies", "guardian", "relation"],
  admission: ["ipdNumber", "admissionDate", "dischargeDate", "stay", "wardBed", "department", "consultant", "referredBy", "dischargeType", "dischargeCondition", "destination"],
  diagnosis: ["chiefComplaints", "history", "examination", "primaryDiagnosis", "secondaryDiagnosis", "investigations", "procedures", "treatmentGiven", "hospitalCourse"],
  vitals: ["bp", "pulse", "temperature", "spo2", "respiratoryRate", "weight", "bloodSugar", "consciousness", "mobility"],
  billing: ["totalCharges", "discount", "amountPaid", "balance", "paymentMode", "receiptNo", "clearanceStatus", "verifiedBy"],
  advice: ["followUpDate", "followUpDepartment", "diet", "activity", "woundCare", "pendingReports", "referral", "warningSigns", "emergencyContact"],
  handover: ["documents", "belongings", "devices", "attendant"],
};

const LABELS = {
  patient: "Patient details",
  admission: "Admission details",
  diagnosis: "Clinical summary",
  vitals: "Discharge vitals",
  billing: "Billing & no-dues",
  advice: "Discharge advice",
  handover: "Patient handover",
};

function getPath(object, path) {
  return path.split(".").reduce((current, key) => current?.[key], object);
}
function setPath(object, path, value) {
  const keys = path.split(".");
  const result = { ...object };
  let target = result;
  let source = object;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) target[key] = value;
    else {
      target[key] = { ...(source?.[key] || {}) };
      target = target[key];
      source = source?.[key];
    }
  });
  return result;
}
function money(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}
function getBillingState(billing = {}) {
  const total = Number(billing.totalCharges || 0);
  const discount = Number(billing.discount || 0);
  const paid = Number(billing.amountPaid || 0);
  const due = billing.balance != null ? Number(billing.balance) : Math.max(total - discount - paid, 0);
  const hasBillingData = [billing.totalCharges, billing.amountPaid, billing.balance, billing.clearanceStatus].some((value) => value !== undefined && value !== null && value !== "");
  const cleared = billing.isCleared === true && due <= 0;
  return { total, discount, paid, due: Math.max(due, 0), hasBillingData, cleared };
}
function fieldValue(key, data) {
  if (key === "ageGender") return [data.patient?.age, data.patient?.gender].filter(Boolean).join(" / ");
  if (key === "wardBed") return [data.admission?.ward, data.admission?.bed ? `Bed ${data.admission.bed}` : ""].filter(Boolean).join(" • ");
  return data.patient?.[key] ?? data.admission?.[key] ?? data.clinical?.[key] ?? data.vitals?.[key] ?? data.billing?.[key] ?? data.advice?.[key] ?? data.handover?.[key] ?? "";
}

function FieldRow({ path, field, onUpdate }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(140px,220px)_66px] items-center gap-2 border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs font-medium text-slate-700">{field.label}</span>
      <input aria-label={`${field.label} print label`} value={field.label} onChange={(event) => onUpdate(`${path}.label`, event.target.value)} className="min-w-0 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-sky-500 focus:outline-none" />
      <label className="flex items-center justify-end gap-1.5 text-[11px] text-slate-600">
        <input type="checkbox" checked={field.show !== false} onChange={(event) => onUpdate(`${path}.show`, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-700" />
        Print
      </label>
    </div>
  );
}

function SectionToggle({ enabled, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
      <input type="checkbox" checked={enabled !== false} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-700" />
      Include this section
    </label>
  );
}

function CardFieldsList({ sectionKey, settings, data }) {
  const fields = settings[sectionKey]?.fields || {};
  const keys = FIELD_HINTS[sectionKey] || [];
  const rows = keys.filter(
    (key) =>
      fields[key]?.show !== false &&
      fieldValue(key, data) !== "" &&
      fieldValue(key, data) != null
  );

  if (!rows.length) {
    return <div className="text-[9.5px] italic text-slate-400 py-1.5 text-center">No details selected to display.</div>;
  }

  return (
    <div className="space-y-1.5 text-[9.5px]">
      {rows.map((key) => {
        const val = fieldValue(key, data);
        const isLongText =
          ["allergies", "address", "destination", "referredBy"].includes(key) ||
          String(val).length > 32;

        if (isLongText) {
          const isAllergy = key === "allergies";
          return (
            <div
              key={key}
              className={`p-1.5 rounded transition-colors ${
                isAllergy
                  ? "bg-red-50 border border-red-200 text-red-900"
                  : "bg-slate-50 border border-slate-100"
              }`}
            >
              <div
                className={`text-[8px] uppercase font-bold tracking-wider ${
                  isAllergy ? "text-red-700" : "text-slate-500"
                }`}
              >
                {fields[key].label}
              </div>
              <div
                className={`text-[9.5px] font-semibold mt-0.5 leading-snug break-words ${
                  isAllergy ? "text-red-950 font-bold" : "text-slate-800"
                }`}
              >
                {val}
              </div>
            </div>
          );
        }

        const isCondition = key === "dischargeCondition";
        const isIpdNo = key === "ipdNumber";
        const isUhid = key === "uhid";

        return (
          <div
            key={key}
            className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0 gap-2"
          >
            <span className="text-[9px] font-semibold text-slate-500 shrink-0">
              {fields[key].label}:
            </span>
            <span
              className={`text-[9.5px] font-bold text-right truncate ${
                isCondition
                  ? "text-emerald-700 font-extrabold"
                  : isIpdNo
                  ? "text-sky-800 font-extrabold font-mono"
                  : isUhid
                  ? "font-mono text-slate-800"
                  : "text-slate-900"
              }`}
            >
              {val}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function IPDDischargePreview({ settings, data = SAMPLE_IPD_DISCHARGE }) {
  const cfg = settings;
  const style = cfg.style || {};
  const bill = getBillingState(data.billing);
  const enabledMedicineColumns = (cfg.medicines?.columns || []).filter((column) => column.show);

  const valueForMedicine = (medicine, key, index) =>
    ({
      sr: index + 1,
      medicine: medicine.name || medicine.medicine || "—",
      dose: medicine.dose || medicine.dosage || "—",
      route: medicine.route || "Oral",
      frequency: medicine.frequency || "—",
      duration: medicine.duration || medicine.days || "—",
      instructions: medicine.instructions || "—",
    }[key] ?? "");

  const patientData = data.patient || {};
  const admissionData = data.admission || {};
  const clinicalData = data.clinical || {};
  const vitalsData = data.vitals || {};
  const adviceData = data.advice || {};
  const handoverData = data.handover || {};
  const primaryColor = style.primary || "#0B3B60";

  return (
    <div
      className="mx-auto w-full max-w-[820px] bg-white p-6 shadow-2xl rounded-xl border border-slate-300 text-slate-900"
      style={{
        fontFamily: style.fontFamily || "Arial, sans-serif",
        fontSize: `${style.fontSize || 10}px`,
        lineHeight: 1.45,
      }}
    >
      {/* ── 1. Top Hospital Branding Letterhead ── */}
      <header className="border-b-2 pb-4 mb-3" style={{ borderColor: primaryColor }}>
        <div className="flex items-center justify-between gap-4">
          {/* Logo on Left */}
          {cfg.header.showLogo && (
            <div className="shrink-0 flex items-center justify-center p-1 bg-white rounded-lg border border-slate-100 shadow-sm">
              <img
                src={cfg.hospital.logoUrl || "/images/Narayan_Logo.png"}
                alt="Hospital Logo"
                className="h-16 w-auto max-w-[120px] object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/NarayanLogo.png";
                }}
              />
            </div>
          )}

          {/* Hospital Info Center */}
          <div className="flex-1 text-center min-w-0">
            <h1
              className="text-[20px] font-black uppercase tracking-wide leading-tight"
              style={{ color: primaryColor }}
            >
              {cfg.hospital.name || "NARAYAN HOSPITAL"}
            </h1>
            {cfg.header.showSubtitle && (
              <p className="text-[10px] font-semibold text-slate-600 mt-0.5 tracking-tight">
                {cfg.hospital.subtitle || "Super Speciality Healthcare & Research Institute"}
              </p>
            )}
            {cfg.header.showRegistrationNo && (
              <p className="text-[8.5px] font-medium text-slate-500">
                NABH Accredited Tertiary Center • Reg No: {cfg.hospital.registrationNo || "REG/UP/2024/098"}
              </p>
            )}
            <p className="text-[8.5px] text-slate-600 mt-0.5">
              {[cfg.hospital.address, cfg.hospital.phone && `Helpline: ${cfg.hospital.phone}`, cfg.hospital.email]
                .filter(Boolean)
                .join(" • ")}
            </p>
          </div>

          {/* Right Header: IPD & UHID Identification Badge */}
          <div className="shrink-0 hidden sm:flex flex-col gap-1 items-end">
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 text-right">
              <div className="text-[7.5px] uppercase font-bold text-sky-700">Patient UHID</div>
              <div className="text-[11px] font-extrabold font-mono text-sky-950">
                {patientData.uhid || "—"}
              </div>
              <div className="text-[7.5px] uppercase font-bold text-sky-700 mt-1">IPD Adm No</div>
              <div className="text-[11px] font-extrabold font-mono text-sky-950">
                {admissionData.ipdNumber || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Navy Document Banner Ribbon */}
        {cfg.header.showDocumentLabel && (
          <div
            className="mt-3.5 py-2 px-4 rounded-lg flex items-center justify-between text-white shadow-sm"
            style={{ background: primaryColor }}
          >
            <div className="flex items-center gap-2">
              <Icon name="LuFileCheck" size={17} className="text-sky-300" />
              <span className="text-[12.5px] font-extrabold tracking-wider uppercase">
                {cfg.header.title || "CLINICAL DISCHARGE SUMMARY & NO-DUES CLEARANCE"}
              </span>
            </div>
            <div className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {admissionData.dischargeType || "NORMAL"} DISCHARGE
            </div>
          </div>
        )}
      </header>

      {/* ── 2. Side-by-Side Demographics & Admission Particulars ── */}
      {(cfg.patient.enabled || cfg.admission.enabled) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5 items-stretch">
          {/* Card 1: Patient Particulars */}
          {cfg.patient.enabled && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
              <div
                className="px-3.5 py-1.5 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5"
                style={{ background: "#F1F5F9", color: primaryColor }}
              >
                <Icon name="LuUserRound" size={13} className="text-sky-700" />
                <span>{cfg.patient.title || "PATIENT DEMOGRAPHICS"}</span>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <CardFieldsList sectionKey="patient" settings={cfg} data={data} />
              </div>
            </div>
          )}

          {/* Card 2: Admission Particulars */}
          {cfg.admission.enabled && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
              <div
                className="px-3.5 py-1.5 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5"
                style={{ background: "#F1F5F9", color: primaryColor }}
              >
                <Icon name="LuClipboardList" size={13} className="text-sky-700" />
                <span>{cfg.admission.title || "ADMISSION & STAY PARTICULARS"}</span>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <CardFieldsList sectionKey="admission" settings={cfg} data={data} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. Discharge Vitals Horizontal Status Bar ── */}
      {cfg.vitals.enabled && (
        <div className="mb-3.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
            <Icon name="LuActivity" size={13} className="text-rose-600" />
            <span>{cfg.vitals.title || "DISCHARGE VITALS (शारीरिक स्थिति)"}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[7.5px] uppercase font-bold text-slate-500">BP</div>
              <div className="text-[10.5px] font-extrabold text-slate-800">{vitalsData.bp || "120/80 mmHg"}</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[7.5px] uppercase font-bold text-slate-500">Pulse</div>
              <div className="text-[10.5px] font-extrabold text-slate-800">{vitalsData.pulse || "76 bpm"}</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[7.5px] uppercase font-bold text-slate-500">Temp</div>
              <div className="text-[10.5px] font-extrabold text-slate-800">{vitalsData.temperature || "98.4 °F"}</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[7.5px] uppercase font-bold text-slate-500">SpO₂</div>
              <div className="text-[10.5px] font-extrabold text-slate-800">{vitalsData.spo2 || "99%"}</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[7.5px] uppercase font-bold text-slate-500">Respiration</div>
              <div className="text-[10.5px] font-extrabold text-slate-800">{vitalsData.respiratoryRate || "18 / min"}</div>
            </div>
            <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 shadow-2xs">
              <div className="text-[7.5px] uppercase font-bold text-emerald-700">Status</div>
              <div className="text-[10px] font-extrabold text-emerald-800">
                {vitalsData.mobility || "Ambulatory"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Clinical Summary & Hospital Course ── */}
      {cfg.diagnosis.enabled && (
        <div className="mb-3.5 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div
            className="px-3.5 py-1.5 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5"
            style={{ background: "#F1F5F9", color: primaryColor }}
          >
            <Icon name="LuStethoscope" size={13} className="text-sky-700" />
            <span>{cfg.diagnosis.title || "CLINICAL SUMMARY & HOSPITAL COURSE"}</span>
          </div>
          <div className="p-3.5 space-y-2.5">
            {/* Primary Diagnosis Highlight Card */}
            {clinicalData.primaryDiagnosis && (
              <div className="p-2.5 rounded-lg bg-sky-50 border-l-4 border-sky-600 border border-sky-200">
                <div className="text-[8px] uppercase font-extrabold tracking-wider text-sky-800">
                  Final Clinical Diagnosis (अंतिम निदान):
                </div>
                <div className="text-[12px] font-bold text-slate-900 mt-0.5">
                  {clinicalData.primaryDiagnosis}
                </div>
                {clinicalData.secondaryDiagnosis && (
                  <div className="text-[9px] text-slate-600 mt-1">
                    <strong>Associated Diagnoses / Comorbidities:</strong> {clinicalData.secondaryDiagnosis}
                  </div>
                )}
              </div>
            )}

            {/* Complaints & History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[9px]">
              {clinicalData.chiefComplaints && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Chief Complaints on Admission:</span>
                  <span className="text-slate-800 leading-relaxed">{clinicalData.chiefComplaints}</span>
                </div>
              )}
              {clinicalData.history && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Relevant Medical &amp; Clinical History:</span>
                  <span className="text-slate-800 leading-relaxed">{clinicalData.history}</span>
                </div>
              )}
            </div>

            {/* Hospital Course */}
            {clinicalData.hospitalCourse && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[9px]">
                <span className="font-bold text-slate-700 block mb-0.5">Hospital Stay &amp; Clinical Course:</span>
                <p className="text-slate-800 leading-relaxed m-0">{clinicalData.hospitalCourse}</p>
              </div>
            )}

            {/* Procedures & Investigations */}
            {(clinicalData.procedures || clinicalData.investigations) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[9px]">
                {clinicalData.procedures && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-0.5">Procedures Performed:</span>
                    <span className="text-slate-800">{clinicalData.procedures}</span>
                  </div>
                )}
                {clinicalData.investigations && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-0.5">Key Investigation Findings:</span>
                    <span className="text-slate-800">{clinicalData.investigations}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Discharge Medications Prescription Table ── */}
      {cfg.medicines.enabled && (
        <div className="mb-3.5 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div
            className="px-3.5 py-1.5 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wide flex items-center justify-between"
            style={{ background: "#F1F5F9", color: primaryColor }}
          >
            <div className="flex items-center gap-1.5">
              <Icon name="LuPill" size={13} className="text-sky-700" />
              <span>{cfg.medicines.title || "DISCHARGE MEDICATIONS & DOSAGE REGIMEN"}</span>
            </div>
            <span className="text-[8.5px] font-semibold text-slate-500">
              {(data.medicines || []).length} Prescribed
            </span>
          </div>

          <div className="p-3">
            {cfg.medicines.note && (
              <p className="text-[8.5px] italic text-slate-500 mb-2">
                ⚠ {cfg.medicines.note}
              </p>
            )}

            {(data.medicines || []).length > 0 ? (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full border-collapse text-left text-[9px]">
                  <thead>
                    <tr style={{ background: primaryColor, color: "#ffffff" }}>
                      {enabledMedicineColumns.map((col) => (
                        <th
                          key={col.key}
                          style={{ width: `${col.width}%` }}
                          className="px-2.5 py-2 font-bold uppercase text-[8px] tracking-wider border-r border-sky-900 last:border-0"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data.medicines || []).map((med, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                        {enabledMedicineColumns.map((col) => (
                          <td key={col.key} className="px-2.5 py-1.5 align-middle text-slate-800">
                            {col.key === "sr" ? (
                              <span className="font-bold text-slate-400">{idx + 1}</span>
                            ) : col.key === "medicine" ? (
                              <strong className="text-slate-900 font-bold">{med.name}</strong>
                            ) : col.key === "dose" ? (
                              <span className="bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded font-bold text-[8px] border border-sky-200 inline-block">
                                {med.dose || "1 Tab"}
                              </span>
                            ) : col.key === "instructions" ? (
                              <span className="italic text-slate-600">{med.instructions}</span>
                            ) : (
                              valueForMedicine(med, col.key, idx)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : cfg.medicines.showEmptyState ? (
              <div className="text-[9px] italic text-slate-400 text-center py-2">
                No discharge medications prescribed. Follow-up consultation as advised.
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── 6. Discharge Advice & Emergency Guidance ── */}
      {cfg.advice.enabled && (
        <div className="mb-3.5 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div
            className="px-3.5 py-1.5 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5"
            style={{ background: "#F1F5F9", color: primaryColor }}
          >
            <Icon name="LuCalendarCheck" size={13} className="text-sky-700" />
            <span>{cfg.advice.title || "DISCHARGE ADVICE & FOLLOW-UP"}</span>
          </div>

          <div className="p-3.5 space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[9px]">
              {/* Review Date Pill */}
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 flex items-center gap-3">
                <div className="p-2 bg-sky-600 text-white rounded-lg shrink-0">
                  <Icon name="LuCalendar" size={18} />
                </div>
                <div>
                  <div className="text-[8px] uppercase font-bold text-sky-700">Next OPD Review Date</div>
                  <div className="text-[12px] font-extrabold text-sky-950 mt-0.5">
                    {adviceData.followUpDate || "After 5 Days"}
                  </div>
                  <div className="text-[8.5px] font-semibold text-sky-800">
                    {adviceData.followUpDepartment || "General Medicine OPD"}
                  </div>
                </div>
              </div>

              {/* Diet & Activity Advice */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div>
                  <strong className="text-slate-700">Dietary Advice:</strong>{" "}
                  <span className="text-slate-800">{adviceData.diet || "Standard Light Diet"}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Physical Activity:</strong>{" "}
                  <span className="text-slate-800">{adviceData.activity || "Adequate rest. Avoid strenuous exertion."}</span>
                </div>
              </div>
            </div>

            {/* Emergency Red Flags Box */}
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-950 text-[9px]">
              <div className="font-extrabold flex items-center gap-1.5 text-red-800 mb-0.5 text-[9.5px]">
                <Icon name="LuAlertTriangle" size={14} className="text-red-600" />
                <span>EMERGENCY WARNING SIGNS (खतरे के संकेत - तुरंत अस्पताल आएं):</span>
              </div>
              <p className="m-0 leading-relaxed text-red-900">
                {adviceData.warningSigns ||
                  "High fever (>100.4°F), sudden breathlessness, severe pain, persistent vomiting, or bleeding."}
              </p>
              <div className="mt-1 font-bold text-red-800">
                24×7 Emergency Helpline: {adviceData.emergencyContact || "+91 7388660408 / +91 744 2450000"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Billing Summary & Conditional No Dues Certificate ── */}
      {cfg.billing.enabled && (
        <div className="mb-3.5 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div
            className="px-3.5 py-1.5 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wide flex items-center justify-between"
            style={{ background: "#F1F5F9", color: primaryColor }}
          >
            <div className="flex items-center gap-1.5">
              <Icon name="LuIndianRupee" size={13} className="text-sky-700" />
              <span>{cfg.billing.title || "FINANCIAL CLEARANCE & BILLING SUMMARY"}</span>
            </div>
          </div>

          <div className="p-3.5">
            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
              {cfg.billing.fields.totalCharges.show && (
                <div className="p-2 rounded-lg border border-slate-200 bg-white text-center shadow-2xs">
                  <div className="text-[7.5px] uppercase font-bold text-slate-500">
                    {cfg.billing.fields.totalCharges.label}
                  </div>
                  <div className="text-[12px] font-extrabold text-slate-800">{money(bill.total)}</div>
                </div>
              )}
              {cfg.billing.fields.amountPaid.show && (
                <div className="p-2 rounded-lg border border-slate-200 bg-white text-center shadow-2xs">
                  <div className="text-[7.5px] uppercase font-bold text-slate-500">
                    {cfg.billing.fields.amountPaid.label}
                  </div>
                  <div className="text-[12px] font-extrabold text-emerald-700">{money(bill.paid)}</div>
                </div>
              )}
              {cfg.billing.fields.balance.show && (
                <div className="p-2 rounded-lg border border-slate-200 bg-white text-center shadow-2xs">
                  <div className="text-[7.5px] uppercase font-bold text-slate-500">
                    {cfg.billing.fields.balance.label}
                  </div>
                  <div
                    className={`text-[12px] font-extrabold ${
                      bill.due > 0 ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {money(bill.due)}
                  </div>
                </div>
              )}
              {cfg.billing.fields.clearanceStatus.show && (
                <div className="p-2 rounded-lg border border-slate-200 bg-white text-center shadow-2xs">
                  <div className="text-[7.5px] uppercase font-bold text-slate-500">
                    {cfg.billing.fields.clearanceStatus.label}
                  </div>
                  <div
                    className={`text-[9.5px] font-extrabold uppercase ${
                      bill.cleared ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {bill.cleared ? "NO DUES CLEARED" : bill.due > 0 ? "BALANCE DUE" : "UNVERIFIED"}
                  </div>
                </div>
              )}
            </div>

            {/* Official No Dues Banner enforcing the strict clearance rule */}
            {cfg.billing.showNoDuesCertificate && (
              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 ${
                  bill.cleared
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                    : "bg-amber-50 border-amber-300 text-amber-950"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    name={bill.cleared ? "LuCheckCircle" : "LuAlertTriangle"}
                    size={22}
                    className={bill.cleared ? "text-emerald-600 shrink-0" : "text-amber-600 shrink-0"}
                  />
                  <div>
                    <div className="font-extrabold text-[10.5px]">
                      {bill.cleared
                        ? "OFFICIAL HOSPITAL NO DUES CERTIFICATE"
                        : "FINANCIAL CLEARANCE PENDING"}
                    </div>
                    <div className="text-[8.5px] opacity-90 mt-0.5">
                      {bill.cleared
                        ? "All Inpatient Medical, Nursing, Bed & Pharmacy charges have been verified and fully cleared in hospital accounts."
                        : `Patient has pending balance of ${money(bill.due)}. Clearance not complete.`}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`px-2 py-1 rounded text-[8.5px] font-extrabold border ${
                      bill.cleared
                        ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                        : "bg-amber-100 border-amber-400 text-amber-800"
                    }`}
                  >
                    {bill.cleared ? "NIL DUES · 100% CLEARED" : `DUE: ${money(bill.due)}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 8. Handover Details ── */}
      {cfg.handover.enabled && (
        <div className="mb-3.5 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div
            className="px-3.5 py-1.5 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5"
            style={{ background: "#F1F5F9", color: primaryColor }}
          >
            <Icon name="LuFolderCheck" size={13} className="text-sky-700" />
            <span>{cfg.handover.title || "PATIENT HANDOVER & DOCUMENTS"}</span>
          </div>
          <div className="p-3 text-[9px] space-y-1">
            <div><strong>Documents Handed Over:</strong> {handoverData.documents || "Discharge summary, reports."}</div>
            <div><strong>Personal Belongings:</strong> {handoverData.belongings || "Returned to attendant."}</div>
            <div><strong>Implants / Lines:</strong> {handoverData.devices || "Safely removed prior to release."}</div>
          </div>
        </div>
      )}

      {/* ── 9. Custom Sections ── */}
      {(cfg.customSections || [])
        .filter((sec) => sec.enabled)
        .map((sec) => (
          <div key={sec.id} className="mb-3.5 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div
              className="px-3.5 py-1.5 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wide"
              style={{ background: "#F1F5F9", color: primaryColor }}
            >
              {sec.title}
            </div>
            <div className="p-3 text-[9.5px] whitespace-pre-wrap leading-relaxed text-slate-800">
              {sec.content || "—"}
            </div>
          </div>
        ))}

      {/* ── 10. Signatures & Official Stamp ── */}
      {cfg.signatures.enabled && (
        <div className="mt-5 pt-3 border-t border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {cfg.signatures.showPatient && (
              <div className="sig-slot">
                <div className="h-10"></div>
                <div className="border-t border-slate-700 pt-1 text-[8.5px] font-bold text-slate-800">
                  {cfg.signatures.patientLabel}
                </div>
              </div>
            )}
            {cfg.signatures.showNurse && (
              <div className="sig-slot">
                <div className="h-10"></div>
                <div className="border-t border-slate-700 pt-1 text-[8.5px] font-bold text-slate-800">
                  {cfg.signatures.nurseLabel}
                </div>
              </div>
            )}
            {cfg.signatures.showResident && (
              <div className="sig-slot">
                <div className="h-10"></div>
                <div className="border-t border-slate-700 pt-1 text-[8.5px] font-bold text-slate-800">
                  {cfg.signatures.residentLabel}
                </div>
              </div>
            )}
            {cfg.signatures.showConsultant && (
              <div className="sig-slot">
                <div className="h-10 flex items-end justify-center pb-1">
                  <span className="text-[10px] font-bold text-sky-900">
                    {admissionData.consultant || "Consultant"}
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-1 text-[8.5px] font-bold text-slate-800">
                  {cfg.signatures.consultantLabel}
                </div>
              </div>
            )}
          </div>

          {cfg.signatures.showStamp && (
            <div className="mt-3.5 flex justify-end">
              <div className="border-2 border-dashed border-slate-300 rounded-lg px-6 py-2 text-center text-[7.5px] font-extrabold text-slate-400 tracking-widest uppercase">
                Narayan Hospital<br />Official Seal &amp; Verified
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 11. Footer ── */}
      {cfg.footer.enabled && (
        <footer className="mt-4 pt-2.5 border-t border-slate-200 text-[8px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
          <div>
            <b>{cfg.hospital.name}</b> • {cfg.hospital.address} • {cfg.hospital.phone}
            {cfg.footer.showDisclaimer && <div className="mt-0.5">{cfg.footer.disclaimer}</div>}
          </div>
          <div className="text-right shrink-0">
            {cfg.footer.closingText && <div className="font-semibold text-sky-900">{cfg.footer.closingText}</div>}
            <div className="text-slate-400 mt-0.5">Printed: {data.generatedAt || new Date().toLocaleString("en-IN")}</div>
          </div>
        </footer>
      )}
    </div>
  );
}

function Signature({ label }) {
  return <div className="pt-5"><div className="border-t border-slate-700 pt-1 text-[8px] font-bold">{label}</div></div>;
}

function SettingsEditor({ group, settings, update, updateAt }) {
  const key = group.key;
  const config = settings[key];
  const fields = FIELD_HINTS[key] || [];

  if (key === "hospital") return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {[["name", "Hospital name"], ["subtitle", "Subtitle"], ["registrationNo", "Registration number"], ["address", "Full address"], ["phone", "Phone"], ["email", "Email"], ["logoUrl", "Logo image URL"]].map(([name, label]) => <label key={name} className="space-y-1 text-xs font-medium text-slate-600">{label}<input value={config[name] || ""} onChange={(event) => update(`hospital.${name}`, event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" /></label>)}
    <div className="sm:col-span-2 space-y-2 rounded-lg bg-slate-50 p-3">
      {[["header.showLogo", "Show logo"], ["header.showSubtitle", "Show subtitle"], ["header.showRegistrationNo", "Show registration number"], ["header.showAddress", "Show address"], ["header.showContact", "Show phone / email"], ["header.showDocumentLabel", "Show document title"]].map(([path, label]) => <label key={path} className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={getPath(settings, path)} onChange={(event) => update(path, event.target.checked)} className="h-4 w-4" />{label}</label>)}
      <label className="block space-y-1 pt-2 text-xs font-medium text-slate-600">Printed document title<input value={settings.header.title} onChange={(event) => update("header.title", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" /></label>
    </div>
  </div>;

  if (key === "page") return <div className="grid grid-cols-2 gap-3">
    {[["style.primary", "Primary color"], ["style.accent", "Accent color"], ["style.text", "Text color"], ["style.muted", "Muted text"], ["style.border", "Border color"], ["style.sectionBackground", "Section background"]].map(([path, label]) => <label key={path} className="space-y-1 text-xs font-medium text-slate-600">{label}<input type="color" value={getPath(settings, path)} onChange={(event) => update(path, event.target.value)} className="h-9 w-full cursor-pointer rounded border border-slate-200 p-1" /></label>)}
    <label className="space-y-1 text-xs font-medium text-slate-600">Paper size<select value={settings.page.size} onChange={(event) => update("page.size", event.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2"><option>A4</option><option>A5</option><option>Letter</option></select></label>
    <label className="space-y-1 text-xs font-medium text-slate-600">Orientation<select value={settings.page.orientation} onChange={(event) => update("page.orientation", event.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
    <label className="space-y-1 text-xs font-medium text-slate-600">Font size (px)<input type="number" min="7" max="14" value={settings.style.fontSize} onChange={(event) => update("style.fontSize", Number(event.target.value))} className="w-full rounded-lg border border-slate-300 px-2 py-2" /></label>
    <label className="space-y-1 text-xs font-medium text-slate-600">Page margin (mm)<input type="number" min="4" max="20" value={settings.page.margin} onChange={(event) => update("page.margin", Number(event.target.value))} className="w-full rounded-lg border border-slate-300 px-2 py-2" /></label>
    <label className="col-span-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={settings.style.compact} onChange={(event) => update("style.compact", event.target.checked)} />Compact layout (reduced spacing)</label>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={settings.page.showGeneratedAt} onChange={(event) => update("page.showGeneratedAt", event.target.checked)} />Show generated timestamp</label>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={settings.page.showPageNumber} onChange={(event) => update("page.showPageNumber", event.target.checked)} />Show page number</label>
  </div>;

  if (key === "customSections") return <CustomSectionsEditor sections={settings.customSections || []} setSections={(value) => update("customSections", value)} />;

  if (key === "signatures") return <div className="space-y-3">
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={config.enabled} onChange={(event) => update("signatures.enabled", event.target.checked)} />Print signature area</label>
    {[["showPatient", "Patient / attendant"], ["showNurse", "Discharging nurse"], ["showResident", "Resident medical officer"], ["showConsultant", "Treating consultant"], ["showStamp", "Hospital seal / stamp"]].map(([name, label]) => <label key={name} className="flex items-center gap-2 border-b border-slate-100 py-2 text-xs"><input type="checkbox" checked={config[name]} onChange={(event) => update(`signatures.${name}`, event.target.checked)} />{label}</label>)}
    {[["patientLabel", "Patient signature label"], ["nurseLabel", "Nurse signature label"], ["residentLabel", "Resident signature label"], ["consultantLabel", "Consultant signature label"]].map(([name, label]) => <label key={name} className="block space-y-1 text-xs text-slate-600">{label}<input value={config[name]} onChange={(event) => update(`signatures.${name}`, event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></label>)}
  </div>;

  if (key === "footer") return <div className="space-y-3">
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={config.enabled} onChange={(event) => update("footer.enabled", event.target.checked)} />Print footer</label>
    {[["showHospitalName", "Show hospital name"], ["showAddress", "Show address"], ["showPhone", "Show phone"], ["showDisclaimer", "Show medical-record disclaimer"]].map(([name, label]) => <label key={name} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={config[name]} onChange={(event) => update(`footer.${name}`, event.target.checked)} />{label}</label>)}
    <label className="block space-y-1 text-xs text-slate-600">Disclaimer<textarea value={config.disclaimer} onChange={(event) => update("footer.disclaimer", event.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 p-2" /></label>
    <label className="block space-y-1 text-xs text-slate-600">Closing message<input value={config.closingText} onChange={(event) => update("footer.closingText", event.target.value)} className="w-full rounded-lg border border-slate-300 p-2" /></label>
  </div>;

  if (key === "medicines") return <div className="space-y-3">
    <SectionToggle enabled={config.enabled} onChange={(value) => update("medicines.enabled", value)} />
    <label className="block space-y-1 text-xs text-slate-600">Section title<input value={config.title} onChange={(event) => update("medicines.title", event.target.value)} className="w-full rounded-lg border border-slate-300 p-2" /></label>
    <label className="block space-y-1 text-xs text-slate-600">Instruction shown above medicines<textarea rows={2} value={config.note} onChange={(event) => update("medicines.note", event.target.value)} className="w-full rounded-lg border border-slate-300 p-2" /></label>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={config.showEmptyState} onChange={(event) => update("medicines.showEmptyState", event.target.checked)} />Show “No discharge medicines prescribed” when list is empty</label>
    <div className="rounded-lg border border-slate-200 p-3"><div className="mb-2 text-xs font-bold">Medicine table columns</div>{config.columns.map((column, index) => <div key={column.key} className="grid grid-cols-[1fr_1fr_60px] items-center gap-2 border-b border-slate-100 py-2 last:border-0"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={column.show} onChange={(event) => updateAt("medicines.columns", index, "show", event.target.checked)} />{column.key}</label><input value={column.label} onChange={(event) => updateAt("medicines.columns", index, "label", event.target.value)} className="min-w-0 rounded border border-slate-200 px-2 py-1 text-xs" /><input type="number" min="1" max="60" value={column.width} onChange={(event) => updateAt("medicines.columns", index, "width", Number(event.target.value))} className="w-full rounded border border-slate-200 px-1 py-1 text-xs" title="Suggested width %" /></div>)}</div>
  </div>;

  if (key === "billing") return <div className="space-y-3">
    <SectionToggle enabled={config.enabled} onChange={(value) => update("billing.enabled", value)} />
    <label className="block space-y-1 text-xs text-slate-600">Section title<input value={config.title} onChange={(event) => update("billing.title", event.target.value)} className="w-full rounded-lg border border-slate-300 p-2" /></label>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={config.showNoDuesCertificate} onChange={(event) => update("billing.showNoDuesCertificate", event.target.checked)} />Show conditional no-dues / pending-clearance certificate</label>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={config.showDepartmentBreakdown} onChange={(event) => update("billing.showDepartmentBreakdown", event.target.checked)} />Show department-wise settlement (room, pharmacy, lab, etc.)</label>
    <FieldList sectionKey={key} settings={settings} update={update} />
    <p className="rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">The print handler only shows “NO DUES” when the billing payload explicitly says <code>isCleared: true</code> and the outstanding balance is zero. Otherwise it prints a pending-clearance message and the balance.</p>
  </div>;

  if (key === "admission" || key === "patient" || key === "diagnosis" || key === "vitals" || key === "advice" || key === "handover") return <div className="space-y-3">
    <SectionToggle enabled={config.enabled} onChange={(value) => update(`${key}.enabled`, value)} />
    <label className="block space-y-1 text-xs text-slate-600">Section heading<input value={config.title} onChange={(event) => update(`${key}.title`, event.target.value)} className="w-full rounded-lg border border-slate-300 p-2" /></label>
    <FieldList sectionKey={key} settings={settings} update={update} />
  </div>;

  return <div className="text-xs text-slate-500">Choose a section to configure its print options.</div>;
}

function FieldList({ sectionKey, settings, update }) {
  const fields = settings[sectionKey].fields;
  return <div className="rounded-lg border border-slate-200 p-3"><div className="mb-1 grid grid-cols-[minmax(0,1fr)_minmax(140px,220px)_66px] gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><span>Field</span><span>Printed label</span><span className="text-right">Include</span></div>{(FIELD_HINTS[sectionKey] || []).map((name) => <FieldRow key={name} path={`${sectionKey}.fields.${name}`} field={fields[name]} onUpdate={update} />)}</div>;
}

function CustomSectionsEditor({ sections, setSections }) {
  const add = () => setSections([...sections, { id: `custom-${Date.now()}`, title: "Additional information", enabled: true, content: "" }]);
  const update = (index, key, value) => setSections(sections.map((section, i) => i === index ? { ...section, [key]: value } : section));
  return <div className="space-y-3">
    <p className="text-xs leading-relaxed text-slate-500">Add optional hospital-specific information such as implant details, blood transfusion details, insurance notes or special instructions. Each custom section can be renamed, edited, hidden or removed.</p>
    {sections.map((section, index) => <div key={section.id} className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between gap-2"><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={section.enabled} onChange={(event) => update(index, "enabled", event.target.checked)} />Include section</label><button type="button" onClick={() => setSections(sections.filter((_, i) => i !== index))} className="text-xs font-semibold text-red-600 hover:text-red-700">Remove</button></div>
      <input value={section.title} onChange={(event) => update(index, "title", event.target.value)} placeholder="Section heading" className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" />
      <textarea value={section.content} onChange={(event) => update(index, "content", event.target.value)} rows={4} placeholder="Text / instructions to print" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" />
    </div>)}
    <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-sky-400 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800"><Icon name="LuPlus" size={14} /> Add custom section</button>
  </div>;
}

export default function IPDDischargePrintSettings() {
  const [settings, setSettings] = useState(() => cloneIPDSettings(DEFAULT_IPD_DISCHARGE_SETTINGS));
  const [activeGroup, setActiveGroup] = useState("patient");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [status, setStatus] = useState(null);
  const [sampleData, setSampleData] = useState(SAMPLE_IPD_DISCHARGE);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await settingsService.getSetting(IPD_DISCHARGE_SETTINGS_KEY);
        const saved = response?.data?.value ?? response?.data?.settings ?? response?.data ?? response?.value ?? response;
        if (alive && saved && typeof saved === "object") setSettings(mergeIPDSettings(cloneIPDSettings(DEFAULT_IPD_DISCHARGE_SETTINGS), saved));
      } catch (error) {
        console.warn("Could not load IPD discharge print settings:", error);
        if (alive) setStatus({ type: "error", message: "Saved settings could not be loaded. You can still edit defaults and save them." });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const update = (path, value) => setSettings((current) => setPath(current, path, value));
  const updateAt = (path, index, key, value) => setSettings((current) => {
    const items = [...getPath(current, path)];
    items[index] = { ...items[index], [key]: value };
    return setPath(current, path, items);
  });
  const save = async () => {
    try {
      setSaving(true);
      setStatus(null);
      await settingsService.updateSetting(IPD_DISCHARGE_SETTINGS_KEY, settings);
      setStatus({ type: "success", message: "IPD discharge print settings saved." });
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.message || error?.message || "Could not save settings." });
    } finally { setSaving(false); }
  };
  const reset = () => {
    if (window.confirm("Reset IPD discharge print settings to the recommended defaults?")) {
      setSettings(cloneIPDSettings(DEFAULT_IPD_DISCHARGE_SETTINGS));
      setStatus({ type: "success", message: "Defaults restored. Save settings to persist the changes." });
    }
  };
  const testPrint = () => IPDDischargePrintHandler.printDischargeSummary(sampleData, settings);

  const currentGroup = GROUPS.find((group) => group.key === activeGroup) || GROUPS[0];
  const enabledCount = useMemo(() => ["patient", "admission", "diagnosis", "vitals", "billing", "medicines", "advice", "handover"].filter((key) => settings[key].enabled).length + (settings.customSections || []).filter((item) => item.enabled).length, [settings]);

  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
      <div><h2 className="text-lg font-bold text-slate-900">IPD Discharge Summary Designer</h2><p className="mt-1 max-w-2xl text-xs text-slate-500">Choose what appears on the final discharge summary, no-dues certificate, medicine sheet and patient instructions.</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={reset} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Reset defaults</button>
        <button type="button" onClick={() => setShowPreview((value) => !value)} className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">{showPreview ? "Hide preview" : "Show preview"}</button>
        <button type="button" onClick={testPrint} className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-900"><Icon name="LuPrinter" size={14} /> Test print</button>
        <button type="button" onClick={save} disabled={saving || loading} className="inline-flex items-center gap-2 rounded-lg bg-sky-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Icon name="LuSave" size={14} />{saving ? "Saving…" : "Save settings"}</button>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"><span className="font-bold text-slate-800">{enabledCount} sections enabled</span><span>·</span><span>{settings.page.size} {settings.page.orientation}</span><span>·</span><span>Fields with “Print” checked appear on the slip</span></div>
    {status && <div role="status" className={`rounded-lg border p-3 text-xs ${status.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{status.message}</div>}

    {loading ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading discharge print settings…</div> : <div className={`grid items-start gap-5 ${showPreview ? "grid-cols-1 2xl:grid-cols-[minmax(350px,0.82fr)_minmax(620px,1.35fr)]" : "grid-cols-1"}`}>
      <div className="min-w-0 space-y-3">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4">
          {GROUPS.map((group) => {
            const hasToggle = ["patient", "admission", "diagnosis", "vitals", "billing", "medicines", "advice", "handover"].includes(group.key);
            const isEnabled = hasToggle ? settings[group.key]?.enabled !== false : true;
            return (
              <button
                type="button"
                key={group.key}
                onClick={() => setActiveGroup(group.key)}
                className={`flex min-h-9 items-center justify-between gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-semibold transition-all ${
                  activeGroup === group.key
                    ? "border-sky-800 bg-sky-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Icon name={group.icon} size={14} className={activeGroup === group.key ? "text-sky-200" : "text-slate-500"} />
                  <span className="truncate">{group.title}</span>
                </div>
                {hasToggle && (
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      isEnabled
                        ? activeGroup === group.key
                          ? "bg-emerald-300"
                          : "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                    title={isEnabled ? "Section Enabled" : "Section Disabled"}
                  />
                )}
              </button>
            );
          })}
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><Icon name={currentGroup.icon} size={18} /><h3 className="text-sm font-bold text-slate-800">{currentGroup.title}</h3></div>{["patient", "admission", "diagnosis", "vitals", "advice", "handover"].includes(activeGroup) && <SectionToggle enabled={settings[activeGroup].enabled} onChange={(value) => update(`${activeGroup}.enabled`, value)} />}</div>
          <SettingsEditor group={currentGroup} settings={settings} update={update} updateAt={updateAt} />
        </section>
      </div>

      {showPreview && <div className="min-w-0 space-y-2 2xl:sticky 2xl:top-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"><span className="inline-flex items-center gap-2 font-bold text-slate-700"><Icon name="LuEye" size={15} />Live discharge summary preview</span><span className="text-slate-500">Sample patient data · settings update instantly</span></div>
        <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-200 p-3"><IPDDischargePreview settings={settings} data={sampleData} /></div>
      </div>}
    </div>}
  </div>;
}

export { IPDDischargePreview, DEFAULT_IPD_DISCHARGE_SETTINGS, SAMPLE_IPD_DISCHARGE };
