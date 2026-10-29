/**
 * Clinical Pathology Investigation Definitions & Biological Reference Ranges
 * Narayan Hospital HIMS - Department of Pathology
 */

export const PATHOLOGY_CATEGORIES = [
  "Hematology",
  "Biochemistry",
  "Serology",
  "Hormones",
  "Microbiology",
  "Clinical Pathology",
  "Histopathology",
];

export const LAB_TECHNICIANS = [];

export const REFERRING_DOCTORS = [];

// Clinical reference parameter ranges for hospital diagnostic investigations
// Test results start empty so real values are entered per patient
export const SAMPLE_PARAM_DEFAULTS = {
  "Complete Blood Count (CBC)": [
    { name: "Hemoglobin", result: "", unit: "g/dL", range: "13.0 - 17.0", status: "" },
    { name: "RBC Count", result: "", unit: "mil/cumm", range: "4.50 - 5.50", status: "" },
    { name: "Total Leukocyte Count (TLC)", result: "", unit: "/cumm", range: "4,000 - 11,000", status: "" },
    { name: "Neutrophils", result: "", unit: "%", range: "40 - 75", status: "" },
    { name: "Lymphocytes", result: "", unit: "%", range: "20 - 45", status: "" },
    { name: "Eosinophils", result: "", unit: "%", range: "1 - 6", status: "" },
    { name: "Monocytes", result: "", unit: "%", range: "2 - 10", status: "" },
    { name: "Basophils", result: "", unit: "%", range: "0 - 1", status: "" },
    { name: "Platelet Count", result: "", unit: "Lakhs/cumm", range: "1.50 - 4.50", status: "" },
  ],
  "Liver Function Test (LFT)": [
    { name: "Serum Bilirubin Total", result: "", unit: "mg/dL", range: "0.2 - 1.2", status: "" },
    { name: "Serum Bilirubin Direct", result: "", unit: "mg/dL", range: "0.0 - 0.3", status: "" },
    { name: "SGOT (AST)", result: "", unit: "U/L", range: "10 - 40", status: "" },
    { name: "SGPT (ALT)", result: "", unit: "U/L", range: "10 - 45", status: "" },
    { name: "Alkaline Phosphatase (ALP)", result: "", unit: "U/L", range: "44 - 147", status: "" },
    { name: "Total Protein", result: "", unit: "g/dL", range: "6.0 - 8.3", status: "" },
    { name: "Serum Albumin", result: "", unit: "g/dL", range: "3.5 - 5.0", status: "" },
  ],
  "Kidney Function Test (KFT / RFT)": [
    { name: "Blood Urea", result: "", unit: "mg/dL", range: "15 - 45", status: "" },
    { name: "Serum Creatinine", result: "", unit: "mg/dL", range: "0.6 - 1.2", status: "" },
    { name: "Serum Uric Acid", result: "", unit: "mg/dL", range: "3.5 - 7.2", status: "" },
    { name: "Blood Urea Nitrogen (BUN)", result: "", unit: "mg/dL", range: "7 - 20", status: "" },
  ],
  "Thyroid Profile": [
    { name: "Total Triiodothyronine (T3)", result: "", unit: "ng/mL", range: "0.8 - 2.0", status: "" },
    { name: "Total Thyroxine (T4)", result: "", unit: "µg/dL", range: "5.1 - 14.1", status: "" },
    { name: "TSH (Ultrasensitive)", result: "", unit: "µIU/mL", range: "0.35 - 5.50", status: "" },
  ],
  "Lipid Profile": [
    { name: "Total Cholesterol", result: "", unit: "mg/dL", range: "< 200", status: "" },
    { name: "Triglycerides", result: "", unit: "mg/dL", range: "< 150", status: "" },
    { name: "HDL Cholesterol", result: "", unit: "mg/dL", range: "> 40", status: "" },
    { name: "LDL Cholesterol", result: "", unit: "mg/dL", range: "< 100", status: "" },
  ],
  "Fasting Blood Sugar (FBS)": [
    { name: "Glucose Fasting", result: "", unit: "mg/dL", range: "70 - 100", status: "" },
  ],
  "HbA1c (Glycated Hemoglobin)": [
    { name: "HbA1c", result: "", unit: "%", range: "< 5.7 (Normal), 5.7 - 6.4 (Prediabetes)", status: "" },
    { name: "Estimated Average Glucose (eAG)", result: "", unit: "mg/dL", range: "90 - 120", status: "" },
  ],
  "Urine Routine & Microscopy": [
    { name: "Color", result: "", unit: "", range: "Pale Yellow", status: "" },
    { name: "Appearance", result: "", unit: "", range: "Clear", status: "" },
    { name: "pH", result: "", unit: "", range: "4.5 - 8.0", status: "" },
    { name: "Specific Gravity", result: "", unit: "", range: "1.005 - 1.030", status: "" },
    { name: "Pus Cells", result: "", unit: "/hpf", range: "0 - 5", status: "" },
    { name: "RBCs", result: "", unit: "/hpf", range: "0 - 2", status: "" },
    { name: "Epithelial Cells", result: "", unit: "/hpf", range: "Occasional", status: "" },
    { name: "Albumin", result: "", unit: "", range: "Negative / Nil", status: "" },
    { name: "Sugar", result: "", unit: "", range: "Negative / Nil", status: "" },
  ],
  "Dengue NS1 & IgM / IgG Combo": [
    { name: "Dengue NS1 Antigen", result: "", unit: "", range: "Negative", status: "" },
    { name: "Dengue IgM Antibodies", result: "", unit: "", range: "Negative", status: "" },
    { name: "Dengue IgG Antibodies", result: "", unit: "", range: "Negative", status: "" },
  ],
  "Serum Electrolytes (Na+, K+, Cl-)": [
    { name: "Sodium (Na+)", result: "", unit: "mEq/L", range: "135 - 145", status: "" },
    { name: "Potassium (K+)", result: "", unit: "mEq/L", range: "3.5 - 5.0", status: "" },
    { name: "Chloride (Cl-)", result: "", unit: "mEq/L", range: "96 - 106", status: "" },
  ],
};
