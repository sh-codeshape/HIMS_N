import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import ipdService from "../../../api/services/ipdService";
import billingService from "../../../api/services/billingService";
import IPDDischargePrintHandler from "../../settings/IPDDischargePrintHandler.js";
import { IPDDischargePreview } from "../../settings/IPDDischargePrintSettings.jsx";
import {
  mapAdmissionToDischargePayload,
  DEFAULT_IPD_DISCHARGE_SETTINGS,
} from "../../settings/ipdDischargePrintConfig.js";
import "../IPDDischarge.css";

const DISCHARGE_TYPES = [
  { value: "normal", label: "Normal / Planned Discharge" },
  { value: "lama", label: "LAMA (Left Against Medical Advice)" },
  { value: "dama", label: "DAMA (Discharge Against Medical Advice)" },
  { value: "transferred", label: "Referred / Transferred to Higher Center" },
  { value: "absconded", label: "Absconded (Left without notice)" },
  { value: "death", label: "Expired / Death Summary" },
];

const DISCHARGE_CONDITIONS = [
  "Clinically Stable & Symptom Free",
  "Recovered - Vitals Normal",
  "Relieved - Under Medication",
  "Guarded / Critical",
  "Deceased"
];

export const COMMON_DISCHARGE_MEDICINES = [
  "Tab Paracetamol 650mg (Dolo 650)",
  "Cap Pantoprazole 40mg (Pan 40)",
  "Cap Pantoprazole + Domperidone (Pan-D)",
  "Tab Amoxicillin + Pot. Clavulanate 625mg (Augmentin)",
  "Tab Cefixime 200mg (Taxim-O)",
  "Tab Azithromycin 500mg (Azee 500)",
  "Tab Ciprofloxacin 500mg (Ciplox)",
  "Tab Metronidazole 400mg (Flagyl)",
  "Tab Ondansetron 4mg (Emeset)",
  "Tab Aceclofenac + Paracetamol (Zerodol-P)",
  "Tab Aceclofenac + Paracetamol + Serratiopeptidase (Zerodol-SP)",
  "Tab Tramadol + Paracetamol (Ultracet)",
  "Tab Multivitamin & Zinc (Becosules / A to Z)",
  "Tab Calcium 500mg + Vit D3 (Shelcal)",
  "Tab Iron & Folic Acid (Autrin)",
  "Tab Telmisartan 40mg (Telma 40)",
  "Tab Amlodipine 5mg (Amlong)",
  "Tab Metformin 500mg (Glycomet)",
  "Tab Glimepiride 1mg / 2mg (Amaryl)",
  "Tab Atorvastatin 10mg / 20mg (Atorva)",
  "Tab Montelukast + Levocetirizine (Montair-LC)",
  "Syrup Sucralfate + Oxetacaine 10ml",
  "Syrup Cough Expectorant 10ml (Ascoril-D)",
  "Inj Insulin (Human Mixtard / Glargine)"
];

export const MEDICINE_PRESETS = [
  { name: "Tab Paracetamol 650mg (Dolo 650)", dosage: "1 Tab", frequency: "TDS (Thrice Daily / सुबह-दोपहर-रात)", days: "3 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Cap Pantoprazole 40mg (Pan 40)", dosage: "1 Cap", frequency: "OD (Empty Stomach / सुबह खाली पेट)", days: "5 Days", instructions: "Before Breakfast (खाली पेट)" },
  { name: "Cap Pantoprazole + Domperidone (Pan-D)", dosage: "1 Cap", frequency: "OD (Empty Stomach / सुबह खाली पेट)", days: "5 Days", instructions: "Before Breakfast (खाली पेट)" },
  { name: "Tab Amoxicillin + Pot. Clavulanate 625mg (Augmentin)", dosage: "1 Tab", frequency: "BD (Twice Daily / सुबह-शाम)", days: "5 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Tab Cefixime 200mg (Taxim-O)", dosage: "1 Tab", frequency: "BD (Twice Daily / सुबह-शाम)", days: "5 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Tab Azithromycin 500mg (Azee 500)", dosage: "1 Tab", frequency: "OD (Once Daily / दिन में 1 बार)", days: "3 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Tab Ciprofloxacin 500mg (Ciplox)", dosage: "1 Tab", frequency: "BD (Twice Daily / सुबह-शाम)", days: "5 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Tab Metronidazole 400mg (Flagyl)", dosage: "1 Tab", frequency: "TDS (Thrice Daily / सुबह-दोपहर-रात)", days: "5 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Tab Ondansetron 4mg (Emeset)", dosage: "1 Tab", frequency: "SOS (As Needed / आवश्यकता अनुसार)", days: "3 Days", instructions: "Before Meals (उल्टी होने पर)" },
  { name: "Tab Aceclofenac + Paracetamol (Zerodol-P)", dosage: "1 Tab", frequency: "BD (Twice Daily / सुबह-शाम)", days: "3 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Tab Aceclofenac + Paracetamol + Serratiopeptidase (Zerodol-SP)", dosage: "1 Tab", frequency: "BD (Twice Daily / सुबह-शाम)", days: "5 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Tab Tramadol + Paracetamol (Ultracet)", dosage: "1 Tab", frequency: "SOS (As Needed / आवश्यकता अनुसार)", days: "3 Days", instructions: "After Meals (दर्द होने पर)" },
  { name: "Tab Multivitamin & Zinc (Becosules / A to Z)", dosage: "1 Tab", frequency: "OD (Once Daily / दिन में 1 बार)", days: "10 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Tab Calcium 500mg + Vit D3 (Shelcal)", dosage: "1 Tab", frequency: "OD (Once Daily / दिन में 1 बार)", days: "14 Days", instructions: "After Meals (दूध के साथ)" },
  { name: "Tab Iron & Folic Acid (Autrin)", dosage: "1 Tab", frequency: "OD (Once Daily / दिन में 1 बार)", days: "14 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Tab Telmisartan 40mg (Telma 40)", dosage: "1 Tab", frequency: "OD (Once Daily / दिन में 1 बार)", days: "1 Month", instructions: "Morning after breakfast (सुबह)" },
  { name: "Tab Amlodipine 5mg (Amlong)", dosage: "1 Tab", frequency: "OD (Once Daily / दिन में 1 बार)", days: "1 Month", instructions: "Morning (सुबह)" },
  { name: "Tab Metformin 500mg (Glycomet)", dosage: "1 Tab", frequency: "BD (Twice Daily / सुबह-शाम)", days: "1 Month", instructions: "With Meals (भोजन के साथ)" },
  { name: "Tab Glimepiride 1mg / 2mg (Amaryl)", dosage: "1 Tab", frequency: "OD (Once Daily / दिन में 1 बार)", days: "1 Month", instructions: "Before Breakfast (नाश्ते से पहले)" },
  { name: "Tab Atorvastatin 10mg / 20mg (Atorva)", dosage: "1 Tab", frequency: "HS (At Bedtime / रात को सोते समय)", days: "1 Month", instructions: "At Bedtime (रात को सोते समय)" },
  { name: "Tab Montelukast + Levocetirizine (Montair-LC)", dosage: "1 Tab", frequency: "HS (At Bedtime / रात को सोते समय)", days: "7 Days", instructions: "At Bedtime (रात को सोते समय)" },
  { name: "Syrup Sucralfate + Oxetacaine 10ml", dosage: "10 ml", frequency: "TDS (Thrice Daily / सुबह-दोपहर-रात)", days: "5 Days", instructions: "Before Meals (खाली पेट)" },
  { name: "Syrup Cough Expectorant 10ml (Ascoril-D)", dosage: "10 ml", frequency: "TDS (Thrice Daily / सुबह-दोपहर-रात)", days: "5 Days", instructions: "After Meals (भोजन के बाद)" },
  { name: "Inj Insulin (Human Mixtard / Glargine)", dosage: "1 Sachet", frequency: "BD (Twice Daily / सुबह-शाम)", days: "1 Month", instructions: "Before Meals as advised" }
];

export const DOSAGE_OPTIONS = [
  "1 Tab",
  "1 Cap",
  "2 Tabs",
  "5 ml",
  "10 ml",
  "1 Puff",
  "2 Drops",
  "1 Sachet"
];

export const FREQUENCY_OPTIONS = [
  "OD (Once Daily / दिन में 1 बार)",
  "BD (Twice Daily / सुबह-शाम)",
  "TDS (Thrice Daily / सुबह-दोपहर-रात)",
  "QID (4 Times Daily / 4 बार)",
  "SOS (As Needed / आवश्यकता अनुसार)",
  "HS (At Bedtime / रात को सोते समय)",
  "OD (Empty Stomach / सुबह खाली पेट)",
  "PC (After Meals / भोजन के बाद)"
];

export const DURATION_OPTIONS = [
  "3 Days",
  "5 Days",
  "7 Days",
  "10 Days",
  "14 Days",
  "1 Month",
  "SOS (As needed)",
  "Continue till review"
];

export const COMMON_DIAGNOSES = [
  "Acute Gastroenteritis with Moderate Dehydration - Resolved",
  "Dengue Fever with Thrombocytopenia - Recovered",
  "Enteric / Typhoid Fever - Responded to Antibiotics",
  "Acute Appendicitis (Post Appendectomy) - Wound Healthy",
  "Acute Calculus Cholecystitis (Post Lap Cholecystectomy)",
  "Lower Respiratory Tract Infection (LRTI) / Bronchopneumonia",
  "Type 2 Diabetes Mellitus with Hyperglycemia - Glycemic Control Achieved",
  "Essential Hypertension / Hypertensive Crisis - BP Stabilized",
  "Urinary Tract Infection (UTI) / Urosepsis - Resolved",
  "Blunt Abdominal Trauma / Soft Tissue Injury - Stable",
  "Inguinal Hernia (Post Hernioplasty) - Uneventful Recovery",
  "Post Normal Vaginal Delivery (FTND) - Healthy Mother & Baby",
  "Post LSCS (Cesarean Delivery) - Healthy Mother & Baby",
  "Acute Viral Pyrexia with Generalized Bodyache - Responded"
];

export const HOSPITAL_COURSE_TEMPLATES = [
  "Patient admitted with acute symptoms, investigated and treated with IV fluids, scheduled antibiotics and supportive medications. Response was satisfactory with steady symptomatic recovery.",
  "Post-operative course was uneventful. Surgical wound healthy, vitals stable, ambulating well, tolerating oral diet, and discharged in hemodynamically stable condition.",
  "Conservative medical management successful. Vitals monitored, laboratory parameters normalized, afebrile for 48 hours, oral toleration established.",
  "Patient managed under intensive clinical monitoring, stabilized, transferred to ward, completed therapeutic regimen and discharged symptom-free."
];

export const INVESTIGATION_TEMPLATES = [
  "Routine CBC, LFT, KFT, Serum Electrolytes, USG Abdomen & Routine Urine",
  "Diagnostic Ultrasound, Chest X-Ray, Routine Hematology & Supportive IV Infusions",
  "Surgical Intervention, Wound Debridement & Daily Antiseptic Dressing",
  "Continuous Multi-para Vital Monitoring, Oxygen Inhalation & IV Medication",
  "ECG, Cardiac Enzymes, 2D Echo, Routine Blood Chemistry"
];

export const FOLLOW_UP_SCHEDULES = [
  { label: "After 3 Days in OPD", days: 3 },
  { label: "After 5 Days in OPD with Reports", days: 5 },
  { label: "After 7 Days for Suture Removal", days: 7 },
  { label: "After 10 Days in OPD for Review", days: 10 },
  { label: "After 2 Weeks in OPD", days: 14 },
  { label: "SOS / As and When Required", days: 0 }
];

export const DIET_ADVICE_TEMPLATES = [
  "Light, easily digestible, low-spice soft diet. Plenty of oral fluids (2-3 L/day).",
  "Diabetic Diet: Low carbohydrate, high fiber, strict avoidance of refined sugars.",
  "Hypertensive & Cardiac Diet: Low sodium (salt < 2g/day), low fat, avoid fried foods.",
  "High Protein Diet: Plenty of boiled lentils, egg whites, paneer, and fresh fruits.",
  "Renal Diet: Restricted sodium, potassium, and regulated water intake as advised.",
  "Post-Operative Bland Diet: Small frequent soft meals, avoid carbonated drinks."
];

export const DIET_OPTIONS = [
  {
    id: "light",
    short: "Light & Digestible Diet",
    full: "Light, easily digestible, low-spice soft diet."
  },
  {
    id: "hydration",
    short: "Maintain Adequate Hydration",
    full: "Maintain adequate hydration. Drink 2.5 - 3 Litres clean water daily."
  },
  {
    id: "avoid_spicy",
    short: "Avoid Oily & Spicy Food",
    full: "Strictly avoid oily, spicy, fried, and outside street food."
  },
  {
    id: "diabetic",
    short: "Diabetic Diet (Low Sugar)",
    full: "Diabetic Diet: Low carbohydrate, high fiber, strict avoidance of sugar and sweets."
  },
  {
    id: "low_salt",
    short: "Low Salt / Hypertensive Diet",
    full: "Low sodium / low salt diet (salt < 2g/day). Avoid pickles, papad and processed food."
  },
  {
    id: "high_protein",
    short: "High Protein Diet",
    full: "High protein diet: boiled pulses/dal, egg whites, paneer, and sprouts."
  },
  {
    id: "soft_liquid",
    short: "Soft / Semi-Solid Diet",
    full: "Soft, bland, semi-solid diet (Khichdi, Dalia, soups) in small quantities."
  },
  {
    id: "small_meals",
    short: "Small Frequent Meals",
    full: "Take small frequent meals (4-5 times a day) instead of heavy meals."
  }
];

export const WARNING_SIGNS_TEMPLATES = [
  "Report immediately to 24x7 Emergency if high fever, severe pain, persistent vomiting, or breathing difficulty occurs.",
  "Report immediately to Emergency if fresh bleeding, foul-smelling wound discharge, abdominal distension, or wound gaping occurs.",
  "Report to Emergency if chest pain, sudden breathlessness, palpitations, dizziness, or fainting occurs.",
  "Report to Emergency if altered sensorium, sudden weakness of limbs, or speech difficulty occurs."
];

export const ACTIVITY_ADVICE_TEMPLATES = [
  "Normal daily routine. Avoid strenuous physical exercise or heavy weight lifting for 2 weeks.",
  "Strict bed rest for 3-5 days. Gradual mobilization and adequate sleep.",
  "Avoid driving, bending forward, or sudden vigorous movements for 10 days.",
  "Regular light walking permitted. Maintain good personal hygiene and keep wound clean."
];

const calculateDaysStay = (admittedAt, dischargedAt) => {
  if (!admittedAt) return 1;
  const start = new Date(admittedAt);
  const end = dischargedAt ? new Date(dischargedAt) : new Date();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

export default function IPDDischargeWorkflow({ admission, onBack }) {
  const [clearanceChecklist, setClearanceChecklist] = useState({
    billingCleared: true,
    pharmacyReturned: true,
    nursingChartHandover: true,
  });

  const [dischargeForm, setDischargeForm] = useState({
    discharge_type: "normal",
    discharge_condition: "Clinically Stable & Symptom Free",
    final_diagnosis: admission?.admission_diagnosis || admission?.diagnosis || "",
    history_of_present_illness: "",
    hospital_course: "",
    procedures_performed: "",
    follow_up_instructions: "Review in OPD with laboratory reports. In case of emergency or severe discomfort, report to emergency department immediately.",
    follow_up_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    diet_advice: "Light, easily digestible diet. Maintain adequate hydration.",
    activity_advice: "Avoid heavy lifting or strenuous exercise for 1 week.",
    medications: []
  });

  // Pending dues (clearance) state — fetched per admission from backend
  const [pendingDues, setPendingDues] = useState(null);
  const [duesLoading, setDuesLoading] = useState(false);

  const navigate = useNavigate();
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    method: "Cash",
    notes: ""
  });
  const [refundProcessing, setRefundProcessing] = useState(false);

  // Dietary Guidance Multi-Select Dropdown State & Handler
  const [dietDropdownOpen, setDietDropdownOpen] = useState(false);
  const dietDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dietDropdownRef.current && !dietDropdownRef.current.contains(event.target)) {
        setDietDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDietOption = (dietItem) => {
    const currentText = dischargeForm.diet_advice || "";
    const isIncluded = currentText.includes(dietItem.full);

    let newText = "";
    if (isIncluded) {
      newText = currentText
        .replace(dietItem.full, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      newText = newText.replace(/^\.\s*/, "").replace(/\.\s*\./g, ".").trim();
    } else {
      if (currentText.trim()) {
        const sep = currentText.trim().endsWith(".") ? " " : ". ";
        newText = `${currentText.trim()}${sep}${dietItem.full}`;
      } else {
        newText = dietItem.full;
      }
    }

    setDischargeForm((prev) => ({ ...prev, diet_advice: newText }));
  };

  // Printable Summary Modal State & Configurable Settings
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [dischargePrintSettings, setDischargePrintSettings] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch real-time pending dues for clearance from backend
  const fetchPendingDues = useCallback(async (encounterId) => {
    if (!encounterId) {
      setPendingDues(null);
      return;
    }
    setDuesLoading(true);
    try {
      const dues = await ipdService.getPendingDues(encounterId);
      setPendingDues(dues);
      // Seed the clearance checklist from real backend data
      setClearanceChecklist({
        billingCleared: Boolean(dues?.cleared),
        pharmacyReturned: true,
        nursingChartHandover: true,
      });
    } catch (err) {
      console.error("Failed to fetch pending dues", err);
      setPendingDues(null);
      toast.warn("Could not fetch live pending dues from billing engine.");
    } finally {
      setDuesLoading(false);
    }
  }, []);

  // Fetch pending dues when admission is available
  useEffect(() => {
    if (admission) {
      fetchPendingDues(admission.encounter_id || admission.id);
    }
  }, [admission, fetchPendingDues]);

  // Load existing saved clinical discharge summary from real backend DB if previously saved
  useEffect(() => {
    if (!admission?.id) return;
    let isSubscribed = true;

    const loadRealSummary = async () => {
      try {
        const saved = await ipdService.getDischargeSummary(admission.id);
        if (saved && isSubscribed) {
          setDischargeForm((prev) => ({
            ...prev,
            final_diagnosis: saved.final_diagnosis || admission.admission_diagnosis || prev.final_diagnosis,
            history_of_present_illness: saved.history_of_present_illness || prev.history_of_present_illness,
            hospital_course: saved.hospital_course || prev.hospital_course,
            procedures_performed: saved.procedures_performed || prev.procedures_performed,
            discharge_condition: saved.condition_at_discharge || prev.discharge_condition,
            follow_up_instructions: saved.follow_up_instructions || prev.follow_up_instructions,
            follow_up_date: saved.follow_up_date ? String(saved.follow_up_date).split("T")[0] : prev.follow_up_date,
            diet_advice: saved.diet_advice || prev.diet_advice,
            activity_advice: saved.activity_advice || prev.activity_advice,
            medications: Array.isArray(saved.data?.medications) && saved.data.medications.length > 0
              ? saved.data.medications
              : prev.medications
          }));
        }
      } catch (err) {
        console.warn("Discharge summary fetch check:", err);
      }
    };

    loadRealSummary();
    return () => { isSubscribed = false; };
  }, [admission]);

  // Single Medicine Quick-Add State (Builder Bar)
  const [newMed, setNewMed] = useState({
    name: "",
    isCustom: false,
    customName: "",
    dosage: "1 Tab",
    frequency: "BD (Twice Daily / सुबह-शाम)",
    days: "5 Days",
    instructions: "After Meals (भोजन के बाद)"
  });

  // When medicine is selected, automatically populate dose, frequency, duration, instructions!
  const handleSelectMedicinePreset = (medName) => {
    if (medName === "__custom__") {
      setNewMed({
        name: "",
        isCustom: true,
        customName: "",
        dosage: "1 Tab",
        frequency: "BD (Twice Daily / सुबह-शाम)",
        days: "5 Days",
        instructions: "After Meals (भोजन के बाद)"
      });
      return;
    }
    const found = MEDICINE_PRESETS.find((p) => p.name === medName);
    if (found) {
      setNewMed({
        name: found.name,
        isCustom: false,
        customName: "",
        dosage: found.dosage,
        frequency: found.frequency,
        days: found.days,
        instructions: found.instructions
      });
    } else {
      setNewMed((prev) => ({
        ...prev,
        name: medName,
        isCustom: false,
        customName: ""
      }));
    }
  };

  const handleAddMedicationToList = () => {
    const finalName = newMed.isCustom ? newMed.customName.trim() : newMed.name.trim();
    if (!finalName) {
      toast.error("Please select or enter medicine name.");
      return;
    }
    const item = {
      name: finalName,
      dosage: newMed.dosage || "1 Tab",
      frequency: newMed.frequency || "BD (Twice Daily / सुबह-शाम)",
      days: newMed.days || "5 Days",
      instructions: newMed.instructions || "After Meals (भोजन के बाद)"
    };
    setDischargeForm((prev) => ({
      ...prev,
      medications: [...prev.medications, item]
    }));
    setNewMed({
      name: "",
      isCustom: false,
      customName: "",
      dosage: "1 Tab",
      frequency: "BD (Twice Daily / सुबह-शाम)",
      days: "5 Days",
      instructions: "After Meals (भोजन के बाद)"
    });
    toast.success(`Added ${finalName}`);
  };

  // Remove Medication Row
  const handleRemoveMedication = (index) => {
    setDischargeForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  // Legacy helper retained for safety
  const handleAddMedication = () => {
    handleAddMedicationToList();
  };

  const handleQuickSettleDues = async () => {
    if (!admission || !pendingDues) return;
    try {
      setDuesLoading(true);
      await billingService.settleBill({
        encounter_id: admission.encounter_id || admission.id,
        amount: pendingDues.pendingAmount,
        payment_mode: "Cash",
        remarks: `Quick discharge settlement for ${admission.admission_no || admission.id}`
      });
      toast.success("Dues settled successfully!", { icon: "✅" });
      await fetchPendingDues(admission.encounter_id || admission.id);
    } catch (err) {
      console.error("Failed to settle dues:", err);
      toast.error("Failed to quick settle dues. Try in IPD Billing.");
    } finally {
      setDuesLoading(false);
    }
  };

  const handleCreditExcessToWallet = async () => {
    if (!admission || !pendingDues || pendingDues.excessAmount <= 0) return;
    try {
      setDuesLoading(true);
      await billingService.creditWallet({
        patient_id: admission.patient_id,
        amount: pendingDues.excessAmount,
        encounter_id: admission.encounter_id,
        notes: `Excess advance credited to wallet at discharge (${admission.admission_no})`
      });
      toast.success(`₹${pendingDues.excessAmount.toLocaleString("en-IN")} credited to patient wallet!`, { icon: "👛" });
      await fetchPendingDues(admission.encounter_id || admission.id);
    } catch (err) {
      console.error("Failed to credit wallet:", err);
      toast.error("Failed to credit wallet.");
    } finally {
      setDuesLoading(false);
    }
  };

  const handleConfirmRefund = async (e) => {
    if (e) e.preventDefault();
    if (!admission || !pendingDues || pendingDues.excessAmount <= 0) return;
    try {
      setRefundProcessing(true);
      await billingService.processRefund({
        encounter_id: admission.encounter_id || admission.id,
        patient_id: admission.patient_id,
        amount: pendingDues.excessAmount,
        payment_method: refundForm.method,
        notes: refundForm.notes || `Discharge excess advance refund for ${admission.admission_no}`
      });
      toast.success(`Refund of ₹${pendingDues.excessAmount.toLocaleString("en-IN")} processed successfully!`, { icon: "💵" });
      setShowRefundModal(false);
      await fetchPendingDues(admission.encounter_id || admission.id);
    } catch (err) {
      console.error("Failed to process refund:", err);
      toast.error("Failed to process refund.");
    } finally {
      setRefundProcessing(false);
    }
  };

  // Submit Discharge Action
  const handleConfirmDischarge = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!admission) return;

    // 1. Block if real backend dues are pending
    if (pendingDues && !pendingDues.cleared && pendingDues.pendingAmount > 0) {
      const pendingDept = pendingDues.breakdown?.filter((b) => !b.cleared).map((b) => b.department).join(", ") || "dues";
      toast.error(`Cannot discharge — pending ${pendingDept} dues of ₹${pendingDues.pendingAmount.toLocaleString("en-IN")} not cleared.`);
      return;
    }

    // 2. Block if operational clearances not confirmed
    if (!clearanceChecklist.billingCleared || !clearanceChecklist.pharmacyReturned || !clearanceChecklist.nursingChartHandover) {
      toast.error("Please verify all hospital clearances before discharge!");
      return;
    }

    try {
      // 1. Mark patient discharged in backend (vacating bed immediately and crediting remaining excess to wallet)
      await ipdService.dischargePatient(admission.id, {
        discharge_type: dischargeForm.discharge_type,
        discharge_condition: dischargeForm.discharge_condition,
        auto_wallet_credit: true
      });

      // 2. Save Clinical Discharge Summary
      await ipdService.saveDischargeSummary(admission.id, {
        final_diagnosis: dischargeForm.final_diagnosis,
        history_of_present_illness: dischargeForm.history_of_present_illness,
        hospital_course: dischargeForm.hospital_course,
        procedures_performed: dischargeForm.procedures_performed,
        condition_at_discharge: dischargeForm.discharge_condition,
        follow_up_instructions: dischargeForm.follow_up_instructions,
        follow_up_date: dischargeForm.follow_up_date,
        diet_advice: dischargeForm.diet_advice,
        activity_advice: dischargeForm.activity_advice,
        status: "finalized",
        data: {
          medications: dischargeForm.medications,
          clearances: clearanceChecklist
        }
      });

      toast.success(
        `Patient ${admission.first_name || ""} ${admission.last_name || ""} discharged successfully! Bed vacated & released.`,
        { icon: "🏥" }
      );

      onBack && onBack();
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete patient discharge. Check network or clearances.");
    }
  };

  // Open Printable Summary with real live discharge state and loaded settings
  const handleOpenSummary = async () => {
    try {
      setSummaryLoading(true);
      const [summary, settings] = await Promise.all([
        ipdService.getDischargeSummary(admission.id).catch(() => null),
        IPDDischargePrintHandler.getSettings().catch(() => null),
      ]);

      if (settings) {
        setDischargePrintSettings(settings);
      }

      setCurrentSummary(summary || {
        final_diagnosis: dischargeForm.final_diagnosis || admission.admission_diagnosis || "Inpatient Clinical Care",
        history_of_present_illness: dischargeForm.history_of_present_illness || "",
        hospital_course: dischargeForm.hospital_course || "Patient received active inpatient medical management and supportive treatment.",
        procedures_performed: dischargeForm.procedures_performed || "Vital monitoring, IV therapy, routine diagnostics, and scheduled medication.",
        condition_at_discharge: dischargeForm.discharge_condition,
        follow_up_instructions: dischargeForm.follow_up_instructions,
        follow_up_date: dischargeForm.follow_up_date,
        diet_advice: dischargeForm.diet_advice,
        activity_advice: dischargeForm.activity_advice,
        data: {
          medications: dischargeForm.medications,
          clearances: clearanceChecklist,
        },
      });
      setPrintModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch discharge summary details.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Trigger high-fidelity print window using saved settings & data contract mapping
  const handlePrintDischargeSummary = async () => {
    try {
      const payload = mapAdmissionToDischargePayload(
        admission,
        currentSummary,
        dischargeForm,
        pendingDues
      );
      // In the real discharge workflow, omit settingsOverride so saved settings from DB are applied
      await IPDDischargePrintHandler.printDischargeSummary(payload);
    } catch (err) {
      console.error("Discharge summary print error:", err);
      toast.error("Failed to generate printable discharge summary.");
    }
  };

  if (!admission) {
    return (
      <div className="ipd-workflow-wrapper">
        <div className="ipd-empty-state-card">
          <Icon name="LuAlertCircle" size={32} style={{ color: "#f59e0b" }} />
          <h3>No Inpatient Record Selected</h3>
          <p>Please select an active inpatient from the IPD Discharge table to process clearances.</p>
          <button type="button" className="ipd-btn-back" onClick={onBack}>
            <Icon name="LuArrowLeft" size={15} /> Back to IPD List
          </button>
        </div>
      </div>
    );
  }

  const daysStay = calculateDaysStay(admission.admitted_at, admission.discharged_at);
  const patientFullName = `${admission.first_name || ""} ${admission.last_name || ""}`.trim() || "Patient";
  const attendingDoc = admission.doctor_first_name
    ? `Dr. ${admission.doctor_first_name} ${admission.doctor_last_name || ""}`
    : "Dr. On-Duty Specialist";

  return (
    <div className="hims-discharge-window-container">
      <div className="hims-discharge-window">
        {/* 1. Window Header matching Image 1: Navy bar with gold document icon and red [✕] exit */}
        <div className="hims-window-header">
          <div className="hims-window-title-left">
            <div className="hims-window-icon">
              <Icon name="LuFileText" size={18} />
            </div>
            <div>
              <h2 className="hims-window-title">Inpatient Clinical Discharge &amp; Clearance Protocol</h2>
             
            </div>
          </div>
         
        </div>

        {/* 2. Window Body matching Image 1: Steel-blue container with structured panels */}
        <div className="hims-window-body">
          {/* 1. PATIENT INPATIENT PROFILE HEADER (Compact, Profile UI) */}
          <div className="hims-patient-profile-card">
            <div className="hims-patient-profile-main">
              <div className="hims-patient-avatar">
                <Icon name="LuUser" size={24} />
              </div>
              <div className="hims-patient-identity">
                <div className="hims-patient-title-row">
                  <h3 className="hims-patient-name">{patientFullName}</h3>
                  <span className="hims-badge-patient-demog">
                    {admission.gender ? admission.gender.toUpperCase() : "ADULT"} • {admission.age ? `${admission.age} Yrs` : "Adult"}
                  </span>
                  <span className="hims-badge-patient-stay">
                    <Icon name="LuClock" size={11} /> {daysStay} Day{daysStay > 1 ? "s" : ""} Stay
                  </span>
                </div>
                <div className="hims-patient-clinical-tags">
                  <span className="hims-patient-tag-doc">
                    <Icon name="LuStethoscope" size={12} /> {attendingDoc}
                  </span>
                  <span className="hims-patient-tag-phone">
                    <Icon name="LuPhone" size={11} /> {admission.phone || admission.mobile || "—"}
                  </span>
                  <span className="hims-patient-tag-date">
                    <Icon name="LuCalendar" size={11} /> Admitted: {admission.admitted_at ? new Date(admission.admitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side Compact Badges for UHID, Adm No, Bed */}
            <div className="hims-patient-id-badges">
              <div className="hims-id-badge">
                <span className="hims-id-badge-lbl">UHID</span>
                <strong className="hims-id-badge-val">{admission.uhid || "—"}</strong>
              </div>
              <div className="hims-id-badge">
                <span className="hims-id-badge-lbl">IPD ADM NO</span>
                <strong className="hims-id-badge-val">{admission.admission_no || "—"}</strong>
              </div>
              <div className="hims-id-badge hims-id-badge--bed">
                <span className="hims-id-badge-lbl">ASSIGNED WARD &amp; BED</span>
                <strong className="hims-id-badge-val hims-id-badge-val--bed">
                  <Icon name="LuBed" size={12} /> {admission.ward_name || "General Ward"} • {admission.bed_name || "Bed"}
                </strong>
              </div>
            </div>
          </div>

          <form id="hims-discharge-workflow-form" onSubmit={handleConfirmDischarge}>
            {/* PANEL 2: HOSPITAL CLEARANCES & LIVE DUES SETTLEMENT (Red Ribbon) */}
            <div className="hims-panel">
              <div className="hims-panel-header hims-panel-header--red">
                <Icon name="LuShieldCheck" size={14} />
                <span>2. HOSPITAL DEPARTMENT CLEARANCES </span>
              </div>
              <div className="hims-panel-content">
                {/* Real-time Dues Audit */}
                {duesLoading ? (
                  <div className="hims-dues-loading">
                    <Icon name="LuClock" size={15} /> Auditing real-time billing, pharmacy &amp; investigation dues…
                  </div>
                ) : pendingDues ? (
                  <>
                    <div className="hims-dues-strip">
                      <div className="hims-dues-kpi">
                        <span className="hims-kpi-lbl">Incurred Charges</span>
                        <strong className="hims-kpi-val">₹{pendingDues.totalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div className="hims-dues-kpi">
                        <span className="hims-kpi-lbl">Payments Received</span>
                        <strong className="hims-kpi-val hims-text--green">₹{pendingDues.totalPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div className={`hims-dues-kpi ${pendingDues.cleared ? "hims-kpi--cleared" : "hims-kpi--pending"}`}>
                        <span className="hims-kpi-lbl">{pendingDues.cleared ? "Net Balance Cleared" : "Net Balance Due"}</span>
                        <strong className={`hims-kpi-val ${pendingDues.cleared ? "hims-text--green" : "hims-text--red"}`}>
                          ₹{pendingDues.pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>

                    {/* Pending Dues Action Bar */}
                    {pendingDues.pendingAmount > 0 && (
                      <div style={{ marginTop: 12, padding: "12px 16px", background: "#fef2f2", border: "1.5px solid #f87171", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Icon name="LuAlertCircle" size={22} style={{ color: "#dc2626" }} />
                          <div>
                            <strong style={{ color: "#991b1b", fontSize: "14px" }}>Pending Dues Outstanding: ₹{pendingDues.pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                            <div style={{ fontSize: "12px", color: "#b91c1c" }}>Clear balance in IPD billing before discharge approval.</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={{ padding: "8px 16px", background: "#0284c7", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "13px", boxShadow: "0 2px 4px rgba(2,132,199,0.2)" }}
                            onClick={() => navigate(`/billing/ipd?admissionId=${admission.id || admission.admission_no}`, { state: { admission } })}
                          >
                            <Icon name="LuCreditCard" size={15} /> 💳 Go to IPD Billing &amp; Settle Dues
                          </button>
                          <button
                            type="button"
                            style={{ padding: "8px 16px", background: "#16a34a", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "13px", boxShadow: "0 2px 4px rgba(22,163,74,0.2)" }}
                            onClick={handleQuickSettleDues}
                          >
                            <Icon name="LuCheckCircle" size={15} /> Quick Settle Dues (₹{pendingDues.pendingAmount.toLocaleString("en-IN")})
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Excess Advance Action Bar */}
                    {pendingDues.excessAmount > 0 && (
                      <div style={{ marginTop: 12, padding: "12px 16px", background: "#ecfdf5", border: "1.5px solid #34d399", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Icon name="LuCheckCircle2" size={24} style={{ color: "#059669" }} />
                          <div>
                            <strong style={{ color: "#065f46", fontSize: "14px" }}>All Inpatient Charges Cleared • Excess Advance: ₹{pendingDues.excessAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                            <div style={{ fontSize: "12px", color: "#047857" }}>
                              Patient paid excess advance deposit. Current Wallet Balance: <strong>₹{(pendingDues.walletBalance || 0).toLocaleString("en-IN")}</strong>.
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={{ padding: "8px 14px", background: "#6366f1", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "12.5px" }}
                            onClick={handleCreditExcessToWallet}
                          >
                            <Icon name="LuWallet" size={15} /> 👛 Credit to Patient Wallet
                          </button>
                          <button
                            type="button"
                            style={{ padding: "8px 14px", background: "#d97706", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "12.5px" }}
                            onClick={() => setShowRefundModal(true)}
                          >
                            <Icon name="LuRotateCcw" size={15} /> 💵 Process Cash / Mode Refund
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="hims-dues-strip hims-dues-strip--ok">
                    <div className="hims-dues-kpi">
                      <span className="hims-kpi-lbl">Incurred Charges</span>
                      <strong className="hims-kpi-val">₹0.00</strong>
                    </div>
                    <div className="hims-dues-kpi">
                      <span className="hims-kpi-lbl">Payments Received</span>
                      <strong className="hims-kpi-val hims-text--green">₹0.00</strong>
                    </div>
                    <div className="hims-dues-kpi hims-kpi--cleared">
                      <span className="hims-kpi-lbl">Net Balance Cleared</span>
                      <strong className="hims-kpi-val hims-text--green">₹0.00</strong>
                    </div>
                  </div>
                )}

                {/* 3 Department Clearances */}
                <div className="hims-clearances-grid">
                  <button
                    type="button"
                    className={`hims-clearance-btn ${clearanceChecklist.billingCleared ? "hims-clearance-btn--active" : ""}`}
                    onClick={() => {
                      if (pendingDues && !pendingDues.cleared) {
                        toast.error(`Outstanding dues of ₹${pendingDues.pendingAmount.toLocaleString("en-IN")} pending in billing.`);
                        return;
                      }
                      setClearanceChecklist({ ...clearanceChecklist, billingCleared: !clearanceChecklist.billingCleared });
                    }}
                  >
                    <div className="hims-clearance-icon"><Icon name="LuCreditCard" size={16} /></div>
                    <div className="hims-clearance-text">
                      <strong>Billing &amp; Cash Clearance</strong>
                      <span>{clearanceChecklist.billingCleared ? "Verified & Cleared" : "Pending Reconciliation"}</span>
                    </div>
                    <span className={`hims-status-pill ${clearanceChecklist.billingCleared ? "hims-status-pill--ok" : "hims-status-pill--warn"}`}>
                      {clearanceChecklist.billingCleared ? "✓ CLEARED" : "PENDING"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`hims-clearance-btn ${clearanceChecklist.pharmacyReturned ? "hims-clearance-btn--active" : ""}`}
                    onClick={() => setClearanceChecklist({ ...clearanceChecklist, pharmacyReturned: !clearanceChecklist.pharmacyReturned })}
                  >
                    <div className="hims-clearance-icon"><Icon name="LuRepeat" size={16} /></div>
                    <div className="hims-clearance-text">
                      <strong>Pharmacy Return Clearance</strong>
                      <span>{clearanceChecklist.pharmacyReturned ? "Surplus Drugs Reconciled" : "Stock Return Pending"}</span>
                    </div>
                    <span className={`hims-status-pill ${clearanceChecklist.pharmacyReturned ? "hims-status-pill--ok" : "hims-status-pill--warn"}`}>
                      {clearanceChecklist.pharmacyReturned ? "✓ CLEARED" : "PENDING"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`hims-clearance-btn ${clearanceChecklist.nursingChartHandover ? "hims-clearance-btn--active" : ""}`}
                    onClick={() => setClearanceChecklist({ ...clearanceChecklist, nursingChartHandover: !clearanceChecklist.nursingChartHandover })}
                  >
                    <div className="hims-clearance-icon"><Icon name="LuFileCheck" size={16} /></div>
                    <div className="hims-clearance-text">
                      <strong>Nursing Chart Handover</strong>
                      <span>{clearanceChecklist.nursingChartHandover ? "IV Lines Removed & Handed Over" : "Nursing Pending"}</span>
                    </div>
                    <span className={`hims-status-pill ${clearanceChecklist.nursingChartHandover ? "hims-status-pill--ok" : "hims-status-pill--warn"}`}>
                      {clearanceChecklist.nursingChartHandover ? "✓ CLEARED" : "PENDING"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* PANEL 3: DISCHARGE DISPOSITION & CLINICAL TREATMENT COURSE (Green Ribbon) */}
            <div className="hims-panel">
              <div className="hims-panel-header hims-panel-header--green">
                <Icon name="LuActivity" size={14} />
                <span>3. DISCHARGE DISPOSITION &amp; CLINICAL TREATMENT COURSE</span>
              </div>
              <div className="hims-panel-content">
                {/* Row 1: Discharge Type & Condition */}
                <div className="hims-form-grid-2">
                  <div className="hims-field-group">
                    <label>Discharge Type (डिस्चार्ज प्रकार) *</label>
                    <select
                      className="hims-select hims-select--bold"
                      value={dischargeForm.discharge_type}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_type: e.target.value })}
                    >
                      {DISCHARGE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hims-field-group">
                    <label>Condition at Discharge (डिस्चार्ज स्थिति) *</label>
                    <select
                      className="hims-select hims-select--bold"
                      value={dischargeForm.discharge_condition}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_condition: e.target.value })}
                    >
                      {DISCHARGE_CONDITIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Clinical Diagnosis Dropdown */}
                <div className="hims-form-grid-2" style={{ marginTop: 8 }}>
                  <div className="hims-field-group">
                    <label>Select Clinical Diagnosis (क्लिनिकल निदान)</label>
                    <select
                      className="hims-select"
                      onChange={(e) => {
                        if (e.target.value) {
                          setDischargeForm({ ...dischargeForm, final_diagnosis: e.target.value });
                        }
                      }}
                      value={COMMON_DIAGNOSES.includes(dischargeForm.final_diagnosis) ? dischargeForm.final_diagnosis : ""}
                    >
                      <option value="">-- Quick Select Common Diagnosis --</option>
                      {COMMON_DIAGNOSES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 4: DISCHARGE MEDICATION REGIMEN (Rx) (Indigo Ribbon) */}
            <div className="hims-panel">
              <div className="hims-panel-header hims-panel-header--indigo" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="LuPill" size={14} />
                  <span>4. DISCHARGE MEDICATION REGIMEN (℞ डिस्चार्ज पर दवाइयाँ)</span>
                </div>
                <span className="hims-badge-rx-count">
                  {dischargeForm.medications.length} {dischargeForm.medications.length === 1 ? "Medicine" : "Medicines"} Prescribed
                </span>
              </div>
              <div className="hims-panel-content">
                {/* Single Medicine Auto-Populating Entry Card */}
                <div className="hims-rx-builder-bar">
                  <div className="hims-rx-quick-select-block">
                    <div className="hims-field-group">
                      <label style={{ display: "flex", alignItems: "center", gap: 5, color: "#1e1b4b", fontWeight: 800 }}>
                        <Icon name="LuPill" size={13} style={{ color: "#4f46e5" }} /> 
                        Select Medicine to Prescribe (दवा चुनें - डोज़, अवधि व समय स्वतः सेट होंगे):
                      </label>
                      {newMed.isCustom ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            type="text"
                            className="hims-input hims-input--bold"
                            placeholder="Type custom medicine name & strength..."
                            value={newMed.customName}
                            onChange={(e) => setNewMed({ ...newMed, customName: e.target.value })}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="hims-btn-subtle"
                            onClick={() => setNewMed({ ...newMed, isCustom: false, customName: "", name: "" })}
                            title="Switch back to standard medicine list"
                          >
                            Hospital List
                          </button>
                        </div>
                      ) : (
                        <select
                          className="hims-select hims-select--bold hims-select--highlight"
                          value={newMed.name}
                          onChange={(e) => handleSelectMedicinePreset(e.target.value)}
                        >
                          <option value="">-- Click to Select Medicine (दवा चुनें) --</option>
                          {MEDICINE_PRESETS.map((p) => (
                            <option key={p.name} value={p.name}>
                              💊 {p.name} — [{p.dosage} • {p.frequency.split("/")[0].trim()} • {p.days}]
                            </option>
                          ))}
                          <option value="__custom__">✏️ Type Custom Medicine...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Auto-populated Parameters: Dosage, Frequency, Duration, Instructions + Add Button */}
                  <div className="hims-rx-params-grid">
                    <div className="hims-field-group">
                      <label>Dosage (मात्रा)</label>
                      <select
                        className="hims-select"
                        value={newMed.dosage}
                        onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                      >
                        {DOSAGE_OPTIONS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="hims-field-group">
                      <label>Frequency (समय / बार)</label>
                      <select
                        className="hims-select"
                        value={newMed.frequency}
                        onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                      >
                        {FREQUENCY_OPTIONS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div className="hims-field-group">
                      <label>Duration (अवधि)</label>
                      <select
                        className="hims-select"
                        value={newMed.days}
                        onChange={(e) => setNewMed({ ...newMed, days: e.target.value })}
                      >
                        {DURATION_OPTIONS.map((dur) => (
                          <option key={dur} value={dur}>{dur}</option>
                        ))}
                      </select>
                    </div>

                    <div className="hims-field-group hims-rx-flex-inst">
                      <label>Instructions (निर्देश)</label>
                      <select
                        className="hims-select"
                        value={newMed.instructions}
                        onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                      >
                        <option value="After Meals (भोजन के बाद)">After Meals (भोजन के बाद)</option>
                        <option value="Before Breakfast (सुबह खाली पेट)">Before Breakfast (सुबह खाली पेट)</option>
                        <option value="With Milk (दूध के साथ)">With Milk (दूध के साथ)</option>
                        <option value="At Bedtime (रात को सोते समय)">At Bedtime (रात को सोते समय)</option>
                        <option value="With Meals (भोजन के साथ)">With Meals (भोजन के साथ)</option>
                        <option value="As Directed (निर्देशानुसार)">As Directed (निर्देशानुसार)</option>
                      </select>
                    </div>

                    <div className="hims-field-group hims-rx-action-wrap">
                      <label style={{ visibility: "hidden" }}>Add</label>
                      <button
                        type="button"
                        className="hims-btn-add-medicine-action"
                        onClick={handleAddMedicationToList}
                      >
                        <Icon name="LuPlus" size={14} /> Add Medicine
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prescribed Medicines List Table (नीचे लिस्ट में दवाइयां आती जाएंगी) */}
                {dischargeForm.medications.length === 0 ? (
                  <div className="hims-empty-rx-state">
                    <Icon name="LuPill" size={24} style={{ color: "#94a3b8" }} />
                    <p>No post-discharge medications added yet.</p>
                    <span>Select medicine parameters in the top bar and click <strong>&quot;+ Add Medicine&quot;</strong>.</span>
                  </div>
                ) : (
                  <div className="hims-table-responsive" style={{ marginTop: 8 }}>
                    <table className="hims-table">
                      <thead>
                        <tr>
                          <th style={{ width: "4%" }}>#</th>
                          <th style={{ width: "35%" }}>Medicine Name &amp; Formulation</th>
                          <th style={{ width: "13%" }}>Dosage</th>
                          <th style={{ width: "20%" }}>Frequency / Timing</th>
                          <th style={{ width: "12%" }}>Duration</th>
                          <th style={{ width: "12%" }}>Instructions</th>
                          <th style={{ width: "4%", textAlign: "center" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dischargeForm.medications.map((med, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: "center", fontWeight: 700, color: "#64748b" }}>{idx + 1}</td>
                            <td>
                              <strong style={{ color: "#0f172a", fontSize: "12.5px" }}>{med.name}</strong>
                            </td>
                            <td>
                              <span className="hims-med-pill hims-med-pill--dosage">{med.dosage}</span>
                            </td>
                            <td>
                              <span className="hims-med-pill hims-med-pill--freq">{med.frequency}</span>
                            </td>
                            <td>
                              <span className="hims-med-pill hims-med-pill--duration">{med.days}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: "11.5px", color: "#475569" }}>{med.instructions || "After Meals"}</span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                className="hims-btn-del-row"
                                onClick={() => handleRemoveMedication(idx)}
                                title="Remove Medicine"
                              >
                                <Icon name="LuTrash2" size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* PANEL 5: POST-DISCHARGE ADVICE & FOLLOW-UP (Amber Ribbon) */}
            <div className="hims-panel">
              <div className="hims-panel-header hims-panel-header--amber">
                <Icon name="LuCalendar" size={14} />
                <span>5. POST-DISCHARGE ADVICE &amp; FOLLOW-UP SCHEDULE</span>
              </div>
              <div className="hims-panel-content">
                {/* Row 1: Follow-Up Date Picker */}
                <div className="hims-form-grid-2">
                  <div className="hims-field-group">
                    <label>Follow-Up Date (अगली जांच तिथि) *</label>
                    <input
                      type="date"
                      className="hims-input hims-input--bold"
                      value={dischargeForm.follow_up_date}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, follow_up_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Dietary Guidance Details with Multi-Select Capability */}
                <div className="hims-field-group" style={{ marginTop: 10 }} ref={dietDropdownRef}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <label style={{ margin: 0 }}>Dietary Guidance Instructions (आहार निर्देश विवरण) *</label>
                    <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 650 }}>
                      Multiple Select Available / एकाधिक विकल्प चुनें
                    </span>
                  </div>

                  {/* Multi-Select Dropdown with Checkbox Options */}
                  <div style={{ position: "relative", marginBottom: 6 }}>
                    <button
                      type="button"
                      className="hims-select"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        textAlign: "left",
                        height: "38px",
                        background: "#f8fafc",
                        fontWeight: 650,
                        border: "1.5px solid #cbd5e1"
                      }}
                      onClick={() => setDietDropdownOpen(!dietDropdownOpen)}
                    >
                      <span style={{ color: DIET_OPTIONS.filter((d) => (dischargeForm.diet_advice || "").includes(d.full)).length > 0 ? "#0369a1" : "#475569" }}>
                        {DIET_OPTIONS.filter((d) => (dischargeForm.diet_advice || "").includes(d.full)).length > 0
                          ? `✓ ${DIET_OPTIONS.filter((d) => (dischargeForm.diet_advice || "").includes(d.full)).length} Dietary Guidance Option(s) Selected (Click to change)`
                          : "-- Click to Select Multiple Dietary Guidance Instructions --"}
                      </span>
                      <Icon name={dietDropdownOpen ? "LuChevronUp" : "LuChevronDown"} size={16} />
                    </button>

                    {dietDropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 60,
                          background: "#ffffff",
                          border: "1.5px solid #0284c7",
                          borderRadius: "6px",
                          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                          marginTop: "4px",
                          padding: "4px 0",
                          maxHeight: "260px",
                          overflowY: "auto"
                        }}
                      >
                        {DIET_OPTIONS.map((item) => {
                          const isSelected = (dischargeForm.diet_advice || "").includes(item.full);
                          return (
                            <div
                              key={item.id}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "10px",
                                padding: "8px 12px",
                                cursor: "pointer",
                                background: isSelected ? "#f0f9ff" : "transparent",
                                borderBottom: "1px solid #f1f5f9",
                                transition: "background 0.15s ease"
                              }}
                              onClick={() => handleToggleDietOption(item)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ marginTop: "3px", width: "16px", height: "16px", cursor: "pointer", accentColor: "#0284c7" }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 750, color: isSelected ? "#0369a1" : "#0f172a", fontSize: "13px" }}>
                                  {item.short}
                                </div>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                  {item.full}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick Selectable Pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {DIET_OPTIONS.map((item) => {
                      const isSelected = (dischargeForm.diet_advice || "").includes(item.full);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleDietOption(item)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "14px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            border: isSelected ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
                            background: isSelected ? "#e0f2fe" : "#ffffff",
                            color: isSelected ? "#0369a1" : "#334155",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s ease",
                            boxShadow: isSelected ? "0 1px 2px rgba(2, 132, 199, 0.15)" : "none"
                          }}
                        >
                          {isSelected ? <Icon name="LuCheck" size={12} /> : <span>+</span>}
                          <span>{item.short}</span>
                          {isSelected && <Icon name="LuX" size={11} style={{ marginLeft: 2 }} />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Editable Instructions Input */}
                  <input
                    type="text"
                    className="hims-input"
                    placeholder="e.g. Light, easily digestible diet. Maintain adequate hydration."
                    value={dischargeForm.diet_advice}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, diet_advice: e.target.value })}
                  />
                </div>

               
              </div>
            </div>

            {/* 3. Bottom Action Toolbar matching Image 1 buttons */}
            <div className="hims-toolbar">
              <div className="hims-toolbar-left">
                <button
                  type="button"
                  className="hims-btn hims-btn--preview"
                  onClick={handleOpenSummary}
                  title="Preview official summary slip"
                >
                  <Icon name="LuFileText" size={15} /> Preview Summary Slip
                </button>
              </div>
              <div className="hims-toolbar-right">
                <button
                  type="button"
                  className="hims-btn hims-btn--exit"
                  onClick={onBack}
                >
                  <Icon name="LuX" size={15} /> Exit
                </button>
                <button
                  type="submit"
                  className="hims-btn hims-btn--confirm"
                >
                  <Icon name="LuCheckCircle" size={16} /> Confirm Discharge &amp; Release Bed
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Printable Official Discharge Slip Modal */}
      {/* Printable Official Discharge Slip Modal */}
      {printModalOpen && admission && (() => {
        const payload = mapAdmissionToDischargePayload(
          admission,
          currentSummary,
          dischargeForm,
          pendingDues
        );
        const activeSettings = dischargePrintSettings || DEFAULT_IPD_DISCHARGE_SETTINGS;

        return (
          <div className="ipd-modal-overlay" onClick={() => setPrintModalOpen(false)}>
            <div
              className="ipd-modal-card ipd-print-modal-card"
              style={{
                maxWidth: "960px",
                width: "95vw",
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="ipd-modal-header ipd-print-modal-head" style={{ padding: "14px 20px" }}>
                <div className="ipd-print-modal-title-group">
                  <div className="ipd-print-modal-badge-icon" style={{ background: "#0284c7", color: "white" }}>
                    <Icon name="LuFileCheck" size={18} />
                  </div>
                  <div>
                    <h3 className="ipd-modal-title" style={{ fontSize: "16px", fontWeight: 800 }}>
                      Clinical Discharge Summary &amp; Clearance Certificate
                    </h3>
                    <p className="ipd-modal-sub" style={{ fontSize: "12px", color: "#64748b" }}>
                      Patient: <strong style={{ color: "#0f172a" }}>{payload.patient.name}</strong> (UHID: {payload.patient.uhid}) • IPD Adm: <strong>{payload.admission.ipdNumber}</strong>
                    </p>
                  </div>
                </div>

                <div className="ipd-print-modal-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => navigate("/settings")}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all"
                    title="Customize discharge layout, fields, and hospital branding in Settings"
                  >
                    <Icon name="LuSliders" size={14} /> Customize Slip
                  </button>
                  <button
                    type="button"
                    className="ipd-btn-print-primary"
                    onClick={handlePrintDischargeSummary}
                    title="Print Official Slip (Ctrl + P)"
                    style={{
                      background: "#0369a1",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "8px 16px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 4px rgba(2, 132, 199, 0.2)",
                    }}
                  >
                    <Icon name="LuPrinter" size={15} /> Print Summary Slip
                  </button>
                  <button
                    type="button"
                    className="ipd-modal-close-btn"
                    onClick={() => setPrintModalOpen(false)}
                    title="Close"
                  >
                    <Icon name="LuX" size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body with WYSIWYG Preview */}
              <div
                className="ipd-modal-body ipd-print-modal-body-scroll"
                style={{
                  background: "#f1f5f9",
                  padding: "24px 16px",
                  overflowY: "auto",
                  flex: 1,
                }}
              >
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                  <IPDDischargePreview settings={activeSettings} data={payload} />
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="ipd-modal-footer ipd-print-modal-foot"
                style={{
                  padding: "12px 20px",
                  background: "#ffffff",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div className="flex items-center gap-3 text-xs">
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "14px",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: payload.billing.isCleared ? "#ecfdf5" : "#fffbeb",
                      color: payload.billing.isCleared ? "#065f46" : "#92400e",
                      border: `1px solid ${payload.billing.isCleared ? "#a7f3d0" : "#fde68a"}`,
                    }}
                  >
                    <Icon name={payload.billing.isCleared ? "LuCheckCircle" : "LuAlertTriangle"} size={13} />
                    {payload.billing.clearanceStatus}
                  </span>
                  <span style={{ color: "#64748b" }}>
                    Stay: <strong style={{ color: "#334155" }}>{payload.admission.stay}</strong> • Rx: <strong style={{ color: "#334155" }}>{payload.medicines.length} Medications</strong>
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    className="ipd-btn-summary"
                    onClick={() => setPrintModalOpen(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Close Preview
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintDischargeSummary}
                    className="ipd-btn-print-primary"
                    style={{
                      background: "#0369a1",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "8px 18px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Icon name="LuPrinter" size={15} /> Print Summary Slip
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Official Refund Modal */}
      {showRefundModal && pendingDues && pendingDues.excessAmount > 0 && (
        <div className="ipd-modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="ipd-modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header" style={{ background: "#d97706", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="LuRotateCcw" size={18} />
                <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>Process Excess Advance Refund</h3>
              </div>
              <button
                type="button"
                className="ipd-modal-close-btn"
                style={{ color: "#fff" }}
                onClick={() => setShowRefundModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmRefund}>
              <div className="ipd-modal-body" style={{ padding: "20px" }}>
                <div style={{ background: "#fef3c7", padding: "12px", borderRadius: 6, marginBottom: 16 }}>
                  <div style={{ fontSize: "12px", color: "#92400e" }}>Refundable Excess Amount:</div>
                  <strong style={{ fontSize: "20px", color: "#b45309" }}>
                    ₹{pendingDues.excessAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </strong>
                  <div style={{ fontSize: "11px", color: "#78350f", marginTop: 4 }}>
                    Patient: {patientFullName} ({admission.admission_no})
                  </div>
                </div>

                <div className="hims-field-group" style={{ marginBottom: 12 }}>
                  <label>Refund Payment Method *</label>
                  <select
                    className="hims-select"
                    value={refundForm.method}
                    onChange={(e) => setRefundForm({ ...refundForm, method: e.target.value })}
                  >
                    <option value="Cash">Cash Return</option>
                    <option value="UPI">UPI / Digital Transfer</option>
                    <option value="Card">Original Card Reversal</option>
                    <option value="Bank Transfer">NEFT / Bank Transfer</option>
                  </select>
                </div>

                <div className="hims-field-group">
                  <label>Remarks / Refund Voucher Notes</label>
                  <input
                    type="text"
                    className="hims-input"
                    placeholder="e.g. Excess advance refunded at patient discharge"
                    value={refundForm.notes}
                    onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="ipd-modal-footer" style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="ipd-btn-summary"
                  onClick={() => setShowRefundModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundProcessing}
                  style={{
                    padding: "8px 18px",
                    background: "#d97706",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {refundProcessing ? "Processing..." : `Confirm Refund ₹${pendingDues.excessAmount.toLocaleString("en-IN")}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

