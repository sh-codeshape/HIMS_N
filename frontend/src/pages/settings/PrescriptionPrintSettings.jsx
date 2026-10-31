import React, { useEffect, useMemo, useState } from "react";
import Icon from "../../components/common/Icon.jsx";
import settingsService from "../../api/services/settingsService.js";
import DoctorPrescriptionPrintHandler from "../../services/DoctorPrescriptionPrintHandler.js";

/**
 * Prescription print designer.
 *
 * Persisted independently from OPD/IPD admission slip settings:
 *   print_slip_prescription
 *
 * The preview is driven by the same configuration object that is saved.
 * The print handler must also consume this config (integration note below).
 */

const DEFAULT_PRESCRIPTION_SETTINGS = {
  hospital: {
    name: "Narayan Hospital",
    subtitle: "Super Speciality Healthcare & Research Institute",
    registrationNo: "REG/UP/2024/098",
    address: "Jansa, Varanasi, Uttar Pradesh, 221405",
    phone: "+91 7388660408",
    logo: { src: "/images/Narayan_Logo.png", show: true, height: 48, maxWidth: 160 },
  },
  styling: {
    primaryColor: "#0B3B60",
    accentColor: "#0284C7",
    headerBackground: "#FFFFFF",
    sectionBackground: "#E0F2FE",
    borderColor: "#CBD5E1",
    textColor: "#0F172A",
    mutedColor: "#64748B",
    borderRadius: 6,
    fontFamily: "Arial, sans-serif",
    fontSize: 10,
    density: "normal",
  },
  page: {
    size: "A4",
    orientation: "portrait",
    margin: 8,
    showPageNumber: false,
    repeatHeader: true,
  },
  header: {
    title: "DOCTOR'S PRESCRIPTION",
    showLogo: true,
    showSubtitle: true,
    showRegistrationNo: true,
    showHospitalAddress: true,
    showHospitalPhone: true,
    showGeneratedAt: true,
    showDoctorName: true,
    showDoctorQualification: true,
  },
  patient: {
    title: "PATIENT DETAILS",
    showUHID: true,
    showPatientName: true,
    showAgeGender: true,
    showMobile: true,
    showAddress: true,
    showBloodGroup: true,
    showPatientStatus: true,
    labels: {
      uhid: "UHID",
      name: "Patient Name",
      ageGender: "Age / Gender",
      mobile: "Mobile",
      address: "Address",
      bloodGroup: "Blood Group",
    },
  },
  encounter: {
    title: "VISIT / ADMISSION DETAILS",
    showVisitType: true,
    showEncounterNo: true,
    showToken: true,
    showDate: true,
    showDoctor: true,
    showDepartment: true,
    showWardBed: true,
    showAdmissionDate: true,
    showDischargeDate: false,
  },
  vitals: {
    enabled: true,
    title: "VITALS",
    showBP: true,
    showPulse: true,
    showTemperature: true,
    showSpO2: true,
    showWeight: true,
    showHeight: true,
    showRespiratoryRate: false,
    showBloodSugar: false,
  },
  diagnosis: {
    enabled: true,
    title: "CLINICAL DIAGNOSIS",
    showChiefComplaints: true,
    showDiagnosis: true,
    showHistory: true,
    showDoctorNotes: true,
    minHeight: 90,
  },
  medicines: {
    enabled: true,
    title: "PRESCRIBED MEDICINES",
    showGeneral: true,
    showFemalePartner: true,
    showMalePartner: true,
    showEmptySection: false,
    showCheckboxColumn: true,
    groupTitles: {
      general: "GENERAL MEDICATIONS",
      female: "FEMALE PARTNER MEDICATIONS",
      male: "MALE PARTNER MEDICATIONS",
    },
    columns: [
      { key: "sr", label: "Sr. No.", visible: true, width: 6 },
      { key: "medicine", label: "Medicine Name", visible: true, width: 28 },
      { key: "dosage", label: "Dosage", visible: true, width: 18 },
      { key: "frequency", label: "Frequency", visible: true, width: 16 },
      { key: "duration", label: "Duration", visible: true, width: 14 },
      { key: "remarks", label: "Instructions / Remarks", visible: true, width: 18 },
    ],
  },
  investigations: {
    enabled: true,
    title: "ORDERED INVESTIGATIONS",
    showGeneral: true,
    showFemalePartner: true,
    showMalePartner: true,
    showCheckboxColumn: true,
    columns: [
      { key: "sr", label: "Sr. No.", visible: true, width: 8 },
      { key: "test", label: "Investigation / Test", visible: true, width: 52 },
      { key: "remarks", label: "Remarks", visible: true, width: 32 },
    ],
  },
  advice: {
    enabled: true,
    title: "ADDITIONAL ADVICE",
    showFollowUp: true,
    showDietAdvice: true,
    showLifestyleAdvice: true,
    showGeneralAdvice: true,
  },
  signature: {
    showDoctorSignature: true,
    doctorSignatureLabel: "Doctor's Signature",
    showHospitalStamp: true,
    hospitalStampLabel: "HOSPITAL STAMP",
    showDate: true,
  },
  footer: {
    showFooter: true,
    showNotice: true,
    notice: "Please follow the prescribed instructions and attend your follow-up appointment.",
    showHelpline: true,
    helplineLabel: "Helpline",
    helplineNumber: "+91 7388660408",
    showAddress: true,
    showPageFooterText: true,
    pageFooterText: "Thank you for choosing us. We wish you a speedy recovery.",
  },
};

const SAMPLE_BOOKING = {
  type: "HOSPITALIZATION",
  uhid: "NH-2026-00442",
  token_number: "IPD-0261",
  patient_name: "Adeesh Kumar",
  age: "44",
  gender: "Male",
  mobile: "7287901826",
  address: "Jansa, Varanasi, Uttar Pradesh, 221405",
  blood_group: "B+",
  isOld: true,
  preferredDate: "31 Oct 2026",
  encounter_no: "IPD-26-0044",
  doctor_name: "Dr. Adeesh Singh",
  doctor_qualification: "MBBS, MD",
  department: "General Medicine",
  ward: "General Ward",
  bed_number: "B-12",
  admission_date: "28 Oct 2026",
  discharge_date: "31 Oct 2026",
  prescription: {
    vitals: { bp: "120/80 mmHg", pulse: "78 bpm", temperature: "98.6 °F", spo2: "98%", weight: "68 kg", height: "172 cm", respiratory_rate: "18/min", blood_sugar: "108 mg/dL" },
    chief_complaints: "Fever and general weakness",
    diagnosis: "Acute febrile illness (sample data)",
    history: "Symptoms started three days before admission.",
    doctor_notes: "Patient examined. Continue medicines as directed and return for review if symptoms worsen.",
    medicines: [
      { target: "General", dosage_form: "TAB", name: "Medicine A", dosage: "1 tablet", frequency: "Twice daily", duration: "5 days", remarks: "After food" },
      { target: "Female Partner", dosage_form: "CAP", name: "Medicine B", dosage: "1 capsule", frequency: "Once daily", duration: "3 days", remarks: "As directed" },
      { target: "Male Partner", dosage_form: "TAB", name: "Medicine C", dosage: "1 tablet", frequency: "At night", duration: "5 days", remarks: "After dinner" },
    ],
    tests: [
      { target: "General", name: "Complete Blood Count (CBC)", remarks: "If clinically indicated" },
      { target: "Female Partner", name: "Sample investigation", remarks: "" },
    ],
    additional_advice: ["Maintain adequate hydration", "Take medicines at the prescribed times"],
    follow_up: "Review after 5 days",
    diet_advice: "Balanced diet and adequate fluids",
    lifestyle_advice: "Adequate rest",
  },
};

const CONTROL_GROUPS = [
  {
    title: "Header & hospital identity",
    icon: "LuBuilding2",
    fields: [
      ["hospital.name", "Hospital name", "text"],
      ["hospital.subtitle", "Hospital subtitle", "text"],
      ["hospital.registrationNo", "Registration number", "text"],
      ["hospital.address", "Hospital address", "text"],
      ["hospital.phone", "Hospital phone", "text"],
      ["header.title", "Prescription heading", "text"],
      ["header.showLogo", "Show hospital logo", "toggle"],
      ["header.showSubtitle", "Show subtitle", "toggle"],
      ["header.showRegistrationNo", "Show registration number", "toggle"],
      ["header.showHospitalAddress", "Show hospital address", "toggle"],
      ["header.showHospitalPhone", "Show hospital phone", "toggle"],
      ["header.showGeneratedAt", "Show generated timestamp", "toggle"],
      ["header.showDoctorName", "Show doctor name", "toggle"],
      ["header.showDoctorQualification", "Show doctor qualification", "toggle"],
    ],
  },
  {
    title: "Patient information",
    icon: "LuUserRound",
    fields: [
      ["patient.title", "Section heading", "text"],
      ["patient.showUHID", "Show UHID", "toggle"],
      ["patient.showPatientName", "Show patient name", "toggle"],
      ["patient.showAgeGender", "Show age / gender", "toggle"],
      ["patient.showMobile", "Show mobile number", "toggle"],
      ["patient.showAddress", "Show address", "toggle"],
      ["patient.showBloodGroup", "Show blood group", "toggle"],
      ["patient.showPatientStatus", "Show new / old patient status", "toggle"],
    ],
  },
  {
    title: "Visit & admission details",
    icon: "LuClipboardList",
    fields: [
      ["encounter.title", "Section heading", "text"],
      ["encounter.showVisitType", "Show visit type", "toggle"],
      ["encounter.showEncounterNo", "Show encounter number", "toggle"],
      ["encounter.showToken", "Show token number", "toggle"],
      ["encounter.showDate", "Show appointment / encounter date", "toggle"],
      ["encounter.showDoctor", "Show doctor", "toggle"],
      ["encounter.showDepartment", "Show department", "toggle"],
      ["encounter.showWardBed", "Show ward and bed", "toggle"],
      ["encounter.showAdmissionDate", "Show admission date", "toggle"],
      ["encounter.showDischargeDate", "Show discharge date", "toggle"],
    ],
  },
  {
    title: "Vitals",
    icon: "LuActivity",
    fields: [
      ["vitals.enabled", "Print vitals section", "toggle"],
      ["vitals.title", "Section heading", "text"],
      ["vitals.showBP", "Blood pressure", "toggle"],
      ["vitals.showPulse", "Pulse", "toggle"],
      ["vitals.showTemperature", "Temperature", "toggle"],
      ["vitals.showSpO2", "SpO₂", "toggle"],
      ["vitals.showWeight", "Weight", "toggle"],
      ["vitals.showHeight", "Height", "toggle"],
      ["vitals.showRespiratoryRate", "Respiratory rate", "toggle"],
      ["vitals.showBloodSugar", "Blood sugar", "toggle"],
    ],
  },
  {
    title: "Diagnosis & doctor's notes",
    icon: "LuStethoscope",
    fields: [
      ["diagnosis.enabled", "Print clinical section", "toggle"],
      ["diagnosis.title", "Section heading", "text"],
      ["diagnosis.showChiefComplaints", "Chief complaints", "toggle"],
      ["diagnosis.showDiagnosis", "Diagnosis", "toggle"],
      ["diagnosis.showHistory", "Clinical history", "toggle"],
      ["diagnosis.showDoctorNotes", "Doctor's notes", "toggle"],
      ["diagnosis.minHeight", "Notes area minimum height (px)", "number"],
    ],
  },
  {
    title: "Medicines",
    icon: "LuPill",
    fields: [
      ["medicines.enabled", "Print medicines section", "toggle"],
      ["medicines.title", "Section heading", "text"],
      ["medicines.showGeneral", "Show general medicines", "toggle"],
      ["medicines.showFemalePartner", "Show female partner medicines", "toggle"],
      ["medicines.showMalePartner", "Show male partner medicines", "toggle"],
      ["medicines.showEmptySection", "Show empty medicine groups", "toggle"],
      ["medicines.showCheckboxColumn", "Show medicine checklist column", "toggle"],
      ["medicines.groupTitles.general", "General group heading", "text"],
      ["medicines.groupTitles.female", "Female group heading", "text"],
      ["medicines.groupTitles.male", "Male group heading", "text"],
    ],
  },
  {
    title: "Investigations",
    icon: "LuFlaskConical",
    fields: [
      ["investigations.enabled", "Print investigations section", "toggle"],
      ["investigations.title", "Section heading", "text"],
      ["investigations.showGeneral", "Show general investigations", "toggle"],
      ["investigations.showFemalePartner", "Show female partner investigations", "toggle"],
      ["investigations.showMalePartner", "Show male partner investigations", "toggle"],
      ["investigations.showCheckboxColumn", "Show checklist column", "toggle"],
    ],
  },
  {
    title: "Advice, signature & footer",
    icon: "LuFileSignature",
    fields: [
      ["advice.enabled", "Print advice section", "toggle"],
      ["advice.title", "Advice heading", "text"],
      ["advice.showFollowUp", "Show follow-up advice", "toggle"],
      ["advice.showDietAdvice", "Show diet advice", "toggle"],
      ["advice.showLifestyleAdvice", "Show lifestyle advice", "toggle"],
      ["advice.showGeneralAdvice", "Show general advice", "toggle"],
      ["signature.showDoctorSignature", "Show doctor signature area", "toggle"],
      ["signature.doctorSignatureLabel", "Doctor signature label", "text"],
      ["signature.showHospitalStamp", "Show hospital stamp", "toggle"],
      ["signature.hospitalStampLabel", "Hospital stamp label", "text"],
      ["signature.showDate", "Show signature date", "toggle"],
      ["footer.showFooter", "Show footer", "toggle"],
      ["footer.showNotice", "Show notice", "toggle"],
      ["footer.notice", "Notice text", "text"],
      ["footer.showHelpline", "Show helpline", "toggle"],
      ["footer.helplineLabel", "Helpline label", "text"],
      ["footer.helplineNumber", "Helpline number", "text"],
      ["footer.showAddress", "Show hospital address in footer", "toggle"],
      ["footer.showPageFooterText", "Show closing text", "toggle"],
      ["footer.pageFooterText", "Closing text", "text"],
    ],
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeDeep(base, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return base;
  const result = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object") {
      result[key] = mergeDeep(base[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function getPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function setPath(object, path, value) {
  const keys = path.split(".");
  const next = { ...object };
  let cursor = next;
  let source = object;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
    } else {
      cursor[key] = { ...(source?.[key] || {}) };
      cursor = cursor[key];
      source = source?.[key];
    }
  });
  return next;
}

function Field({ field, settings, onChange }) {
  const [path, label, type] = field;
  const value = getPath(settings, path);
  return (
    <label className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      {type === "toggle" ? (
        <input type="checkbox" checked={value !== false} onChange={(e) => onChange(path, e.target.checked)} className="h-4 w-4 rounded text-sky-700" />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(path, type === "number" ? Number(e.target.value) : e.target.value)}
          className="w-44 max-w-[55%] rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      )}
    </label>
  );
}

function PrescriptionPreview({ settings, booking }) {
  const cfg = settings;
  const rx = booking.prescription || {};
  const primary = cfg.styling.primaryColor;
  const border = cfg.styling.borderColor;
  const text = cfg.styling.textColor;
  const visibleMedColumns = cfg.medicines.columns.filter((column) => column.visible);
  const visibleTestColumns = cfg.investigations.columns.filter((column) => column.visible);
  const groups = [
    { key: "General", title: cfg.medicines.groupTitles.general, show: cfg.medicines.showGeneral },
    { key: "Female Partner", title: cfg.medicines.groupTitles.female, show: cfg.medicines.showFemalePartner },
    { key: "Male Partner", title: cfg.medicines.groupTitles.male, show: cfg.medicines.showMalePartner },
  ];
  const testGroups = [
    { key: "General", title: "GENERAL INVESTIGATIONS", show: cfg.investigations.showGeneral },
    { key: "Female Partner", title: "FEMALE PARTNER INVESTIGATIONS", show: cfg.investigations.showFemalePartner },
    { key: "Male Partner", title: "MALE PARTNER INVESTIGATIONS", show: cfg.investigations.showMalePartner },
  ];
  const vitals = [
    ["BP", "bp", "showBP"], ["Pulse", "pulse", "showPulse"], ["Temperature", "temperature", "showTemperature"],
    ["SpO₂", "spo2", "showSpO2"], ["Weight", "weight", "showWeight"], ["Height", "height", "showHeight"],
    ["Resp. rate", "respiratory_rate", "showRespiratoryRate"], ["Blood sugar", "blood_sugar", "showBloodSugar"],
  ].filter(([, key, flag]) => cfg.vitals[flag] && rx.vitals?.[key]);

  const field = (label, value) => value ? (
    <div className="flex gap-2 text-[10px] leading-4"><b className="min-w-20 text-slate-600">{label}:</b><span className="font-semibold">{value}</span></div>
  ) : null;

  const sectionTitle = (title) => (
    <div className="mb-2 border-b px-2 py-1.5 text-[10px] font-extrabold tracking-wide" style={{ background: cfg.styling.sectionBackground, color: primary, borderColor: border }}>{title}</div>
  );

  return (
    <div className="mx-auto w-full max-w-[794px] bg-white p-5 shadow-xl" style={{ color: text, fontFamily: cfg.styling.fontFamily, fontSize: `${cfg.styling.fontSize}px`, border: `1px solid ${border}`, borderRadius: `${cfg.styling.borderRadius}px` }}>
      <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: border }}>
        <div className="flex items-center gap-3">
          {cfg.header.showLogo && cfg.hospital.logo.show && <img src={cfg.hospital.logo.src} alt="Hospital logo" style={{ height: cfg.hospital.logo.height, maxWidth: cfg.hospital.logo.maxWidth, objectFit: "contain" }} />}
          <div>
            <div className="text-lg font-extrabold leading-tight" style={{ color: primary }}>{cfg.hospital.name}</div>
            {cfg.header.showSubtitle && <div className="text-[10px] text-slate-500">{cfg.hospital.subtitle}</div>}
            {cfg.header.showRegistrationNo && <div className="text-[9px] text-slate-500">Reg. No: {cfg.hospital.registrationNo}</div>}
            <div className="mt-1 text-xs font-bold" style={{ color: cfg.styling.accentColor }}>{cfg.header.title}</div>
          </div>
        </div>
        {cfg.header.showGeneratedAt && <div className="text-right text-[9px] text-slate-500">Generated: 31 Oct 2026<br />Sample preview</div>}
      </div>

      {(cfg.header.showHospitalAddress || cfg.header.showHospitalPhone) && (
        <div className="py-1 text-center text-[9px] text-slate-500">
          {cfg.header.showHospitalAddress && cfg.hospital.address}
          {cfg.header.showHospitalPhone && ` | ${cfg.hospital.phone}`}
        </div>
      )}

      <div className="my-2 grid grid-cols-4 gap-2 rounded border p-2" style={{ background: cfg.styling.sectionBackground, borderColor: border }}>
        {field("UHID", booking.uhid)}
        {field("Token", booking.token_number)}
        {field("Encounter", booking.encounter_no)}
        {field("Date", booking.preferredDate)}
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded border p-2" style={{ borderColor: border }}>
          {sectionTitle(cfg.patient.title)}
          {cfg.patient.showPatientName && field(cfg.patient.labels.name, booking.patient_name)}
          {cfg.patient.showUHID && field(cfg.patient.labels.uhid, booking.uhid)}
          {cfg.patient.showAgeGender && field(cfg.patient.labels.ageGender, `${booking.age} years / ${booking.gender}`)}
          {cfg.patient.showMobile && field(cfg.patient.labels.mobile, booking.mobile)}
          {cfg.patient.showAddress && field(cfg.patient.labels.address, booking.address)}
          {cfg.patient.showBloodGroup && field(cfg.patient.labels.bloodGroup, booking.blood_group)}
          {cfg.patient.showPatientStatus && field("Patient status", booking.isOld ? "Old patient" : "New patient")}
        </div>
        <div className="rounded border p-2" style={{ borderColor: border }}>
          {sectionTitle(cfg.encounter.title)}
          {cfg.encounter.showVisitType && field("Visit type", booking.type === "HOSPITALIZATION" ? "IPD" : "OPD")}
          {cfg.encounter.showEncounterNo && field("Encounter No.", booking.encounter_no)}
          {cfg.encounter.showToken && field("Token", booking.token_number)}
          {cfg.encounter.showDate && field("Date", booking.preferredDate)}
          {cfg.encounter.showDoctor && field("Doctor", `${booking.doctor_name} ${booking.doctor_qualification || ""}`)}
          {cfg.encounter.showDepartment && field("Department", booking.department)}
          {cfg.encounter.showWardBed && field("Ward / Bed", `${booking.ward || ""} / ${booking.bed_number || ""}`)}
          {cfg.encounter.showAdmissionDate && field("Admission", booking.admission_date)}
          {cfg.encounter.showDischargeDate && field("Discharge", booking.discharge_date)}
        </div>
      </div>

      {cfg.vitals.enabled && vitals.length > 0 && (
        <div className="mb-2 rounded border p-2" style={{ borderColor: border }}>
          {sectionTitle(cfg.vitals.title)}
          <div className="grid grid-cols-4 gap-2">{vitals.map(([label, key]) => <div key={key} className="rounded bg-slate-50 p-1.5 text-center"><div className="text-[9px] text-slate-500">{label}</div><b className="text-[10px]">{rx.vitals[key]}</b></div>)}</div>
        </div>
      )}

      {cfg.diagnosis.enabled && (
        <div className="mb-2 rounded border p-2" style={{ borderColor: border }}>
          {sectionTitle(cfg.diagnosis.title)}
          {cfg.diagnosis.showChiefComplaints && field("Chief complaints", rx.chief_complaints)}
          {cfg.diagnosis.showDiagnosis && field("Diagnosis", rx.diagnosis)}
          {cfg.diagnosis.showHistory && field("Clinical history", rx.history)}
          {cfg.diagnosis.showDoctorNotes && <div className="mt-1 whitespace-pre-wrap text-[10px]" style={{ minHeight: cfg.diagnosis.minHeight }}>{rx.doctor_notes || "Doctor's notes will appear here."}</div>}
        </div>
      )}

      {cfg.medicines.enabled && (
        <div className="mb-2">
          {sectionTitle(cfg.medicines.title)}
          {groups.filter((group) => group.show).map((group) => {
            const rows = (rx.medicines || []).filter((medicine) => (medicine.target || "General") === group.key);
            if (!rows.length && !cfg.medicines.showEmptySection) return null;
            return <div key={group.key} className="mb-2 overflow-hidden rounded border" style={{ borderColor: border }}>
              <div className="px-2 py-1 text-[9px] font-bold" style={{ background: cfg.styling.headerBackground, color: primary }}>{group.title}</div>
              <table className="w-full border-collapse text-left text-[9px]">
                <thead><tr>{visibleMedColumns.map((column) => <th key={column.key} className="border-y bg-slate-50 px-1.5 py-1" style={{ borderColor: border, width: `${column.width}%` }}>{column.label}</th>)}{cfg.medicines.showCheckboxColumn && <th className="border-y px-1 py-1 text-center" style={{ borderColor: border }}>✓</th>}</tr></thead>
                <tbody>{rows.map((medicine, index) => <tr key={`${group.key}-${index}`}>{visibleMedColumns.map((column) => {
                  const values = { sr: index + 1, medicine: `${medicine.dosage_form || "TAB"} - ${medicine.name || medicine.medicine_name || ""}`, dosage: medicine.dosage, frequency: medicine.frequency, duration: medicine.duration, remarks: medicine.remarks };
                  return <td key={column.key} className="border-b px-1.5 py-1" style={{ borderColor: "#E2E8F0" }}>{values[column.key] || "—"}</td>;
                })}{cfg.medicines.showCheckboxColumn && <td className="border-b text-center" style={{ borderColor: "#E2E8F0" }}>□</td>}</tr>)}</tbody>
              </table>
            </div>;
          })}
        </div>
      )}

      {cfg.investigations.enabled && (
        <div className="mb-2">
          {sectionTitle(cfg.investigations.title)}
          {testGroups.filter((group) => group.show).map((group) => {
            const rows = (rx.tests || []).filter((test) => (test.target || "General") === group.key);
            if (!rows.length) return null;
            return <div key={group.key} className="mb-2 overflow-hidden rounded border" style={{ borderColor: border }}>
              <div className="px-2 py-1 text-[9px] font-bold" style={{ color: primary }}>{group.title}</div>
              <table className="w-full border-collapse text-left text-[9px]">
                <thead><tr>{visibleTestColumns.map((column) => <th key={column.key} className="border-y bg-slate-50 px-1.5 py-1" style={{ borderColor: border, width: `${column.width}%` }}>{column.label}</th>)}{cfg.investigations.showCheckboxColumn && <th className="border-y px-1 py-1 text-center" style={{ borderColor: border }}>✓</th>}</tr></thead>
                <tbody>{rows.map((test, index) => <tr key={`${group.key}-${index}`}>{visibleTestColumns.map((column) => <td key={column.key} className="border-b px-1.5 py-1" style={{ borderColor: "#E2E8F0" }}>{({ sr: index + 1, test: test.name || test.test_name, remarks: test.remarks })[column.key] || "—"}</td>)}{cfg.investigations.showCheckboxColumn && <td className="border-b text-center" style={{ borderColor: "#E2E8F0" }}>□</td>}</tr>)}</tbody>
              </table>
            </div>;
          })}
        </div>
      )}

      {cfg.advice.enabled && (
        <div className="mb-2 rounded border p-2" style={{ borderColor: border }}>
          {sectionTitle(cfg.advice.title || "ADDITIONAL ADVICE")}
          {cfg.advice.showFollowUp && field("Follow-up", rx.follow_up)}
          {cfg.advice.showDietAdvice && field("Diet", rx.diet_advice)}
          {cfg.advice.showLifestyleAdvice && field("Lifestyle", rx.lifestyle_advice)}
          {cfg.advice.showGeneralAdvice && (rx.additional_advice || []).map((item, index) => <div key={index} className="text-[10px]">• {item.advice || item}</div>)}
        </div>
      )}

      {(cfg.signature.showDoctorSignature || cfg.signature.showHospitalStamp) && (
        <div className="my-5 flex items-end justify-between gap-4">
          {cfg.signature.showDoctorSignature && <div className="w-44 border-t pt-1 text-center text-[9px]" style={{ borderColor: border }}>{cfg.signature.doctorSignatureLabel}</div>}
          {cfg.signature.showDate && <div className="text-[9px] text-slate-500">Date: 31 Oct 2026</div>}
          {cfg.signature.showHospitalStamp && <div className="border border-dashed px-5 py-3 text-center text-[9px] font-bold text-slate-400" style={{ borderColor: border }}>{cfg.signature.hospitalStampLabel}</div>}
        </div>
      )}

      {cfg.footer.showFooter && <div className="mt-3 border-t pt-2 text-center text-[9px] text-slate-500" style={{ borderColor: border }}>
        {cfg.footer.showNotice && <div>{cfg.footer.notice}</div>}
        {cfg.footer.showHelpline && <div className="font-bold">{cfg.footer.helplineLabel}: {cfg.footer.helplineNumber}</div>}
        {cfg.footer.showAddress && <div>{cfg.hospital.address}</div>}
        {cfg.footer.showPageFooterText && <div>{cfg.footer.pageFooterText}</div>}
      </div>}
    </div>
  );
}

export default function PrescriptionPrintSettings() {
  const [settings, setSettings] = useState(DEFAULT_PRESCRIPTION_SETTINGS);
  const [activeGroup, setActiveGroup] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await settingsService.getSetting("print_slip_prescription");
        if (mounted && saved && typeof saved === "object") {
          setSettings(mergeDeep(clone(DEFAULT_PRESCRIPTION_SETTINGS), saved));
        }
      } catch (error) {
        console.warn("Could not load prescription print settings:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const update = (path, value) => setSettings((current) => setPath(current, path, value));

  const save = async () => {
    try {
      setSaving(true);
      setStatus(null);
      await settingsService.updateSetting("print_slip_prescription", settings);
      setStatus({ type: "success", message: "Prescription print settings saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.message || error?.message || "Could not save settings." });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (window.confirm("Reset prescription print settings to defaults?")) {
      setSettings(clone(DEFAULT_PRESCRIPTION_SETTINGS));
    }
  };

  const testPrint = () => {
    // The print handler needs the second argument implemented as described
    // in the integration note accompanying this component.
    DoctorPrescriptionPrintHandler.printPrescription(SAMPLE_BOOKING, settings);
  };

  const updateColumn = (section, index, key, value) => {
    const columns = [...settings[section].columns];
    columns[index] = { ...columns[index], [key]: value };
    update(`${section}.columns`, columns);
  };

  const currentGroup = CONTROL_GROUPS[activeGroup];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Doctor Prescription Designer</h2>
          <p className="text-xs text-slate-500">Configure every section of the printed prescription independently.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={reset} type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Reset defaults</button>
          <button onClick={() => setShowPreview((value) => !value)} type="button" className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">{showPreview ? "Hide preview" : "Show preview"}</button>
          <button onClick={testPrint} type="button" className="flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-900"><Icon name="LuPrinter" size={14} /> Test print</button>
          <button onClick={save} disabled={saving || loading} type="button" className="flex items-center gap-2 rounded-lg bg-sky-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Icon name="LuSave" size={14} />{saving ? "Saving..." : "Save settings"}</button>
        </div>
      </div>

      {status && <div className={`rounded-lg border p-3 text-xs ${status.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{status.message}</div>}
      {loading ? <div className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500">Loading prescription settings...</div> : (
        <div className={`grid items-start gap-6 ${showPreview ? "grid-cols-1 2xl:grid-cols-[minmax(340px,0.85fr)_minmax(620px,1.4fr)]" : "grid-cols-1"}`}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CONTROL_GROUPS.map((group, index) => (
                <button key={group.title} type="button" onClick={() => setActiveGroup(index)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeGroup === index ? "bg-sky-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{group.title}</button>
              ))}
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Icon name={currentGroup.icon} size={18} />
                <h3 className="text-sm font-bold text-slate-800">{currentGroup.title}</h3>
              </div>
              {currentGroup.fields.map((field) => <Field key={field[0]} field={field} settings={settings} onChange={update} />)}
            </section>

            {(activeGroup === 5 || activeGroup === 6) && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-slate-800">Table column designer</h3>
                {["medicines", "investigations"].filter((section) => activeGroup === 5 ? section === "medicines" : section === "investigations").map((section) => (
                  <div key={section} className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">{section}</p>
                    {settings[section].columns.map((column, index) => (
                      <div key={column.key} className="grid grid-cols-[auto_1fr_70px] items-center gap-2 rounded-lg bg-slate-50 p-2">
                        <input type="checkbox" checked={column.visible} onChange={(e) => updateColumn(section, index, "visible", e.target.checked)} className="h-4 w-4" />
                        <input value={column.label} onChange={(e) => updateColumn(section, index, "label", e.target.value)} className="min-w-0 rounded border border-slate-300 px-2 py-1.5 text-xs" />
                        <input type="number" min="1" max="100" value={column.width} onChange={(e) => updateColumn(section, index, "width", Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs" title="Column width %" />
                      </div>
                    ))}
                  </div>
                ))}
              </section>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-slate-800">Theme & page layout</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["styling.primaryColor", "Primary color"],
                  ["styling.accentColor", "Accent color"],
                  ["styling.sectionBackground", "Section background"],
                  ["styling.borderColor", "Border color"],
                  ["styling.textColor", "Text color"],
                ].map(([path, label]) => <label key={path} className="space-y-1 text-xs font-medium text-slate-600">{label}<input type="color" value={getPath(settings, path)} onChange={(e) => update(path, e.target.value)} className="h-9 w-full cursor-pointer rounded border border-slate-200 p-1" /></label>)}
                <label className="space-y-1 text-xs font-medium text-slate-600">Font size (px)<input type="number" min="7" max="16" value={settings.styling.fontSize} onChange={(e) => update("styling.fontSize", Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-2" /></label>
                <label className="space-y-1 text-xs font-medium text-slate-600">Border radius (px)<input type="number" min="0" max="20" value={settings.styling.borderRadius} onChange={(e) => update("styling.borderRadius", Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-2" /></label>
                <label className="space-y-1 text-xs font-medium text-slate-600">Paper size<select value={settings.page.size} onChange={(e) => update("page.size", e.target.value)} className="w-full rounded border border-slate-300 px-2 py-2"><option>A4</option><option>A5</option><option>Letter</option></select></label>
                <label className="space-y-1 text-xs font-medium text-slate-600">Orientation<select value={settings.page.orientation} onChange={(e) => update("page.orientation", e.target.value)} className="w-full rounded border border-slate-300 px-2 py-2"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
                <label className="space-y-1 text-xs font-medium text-slate-600">Page margin (mm)<input type="number" min="2" max="25" value={settings.page.margin} onChange={(e) => update("page.margin", Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-2" /></label>
              </div>
            </section>
          </div>

          {showPreview && <div className="min-w-0 space-y-3 2xl:sticky 2xl:top-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 font-bold text-slate-700"><Icon name="LuEye" size={15} /> Live prescription preview</span>
              <span className="text-slate-500">Sample data · A4-style preview</span>
            </div>
            <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-200 p-3">
              <PrescriptionPreview settings={settings} booking={SAMPLE_BOOKING} />
            </div>
          </div>}
        </div>
      )}
    </div>
  );
}

export { DEFAULT_PRESCRIPTION_SETTINGS, SAMPLE_BOOKING, PrescriptionPreview };
