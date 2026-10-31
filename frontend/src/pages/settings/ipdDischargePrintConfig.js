/**
 * IPD discharge-summary print configuration.
 * Persist this object under the settings key: print_slip_ipd_discharge
 */
export const IPD_DISCHARGE_SETTINGS_KEY = "print_slip_ipd_discharge";

const field = (label, show = true) => ({ label, show });

export const DEFAULT_IPD_DISCHARGE_SETTINGS = {
  hospital: {
    name: "Narayan Hospital",
    subtitle: "Super Speciality Healthcare & Research Institute",
    registrationNo: "REG/UP/2024/098",
    address: "Jansa, Varanasi, Uttar Pradesh, 221405",
    phone: "+91 7388660408",
    email: "info@narayanhospital.com",
    logoUrl: "/images/Narayan_Logo.png",
  },
  page: {
    size: "A4",
    orientation: "portrait",
    margin: 9,
    showPageNumber: true,
    showGeneratedAt: true,
  },
  style: {
    primary: "#173b63",
    accent: "#087fbd",
    text: "#17263b",
    muted: "#64748b",
    border: "#d7e1ec",
    sectionBackground: "#f3f7fb",
    fontFamily: "Arial, sans-serif",
    fontSize: 10,
    compact: false,
  },
  header: {
    title: "DISCHARGE SUMMARY",
    showLogo: true,
    showSubtitle: true,
    showRegistrationNo: true,
    showAddress: true,
    showContact: true,
    showDocumentLabel: true,
    showBarcode: true,
    showTopUHID: true,
    showTopAdmissionNo: true,
  },
  patient: {
    enabled: true,
    title: "PATIENT DETAILS",
    fields: {
      uhid: field("UHID No."),
      name: field("Patient Name"),
      ageGender: field("Age / Gender"),
      mobile: field("Mobile No."),
      address: field("Address"),
      bloodGroup: field("Blood Group"),
      allergies: field("Known Allergies / Allergy Status"),
      guardian: field("Guardian / Attendant"),
      relation: field("Relation"),
    },
  },
  admission: {
    enabled: true,
    title: "ADMISSION & DISCHARGE DETAILS",
    fields: {
      ipdNumber: field("IPD Admission No."),
      admissionDate: field("Date & Time of Admission"),
      dischargeDate: field("Date & Time of Discharge"),
      stay: field("Length of Stay"),
      wardBed: field("Ward / Bed"),
      department: field("Department"),
      consultant: field("Treating Consultant"),
      referredBy: field("Referred By", false),
      dischargeType: field("Discharge Type"),
      dischargeCondition: field("Condition at Discharge"),
      destination: field("Discharged To", false),
    },
  },
  diagnosis: {
    enabled: true,
    title: "CLINICAL SUMMARY",
    fields: {
      chiefComplaints: field("Chief Complaints"),
      history: field("Relevant History"),
      examination: field("Examination on Admission", false),
      primaryDiagnosis: field("Final / Primary Diagnosis"),
      secondaryDiagnosis: field("Other Diagnoses / Comorbidities", false),
      investigations: field("Important Investigations"),
      procedures: field("Procedures / Operations", false),
      treatmentGiven: field("Treatment During Admission"),
      hospitalCourse: field("Brief Hospital Course"),
    },
  },
  vitals: {
    enabled: true,
    title: "VITALS AT DISCHARGE",
    leaveBlankForPen: true,
    fields: {
      bp: field("Blood Pressure"),
      pulse: field("Pulse"),
      temperature: field("Temperature"),
      spo2: field("SpO₂"),
      respiratoryRate: field("Respiratory Rate", false),
      weight: field("Weight", false),
      bloodSugar: field("Blood Sugar", false),
      consciousness: field("Consciousness / Orientation", false),
      mobility: field("Mobility", false),
    },
  },
  billing: {
    enabled: true,
    title: "BILLING SUMMARY & PAYMENT CLEARANCE",
    showNoDuesCertificate: true,
    showDepartmentBreakdown: false,
    fields: {
      totalCharges: field("Total IPD Charges"),
      discount: field("Discount / Waiver", false),
      amountPaid: field("Amount Paid"),
      balance: field("Balance Outstanding"),
      paymentMode: field("Payment Mode", false),
      receiptNo: field("Receipt / Transaction No.", false),
      clearanceStatus: field("Financial Clearance Status"),
      verifiedBy: field("Clearance Verified By", false),
    },
  },
  medicines: {
    enabled: true,
    title: "DISCHARGE MEDICATIONS & DOSAGE REGIMEN",
    note: "Take medicines exactly as directed by the treating physician.",
    showEmptyState: false,
    columns: [
      { key: "sr", label: "#", show: true, width: 4 },
      {
        key: "medicine",
        label: "Medicine Name & Formulation",
        show: true,
        width: 27,
      },
      { key: "dose", label: "Dose", show: true, width: 14 },
      { key: "route", label: "Route", show: false, width: 10 },
      { key: "frequency", label: "Frequency & Timing", show: true, width: 22 },
      { key: "duration", label: "Duration", show: true, width: 12 },
      { key: "instructions", label: "Instructions", show: true, width: 19 },
    ],
  },
  advice: {
    enabled: true,
    title: "DISCHARGE ADVICE & FOLLOW-UP",
    fields: {
      followUpDate: field("Follow-up Date & Time"),
      followUpDepartment: field("Follow-up Department / Clinic", false),
      diet: field("Diet Advice"),
      activity: field("Activity / Rest Advice"),
      woundCare: field("Wound / Dressing Care", false),
      pendingReports: field("Pending Reports / Results", false),
      referral: field("Referral / Further Care", false),
      warningSigns: field("When to Seek Emergency Care"),
      emergencyContact: field("Emergency Contact"),
    },
  },
  handover: {
    enabled: false,
    title: "PATIENT HANDOVER & DOCUMENTS",
    fields: {
      documents: field("Documents / Reports Handed Over"),
      belongings: field("Patient Belongings Returned", false),
      devices: field("Devices / Implants / Lines", false),
      attendant: field("Instructions Explained to Attendant", false),
    },
  },
  signatures: {
    enabled: true,
    showPatient: true,
    showNurse: true,
    showResident: false,
    showConsultant: true,
    showStamp: true,
    patientLabel: "Patient / Attendant Signature",
    nurseLabel: "Discharging Nurse",
    residentLabel: "Resident Medical Officer",
    consultantLabel: "Treating Consultant",
  },
  footer: {
    enabled: true,
    showHospitalName: true,
    showAddress: true,
    showPhone: true,
    showDisclaimer: true,
    disclaimer:
      "This discharge summary is part of the patient's medical record. Please retain it and bring it to every follow-up visit.",
    closingText: "We wish you a smooth and speedy recovery.",
  },
  customSections: [],
};

export const SAMPLE_IPD_DISCHARGE = {
  documentType: "NORMAL",
  generatedAt: "31 Oct 2026, 03:49 PM",
  patient: {
    uhid: "1026-0104",
    name: "Tony Stark",
    age: "46 Years",
    gender: "Male",
    mobile: "8467931976",
    address: "Jansa, Varanasi, Uttar Pradesh – 221405",
    bloodGroup: "B+",
    allergies: "No known drug allergies reported",
    guardian: "Pepper Potts",
    relation: "Spouse",
  },
  admission: {
    ipdNumber: "ADM-26-0024",
    admissionDate: "30 Oct 2026, 01:01 PM",
    dischargeDate: "31 Oct 2026, 11:54 AM",
    stay: "1 Day",
    ward: "Semi-Private Surgical Ward",
    bed: "SP-202-A",
    department: "General Medicine & Inpatient Care",
    consultant: "Dr. On-Duty Specialist",
    referredBy: "OPD – General Medicine",
    dischargeType: "NORMAL",
    dischargeCondition: "Clinically stable & symptom free",
    destination: "Home",
  },
  clinical: {
    chiefComplaints: "Fever, weakness and reduced appetite for two days.",
    history:
      "Patient was admitted for evaluation and treatment of presenting symptoms. Relevant past history reviewed and documented in the case record.",
    examination:
      "Patient evaluated on admission. Systemic examination findings documented in the inpatient notes.",
    primaryDiagnosis: "Acute febrile illness – improved",
    secondaryDiagnosis: "No significant comorbidity recorded in this sample.",
    investigations:
      "CBC and other investigations reviewed; reports filed in the patient record.",
    procedures: "No operative procedure performed.",
    treatmentGiven:
      "Medical management, supportive care and monitoring as documented in the case sheet.",
    hospitalCourse:
      "Patient received medical management, supportive care and monitoring. Symptoms improved and vital parameters remained stable.",
    dischargeCondition:
      "Conscious, oriented and ambulatory. Haemodynamically stable at the time of discharge.",
  },
  vitals: {
    bp: "",
    pulse: "",
    temperature: "",
    spo2: "",
    respiratoryRate: "",
    weight: "",
    bloodSugar: "",
    consciousness: "",
    mobility: "",
  },
  billing: {
    totalCharges: 1170,
    discount: 0,
    amountPaid: 1170,
    balance: 0,
    paymentMode: "UPI",
    receiptNo: "RCPT-26-0024",
    isCleared: true,
    clearanceStatus: "NO DUES – CERTIFIED",
    verifiedBy: "Accounts Desk (Narayan Hospital)",
    departmentBreakdown: [
      { label: "Room Rent & Nursing", status: "Settled" },
      { label: "Pharmacy Dispensary", status: "Settled" },
      { label: "Pathology & Radiology", status: "Settled" },
      { label: "Consultant Rounds", status: "Settled" },
    ],
  },
  medicines: [
    {
      name: "Paracetamol 650 mg Tablet",
      dose: "1 tablet",
      route: "Oral",
      frequency: "Twice daily after food",
      duration: "3 days",
      instructions: "Take with water",
    },
    {
      name: "Pantoprazole 40 mg Tablet",
      dose: "1 tablet",
      route: "Oral",
      frequency: "Once daily before breakfast",
      duration: "5 days",
      instructions: "Do not crush",
    },
  ],
  advice: {
    followUpDate: "05 Nov 2026, 10:00 AM",
    followUpDepartment: "General Medicine OPD",
    diet: "Light, easily digestible diet. Maintain adequate hydration.",
    activity: "Take adequate rest. Avoid strenuous activity for one week.",
    woundCare: "Not applicable.",
    pendingReports: "No pending reports in this sample.",
    referral: "Not required.",
    warningSigns:
      "Return immediately for high fever, breathing difficulty, chest pain, severe pain, persistent vomiting, confusion or bleeding.",
    emergencyContact: "+91 7388660408 / 108",
  },
  handover: {
    documents:
      "Discharge summary, investigation reports and prescription handed over.",
    belongings: "Patient belongings returned to attendant.",
    devices: "No indwelling devices at discharge.",
    attendant:
      "Medication schedule, follow-up and warning signs explained to the patient / attendant.",
  },
};

export function cloneIPDSettings(value) {
  return JSON.parse(JSON.stringify(value));
}

export function mergeIPDSettings(base, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming))
    return base;
  const result = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    )
      result[key] = mergeIPDSettings(base[key], value);
    else result[key] = value;
  }
  return result;
}

/**
 * Adapter that maps database Admission, Clinical Summary, Discharge Form,
 * and Live Billing / Pending Dues into the expected IPD Discharge print payload contract.
 *
 * Strict Billing Clearance Rule:
 * The handler prints NO DUES CERTIFICATE only when billing.isCleared === true and the calculated/recorded balance is zero or less.
 * A positive balance prints a pending-clearance message. Missing billing data, or a zero balance without explicit clearance confirmation, does not print a no-dues certificate.
 */
export function mapAdmissionToDischargePayload(admission = {}, summary = {}, form = {}, pendingDues = null) {
  // 1. Patient info
  const fullName = [admission.first_name, admission.last_name].filter(Boolean).join(" ").trim() ||
    admission.patient_name || admission.name || "Patient";

  const patient = {
    uhid: admission.uhid || admission.patient_uhid || "—",
    name: fullName,
    age: admission.age ? `${admission.age} Years` : (admission.patient_age ? `${admission.patient_age} Years` : "—"),
    gender: admission.gender || admission.patient_gender || "—",
    mobile: admission.mobile || admission.phone || admission.patient_mobile || "—",
    address: admission.address || admission.patient_address || "Jansa, Varanasi, Uttar Pradesh, 221405",
    bloodGroup: admission.blood_group || admission.patient_blood_group || "N/A",
    allergies: summary?.allergies || admission.allergies || "No known drug allergies reported",
    guardian: admission.guardian_name || admission.guardian || admission.attendant_name || "—",
    relation: admission.guardian_relationship || admission.relation || "Attendant / Family",
  };

  // 2. Admission & Stay info
  const admDate = admission.admitted_at ? new Date(admission.admitted_at) : null;
  const disDate = admission.discharged_at ? new Date(admission.discharged_at) : (form?.discharge_date ? new Date(form.discharge_date) : new Date());

  let stay = "1 Day";
  if (admDate && disDate) {
    const diffHours = Math.max(1, Math.round((disDate - admDate) / (1000 * 60 * 60)));
    const diffDays = Math.max(1, Math.ceil((disDate - admDate) / (1000 * 60 * 60 * 24)));
    stay = diffHours < 24 ? `${diffHours} Hours` : `${diffDays} Day${diffDays > 1 ? "s" : ""}`;
  }

  const formatDt = (d) => {
    if (!d) return "—";
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return String(d);
    return dateObj.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const consultantName = [admission.doctor_first_name, admission.doctor_last_name].filter(Boolean).join(" ").trim() ||
    admission.consultant_name || admission.doctor_name || "Treating Consultant";

  const admissionDetails = {
    ipdNumber: admission.admission_no || (admission.id ? `ADM-${String(admission.id).slice(0, 8).toUpperCase()}` : "—"),
    admissionDate: formatDt(admission.admitted_at),
    dischargeDate: formatDt(admission.discharged_at || (form?.discharge_date ? form.discharge_date : new Date())),
    stay,
    ward: admission.ward_name || admission.ward || "General Inpatient Ward",
    bed: admission.bed_name || admission.bed || "Bed",
    department: admission.department_name || admission.department || "General Medicine & Inpatient Care",
    consultant: consultantName.startsWith("Dr.") ? consultantName : `Dr. ${consultantName}`,
    referredBy: admission.referred_by || form?.referred_by || "Self / Emergency Walk-in",
    dischargeType: (form?.discharge_type || admission.discharge_type || "NORMAL").toUpperCase(),
    dischargeCondition: form?.discharge_condition || summary?.condition_at_discharge || admission.discharge_condition || "Clinically Stable & Symptom Free",
    destination: form?.destination || form?.transferred_to || "Home",
  };

  // 3. Clinical info
  const clinical = {
    chiefComplaints: summary?.chief_complaints || admission.chief_complaints || admission.reason_for_admission || "Inpatient admission for specialized clinical evaluation and inpatient management.",
    history: summary?.history_of_present_illness || form?.history_of_present_illness || summary?.medical_history || admission.medical_history || "Past medical, surgical, and drug history reviewed and monitored in ward.",
    examination: summary?.physical_examination || form?.physical_examination || "General physical and systemic examination findings reviewed and stabilized.",
    primaryDiagnosis: summary?.final_diagnosis || form?.final_diagnosis || admission.admission_diagnosis || "Inpatient Medical Management Completed",
    secondaryDiagnosis: summary?.secondary_diagnosis || form?.secondary_diagnosis || "",
    investigations: summary?.investigations || form?.procedures_performed || "Routine haematology, biochemistry, and bedside vitals monitored within acceptable clinical limits.",
    procedures: summary?.procedures_performed || form?.procedures_performed || "Continuous vital monitoring, IV fluid support, and scheduled medical therapy.",
    treatmentGiven: summary?.hospital_course || form?.hospital_course || "Patient received active medical care, IV therapy, targeted pharmacotherapy, and supportive recovery management.",
    hospitalCourse: summary?.hospital_course || form?.hospital_course || "Course in hospital was smooth and satisfactory. Clinical parameters normalized, oral tolerance established, and patient is discharged hemodynamically stable.",
  };

  // 4. Vitals (left blank for handwritten entry with pen after taking discharge vitals)
  const vitals = {
    bp: summary?.vitals?.bp || form?.vitals?.bp || form?.discharge_vitals_bp || "",
    pulse: summary?.vitals?.pulse || form?.vitals?.pulse || form?.discharge_vitals_pulse || "",
    temperature: summary?.vitals?.temperature || form?.vitals?.temperature || form?.discharge_vitals_temp || "",
    spo2: summary?.vitals?.spo2 || form?.vitals?.spo2 || form?.discharge_vitals_spo2 || "",
    respiratoryRate: summary?.vitals?.respiratoryRate || form?.vitals?.respiratoryRate || "",
    weight: summary?.vitals?.weight || (admission.weight ? `${admission.weight} kg` : ""),
    bloodSugar: summary?.vitals?.bloodSugar || "",
    consciousness: summary?.vitals?.consciousness || "",
    mobility: summary?.vitals?.mobility || "",
  };

  // 5. Billing clearance
  // Strict rule: isCleared is true ONLY if clearance was explicitly confirmed AND balance <= 0
  const totalCharges = Number(admission.total_charges ?? pendingDues?.totalCharges ?? 0);
  const discount = Number(pendingDues?.discount ?? 0);
  const amountPaid = Number(admission.total_payments ?? pendingDues?.totalPayments ?? (pendingDues?.cleared ? totalCharges : 0));
  const recordedBalance = pendingDues?.pendingAmount != null ? Number(pendingDues.pendingAmount) : Math.max(0, totalCharges - discount - amountPaid);

  const isExplicitlyCleared = Boolean(pendingDues?.cleared) || Boolean(admission.discharged_at);
  const hasNoOutstanding = recordedBalance <= 0;
  const isCleared = isExplicitlyCleared && hasNoOutstanding;

  const billing = {
    totalCharges,
    discount,
    amountPaid,
    balance: Math.max(0, recordedBalance),
    paymentMode: pendingDues?.paymentMode || "Cash / Digital",
    receiptNo: pendingDues?.receiptNo || (admission.admission_no ? `REC-${admission.admission_no}` : "—"),
    isCleared,
    clearanceStatus: isCleared
      ? "CLEARED & SETTLED (NO DUES)"
      : recordedBalance > 0
      ? `PENDING CLEARANCE (₹${recordedBalance})`
      : "AWAITING CLEARANCE CONFIRMATION",
    verifiedBy: pendingDues?.verifiedBy || "Hospital Billing & Accounts Desk",
    departmentBreakdown: [
      { label: "Room / Bed Charges", status: "Settled" },
      { label: "Pharmacy & Consumables", status: "Settled" },
      { label: "Diagnostics & Labs", status: "Settled" },
      { label: "Nursing & Consultant", status: "Settled" },
    ],
  };

  // 6. Medicines
  const rawMeds = summary?.data?.medications || form?.medications || [];
  const medicines = rawMeds.map((m, index) => {
    let route = m.route || "Oral";
    const nameLower = (m.name || "").toLowerCase();
    if (nameLower.includes("inj")) route = "IV / IM";
    else if (nameLower.includes("syp") || nameLower.includes("syrup")) route = "Oral (Syrup)";
    else if (nameLower.includes("cap") || nameLower.includes("tab")) route = "Oral";

    return {
      sr: index + 1,
      name: m.name || m.medicine || `Medication #${index + 1}`,
      dose: m.dosage || m.dose || "1 Tab",
      route,
      frequency: m.frequency || "BD (Twice Daily / सुबह-शाम)",
      duration: m.days || m.duration || "5 Days",
      instructions: m.instructions || "After Meals (भोजन के बाद)",
    };
  });

  // 7. Advice
  const advice = {
    followUpDate: form?.follow_up_date
      ? formatDt(form.follow_up_date)
      : (summary?.follow_up_date ? formatDt(summary.follow_up_date) : "After 5 days in OPD"),
    followUpDepartment: admission.department_name || admission.department || "General Medicine OPD",
    diet: form?.diet_advice || summary?.diet_advice || "Light, balanced, easily digestible diet. Maintain adequate hydration.",
    activity: form?.activity_advice || summary?.activity_advice || "Adequate rest. Avoid heavy weight lifting or strenuous exertion for 1 week.",
    woundCare: "Keep surgical/dressing site dry and clean. Report immediately in case of fever or redness.",
    pendingReports: "All routine inpatient reports handed over to patient attendant.",
    referral: form?.destination ? `Referred to: ${form.destination}` : "Not required.",
    warningSigns: "High fever (>100.4°F), sudden breathlessness, severe pain, persistent vomiting, bleeding, or dizziness.",
    emergencyContact: "+91 7388660408 (24x7 Narayan Hospital Emergency)",
  };

  // 8. Handover
  const handover = {
    documents: "Discharge summary, lab reports, radiology films, and billing receipt handed over.",
    belongings: "All personal belongings returned to patient attendant.",
    devices: "Cannula and IV lines safely removed prior to ward release.",
    attendant: patient.guardian || "Patient Attendant",
  };

  return {
    documentType: admissionDetails.dischargeType,
    generatedAt: formatDt(new Date()),
    patient,
    admission: admissionDetails,
    clinical,
    vitals,
    billing,
    medicines,
    advice,
    handover,
  };
}
