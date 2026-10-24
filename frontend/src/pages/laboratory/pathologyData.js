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

export const LAB_TECHNICIANS = [
  "Manoj Kumar (Senior Lab Technologist)",
  "Rajesh Maurya (Phlebotomist)",
  "Suman Devi (Lab Technician)",
  "Ankit Srivastava (Laboratory Officer)",
];

export const REFERRING_DOCTORS = [
  "Dr. Anil Singh (Cardiology)",
  "Dr. Priya Gupta (General Medicine)",
  "Dr. Ramesh Yadav (Orthopedics)",
  "Dr. Pooja Mishra (Gynecology)",
  "Dr. Amit Sharma (Internal Medicine)",
  "Dr. S. Mehta (MD Pathologist)",
];

// Clinical reference parameter ranges for hospital diagnostic investigations
export const SAMPLE_PARAM_DEFAULTS = {
  "Complete Blood Count (CBC)": [
    { name: "Hemoglobin", result: "14.2", unit: "g/dL", range: "13.0 - 17.0", status: "Normal" },
    { name: "RBC Count", result: "4.85", unit: "mil/cumm", range: "4.50 - 5.50", status: "Normal" },
    { name: "Total Leukocyte Count (TLC)", result: "7,800", unit: "/cumm", range: "4,000 - 11,000", status: "Normal" },
    { name: "Neutrophils", result: "62", unit: "%", range: "40 - 75", status: "Normal" },
    { name: "Lymphocytes", result: "30", unit: "%", range: "20 - 45", status: "Normal" },
    { name: "Eosinophils", result: "4", unit: "%", range: "1 - 6", status: "Normal" },
    { name: "Monocytes", result: "4", unit: "%", range: "2 - 10", status: "Normal" },
    { name: "Basophils", result: "0", unit: "%", range: "0 - 1", status: "Normal" },
    { name: "Platelet Count", result: "2.40", unit: "Lakhs/cumm", range: "1.50 - 4.50", status: "Normal" },
  ],
  "Liver Function Test (LFT)": [
    { name: "Serum Bilirubin Total", result: "0.9", unit: "mg/dL", range: "0.2 - 1.2", status: "Normal" },
    { name: "Serum Bilirubin Direct", result: "0.25", unit: "mg/dL", range: "0.0 - 0.3", status: "Normal" },
    { name: "SGOT (AST)", result: "28", unit: "U/L", range: "10 - 40", status: "Normal" },
    { name: "SGPT (ALT)", result: "32", unit: "U/L", range: "10 - 45", status: "Normal" },
    { name: "Alkaline Phosphatase (ALP)", result: "95", unit: "U/L", range: "44 - 147", status: "Normal" },
    { name: "Total Protein", result: "7.2", unit: "g/dL", range: "6.0 - 8.3", status: "Normal" },
    { name: "Serum Albumin", result: "4.1", unit: "g/dL", range: "3.5 - 5.0", status: "Normal" },
  ],
  "Kidney Function Test (KFT / RFT)": [
    { name: "Blood Urea", result: "24", unit: "mg/dL", range: "15 - 45", status: "Normal" },
    { name: "Serum Creatinine", result: "0.95", unit: "mg/dL", range: "0.6 - 1.2", status: "Normal" },
    { name: "Serum Uric Acid", result: "5.2", unit: "mg/dL", range: "3.5 - 7.2", status: "Normal" },
    { name: "Blood Urea Nitrogen (BUN)", result: "11.2", unit: "mg/dL", range: "7 - 20", status: "Normal" },
  ],
  "Thyroid Profile": [
    { name: "Total Triiodothyronine (T3)", result: "1.15", unit: "ng/mL", range: "0.8 - 2.0", status: "Normal" },
    { name: "Total Thyroxine (T4)", result: "8.4", unit: "µg/dL", range: "5.1 - 14.1", status: "Normal" },
    { name: "TSH (Ultrasensitive)", result: "2.45", unit: "µIU/mL", range: "0.35 - 5.50", status: "Normal" },
  ],
  "Lipid Profile": [
    { name: "Total Cholesterol", result: "185", unit: "mg/dL", range: "< 200", status: "Normal" },
    { name: "Triglycerides", result: "140", unit: "mg/dL", range: "< 150", status: "Normal" },
    { name: "HDL Cholesterol", result: "48", unit: "mg/dL", range: "> 40", status: "Normal" },
    { name: "LDL Cholesterol", result: "109", unit: "mg/dL", range: "< 100", status: "Normal" },
  ],
  "Fasting Blood Sugar (FBS)": [
    { name: "Glucose Fasting", result: "95", unit: "mg/dL", range: "70 - 100", status: "Normal" },
  ],
  "HbA1c (Glycated Hemoglobin)": [
    { name: "HbA1c", result: "5.6", unit: "%", range: "< 5.7 (Normal), 5.7 - 6.4 (Prediabetes)", status: "Normal" },
    { name: "Estimated Average Glucose (eAG)", result: "114", unit: "mg/dL", range: "90 - 120", status: "Normal" },
  ],
  "Urine Routine & Microscopy": [
    { name: "Color", result: "Pale Yellow", unit: "", range: "Pale Yellow", status: "Normal" },
    { name: "Appearance", result: "Clear", unit: "", range: "Clear", status: "Normal" },
    { name: "pH", result: "6.0", unit: "", range: "4.5 - 8.0", status: "Normal" },
    { name: "Specific Gravity", result: "1.020", unit: "", range: "1.005 - 1.030", status: "Normal" },
    { name: "Pus Cells", result: "1-2", unit: "/hpf", range: "0 - 5", status: "Normal" },
    { name: "RBCs", result: "Nil", unit: "/hpf", range: "0 - 2", status: "Normal" },
    { name: "Epithelial Cells", result: "Occasional", unit: "/hpf", range: "Occasional", status: "Normal" },
    { name: "Albumin", result: "Nil", unit: "", range: "Negative / Nil", status: "Normal" },
    { name: "Sugar", result: "Nil", unit: "", range: "Negative / Nil", status: "Normal" },
  ],
  "Dengue NS1 & IgM / IgG Combo": [
    { name: "Dengue NS1 Antigen", result: "Negative", unit: "", range: "Negative", status: "Normal" },
    { name: "Dengue IgM Antibodies", result: "Negative", unit: "", range: "Negative", status: "Normal" },
    { name: "Dengue IgG Antibodies", result: "Negative", unit: "", range: "Negative", status: "Normal" },
  ],
  "Serum Electrolytes (Na+, K+, Cl-)": [
    { name: "Sodium (Na+)", result: "140", unit: "mEq/L", range: "135 - 145", status: "Normal" },
    { name: "Potassium (K+)", result: "4.2", unit: "mEq/L", range: "3.5 - 5.0", status: "Normal" },
    { name: "Chloride (Cl-)", result: "101", unit: "mEq/L", range: "96 - 106", status: "Normal" },
  ],
};
