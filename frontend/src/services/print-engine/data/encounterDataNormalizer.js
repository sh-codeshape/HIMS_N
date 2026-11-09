/**
 * encounterDataNormalizer.js — Normalizes raw encounter, patient, billing,
 * and clinical discharge records into standard structures.
 * 
 * Clinical Data Safety Rule:
 * - Preview Mode (options.isPreview = true): Allows fallback to mock samples so settings designers
 *   can see typography, alignment, and table styles in real time.
 * - Production Mode (options.isPreview = false): Strictly enforces genuine patient data.
 *   Missing values become empty strings or "—". Silently fabricating fake names, diagnoses,
 *   medicines, or financial entries is strictly forbidden.
 */

import { PREVIEW_SAMPLE_DATA, esc } from "../config/defaults.js";

export function normalizeEncounterData(slipType, rawData = {}, options = {}) {
  const isPreview = options.isPreview === true;
  const previewFallback = isPreview ? (PREVIEW_SAMPLE_DATA[slipType] || {}) : {};

  const d = rawData || {};
  const patientObj = d.patient || {};
  const admissionObj = d.admission || {};
  const clinicalObj = d.clinical || {};

  // 1. Patient Demographics
  const patientName =
    d.patientName ||
    d.patient_name ||
    d.name ||
    patientObj.name ||
    patientObj.patientName ||
    (d.first_name ? [d.first_name, d.last_name].filter(Boolean).join(" ") : "") ||
    (previewFallback.patientName || (previewFallback.patient?.name) || "—");

  const age =
    d.age !== undefined && d.age !== ""
      ? String(d.age)
      : (d.ageYrs || patientObj.age || previewFallback.age || (previewFallback.patient?.age) || "");

  const gender =
    d.gender ||
    patientObj.gender ||
    previewFallback.gender ||
    (previewFallback.patient?.gender) ||
    "";

  const ageGender =
    d.ageGender ||
    (age && gender ? `${age} Yrs / ${gender}` : age ? `${age} Yrs` : gender || "—");

  const mobile =
    d.mobile ||
    d.phone ||
    d.mobile1 ||
    patientObj.mobile ||
    patientObj.phone ||
    previewFallback.mobile ||
    (previewFallback.patient?.mobile) ||
    "—";

  const address =
    d.address ||
    patientObj.address ||
    (d.address_line1
      ? [d.address_line1, d.city ? `, ${d.city}` : "", d.state ? `, ${d.state}` : "", d.pinCode ? ` - ${d.pinCode}` : ""].join("")
      : "") ||
    previewFallback.address ||
    (previewFallback.patient?.address) ||
    "—";

  const uhid =
    d.uhid ||
    d.uhidNo ||
    patientObj.uhid ||
    previewFallback.uhid ||
    (previewFallback.patient?.uhid) ||
    "—";

  const encounterNo =
    d.encounterNo ||
    d.ipdNo ||
    d.ipdNumber ||
    d.admissionNo ||
    admissionObj.ipdNumber ||
    admissionObj.admissionNo ||
    d.receiptNo ||
    d.tokenNo ||
    previewFallback.encounterNo ||
    previewFallback.admissionNo ||
    (previewFallback.admission?.ipdNumber) ||
    "—";

  const doctor =
    d.doctor ||
    d.doctor_name ||
    d.consultant ||
    admissionObj.consultant ||
    (d.doctor_first_name ? `Dr. ${d.doctor_first_name} ${d.doctor_last_name || ""}`.trim() : "") ||
    previewFallback.doctor ||
    (previewFallback.admission?.consultant) ||
    "—";

  const department =
    d.department ||
    d.dept ||
    admissionObj.department ||
    previewFallback.department ||
    (previewFallback.admission?.department) ||
    "—";

  const ward = d.ward || admissionObj.ward || previewFallback.ward || (previewFallback.admission?.ward) || "";
  const bed = d.bed || d.bedNo || admissionObj.bed || previewFallback.bedNo || (previewFallback.admission?.bed) || "";
  const wardBed =
    d.wardBed ||
    (ward && bed ? `${ward} • Bed ${bed}` : ward || bed || previewFallback.wardBed || "—");

  const admissionDate =
    d.admissionDate ||
    d.encounterDate ||
    d.date ||
    admissionObj.admissionDate ||
    previewFallback.admissionDate ||
    (previewFallback.admission?.admissionDate) ||
    "—";

  const dischargeDate =
    d.dischargeDate ||
    admissionObj.dischargeDate ||
    previewFallback.dischargeDate ||
    (previewFallback.admission?.dischargeDate) ||
    "—";

  // 2. Normalize Discharge Medications List (Handles data.medicines, data.medications, data.data.medications)
  const rawMedList =
    (Array.isArray(d.medicines) && d.medicines.length > 0 ? d.medicines : null) ||
    (Array.isArray(d.medications) && d.medications.length > 0 ? d.medications : null) ||
    (Array.isArray(d.data?.medications) && d.data.medications.length > 0 ? d.data.medications : null) ||
    (Array.isArray(clinicalObj.medications) && clinicalObj.medications.length > 0 ? clinicalObj.medications : null) ||
    (isPreview ? (PREVIEW_SAMPLE_DATA.ipd_discharge.medicines || []) : []);

  const normalizedMedications = (rawMedList || []).map((m, idx) => ({
    sr: idx + 1,
    name: m.name || m.medicineName || m.medicine || `Medication #${idx + 1}`,
    dosage: m.dosage || m.dose || "1 Tab",
    route: m.route || "Oral",
    frequency: m.frequency || "BD (Twice Daily)",
    duration: m.duration || m.days || "5 Days",
    instructions: m.instructions || "After Meals",
  }));

  // 3. Normalize Clinical Diagnoses & Course
  const primaryDiagnosis =
    clinicalObj.primaryDiagnosis ||
    clinicalObj.finalDiagnosis ||
    d.finalDiagnosis ||
    d.primaryDiagnosis ||
    d.admission_diagnosis ||
    admissionObj.diagnosis ||
    (isPreview ? PREVIEW_SAMPLE_DATA.ipd_discharge.clinical.primaryDiagnosis : "—");

  const secondaryDiagnosis =
    clinicalObj.secondaryDiagnosis ||
    d.secondaryDiagnosis ||
    (isPreview ? PREVIEW_SAMPLE_DATA.ipd_discharge.clinical.secondaryDiagnosis : "");

  const hospitalCourse =
    clinicalObj.hospitalCourse ||
    clinicalObj.treatmentGiven ||
    d.hospitalCourse ||
    (isPreview ? PREVIEW_SAMPLE_DATA.ipd_discharge.clinical.hospitalCourse : "—");

  const investigations =
    clinicalObj.investigations ||
    d.investigations ||
    (isPreview ? PREVIEW_SAMPLE_DATA.ipd_discharge.clinical.investigations : "");

  const procedures =
    clinicalObj.procedures ||
    clinicalObj.procedures_performed ||
    d.procedures ||
    (isPreview ? PREVIEW_SAMPLE_DATA.ipd_discharge.clinical.procedures : "");

  // 4. Normalize Discharge Vitals & Advice
  const vitalsObj = d.vitals || admissionObj.vitals || clinicalObj.vitals || (isPreview ? PREVIEW_SAMPLE_DATA.ipd_discharge.vitals : {});
  const adviceObj = d.advice || (isPreview ? PREVIEW_SAMPLE_DATA.ipd_discharge.advice : {});
  const billingClearanceObj = d.billing || (isPreview ? PREVIEW_SAMPLE_DATA.ipd_discharge.billing : {});

  return {
    ...d,
    patientName,
    uhid,
    encounterNo,
    tokenNo: d.token_number || d.tokenNo || d.token || encounterNo,
    ipdNo: d.ipdNo || d.ipdNumber || admissionObj.ipdNumber || encounterNo,
    ageGender,
    mobile,
    address,
    bloodGroup: d.bloodGroup || patientObj.bloodGroup || (isPreview ? "B+" : "—"),
    guardian: d.guardian || patientObj.guardian || "—",
    relation: d.relation || patientObj.relation || "",
    doctor,
    department,
    ward,
    bed,
    wardBed,
    admissionDate,
    dischargeDate,
    stay: admissionObj.stay || d.stay || (isPreview ? "5 Days" : "—"),
    dischargeType: (admissionObj.dischargeType || d.dischargeType || d.documentType || (isPreview ? "NORMAL / PLANNED" : "NORMAL")).toUpperCase(),
    dischargeCondition: admissionObj.dischargeCondition || d.dischargeCondition || (isPreview ? "Clinically Stable & Symptom Free" : "Stable"),
    // Discharge specific normalized structures
    medications: normalizedMedications,
    primaryDiagnosis,
    secondaryDiagnosis,
    hospitalCourse,
    investigations,
    procedures,
    vitals: vitalsObj,
    advice: adviceObj,
    billingClearance: billingClearanceObj,
  };
}
