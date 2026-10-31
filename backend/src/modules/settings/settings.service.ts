import { db } from '../../config/database';
import { config } from '../../config';
import { logger } from '../../config/logger';

export const DEFAULT_ORG_ID = 'd6f81fd8-e196-4d3b-aa75-a69cfa8d8001';

export const DEFAULT_OPD_SLIP_SETTINGS = {
  hospital: {
    name: 'Narayan Hospital',
    subtitle: 'Super Speciality Healthcare & Research Institute',
    slogan: 'Better Care. Healthier Tomorrow.',
    registrationNo: 'REG/UP/2024/098',
    address: 'Jansa, Varanasi, Uttar Pradesh, 221405',
    phone: '+91 7388660408',
    logo: {
      src: '/images/Narayan_Logo.png',
      height: '48px',
      maxWidth: '160px',
      show: true,
    },
  },
  page: {
    size: 'A4',
    orientation: 'portrait',
    margin: 8,
  },
  styling: {
    primaryColor: '#0B3B60',
    secondaryColor: '#E0F2FE',
    accentColor: '#0284C7',
    slipBorderColor: '#93C5FD',
    textColor: '#0F172A',
    borderRadius: '12px',
    shape: 'rounded', // 'sharp' (0px) | 'subtle' (6px) | 'rounded' (12px) | 'pill' (20px)
    fontSizeScale: 'normal', // 'compact' | 'normal' | 'spacious'
    showWaveDecorations: true,
    paperSize: 'A4',
  },
  header: {
    showLogo: true,
    showTagline: true,
    showTimestamp: false,
    badgeTitle: 'OPD Consultation Slip',
    tokenLabel: 'OPD Token',
  },
  patientDetails: {
    cardTitle: 'Patient Details',
    showName: true,
    showAgeGender: true,
    showPhone: true,
    showAddress: true,
    showBloodGroup: false,
    showEmergency: false,
  },
  visitDetails: {
    cardTitle: 'Visit & Clinical Details',
    showVisitType: true,
    showEncounterNo: true,
    showEncounterDate: true,
    showSource: true,
    showStatus: true,
    showDoctor: true,
    showDepartment: true,
  },
  particulars: {
    showTable: true,
    headerIndex: '#',
    headerParticulars: 'Particulars',
    headerAmount: 'Amount (₹)',
    defaultItems: [
      { id: '1', particular: 'OPD Consultation Fee', amount: 500 },
      { id: '2', particular: 'Registration Fee', amount: 100 },
    ],
    totalLabel: 'Total Amount',
  },
  footer: {
    infoBullets: [
      'Please carry this slip for consultation.',
      'For any assistance, contact reception.',
    ],
    helpline: {
      show: true,
      label: 'Helpline:',
      number: '+91 7388660408',
    },
    stamp: {
      show: true,
      label: 'HOSPITAL STAMP',
    },
    signature: {
      show: false,
      label: 'Authorized Signatory',
    },
  },
};

export const DEFAULT_IPD_SLIP_SETTINGS = {
  hospital: {
    name: 'Narayan Hospital',
    subtitle: 'Super Speciality Healthcare & Research Institute',
    slogan: 'Better Care. Healthier Tomorrow.',
    registrationNo: 'REG/UP/2024/098',
    address: 'Jansa, Varanasi, Uttar Pradesh, 221405',
    phone: '+91 7388660408',
    logo: {
      src: '/images/Narayan_Logo.png',
      height: '48px',
      maxWidth: '160px',
      show: true,
    },
  },
  styling: {
    primaryColor: '#1B5E20',
    secondaryColor: '#E8F5E9',
    accentColor: '#2E7D32',
    slipBorderColor: '#86EFAC',
    textColor: '#0F172A',
    borderRadius: '12px',
    shape: 'rounded',
    fontSizeScale: 'normal',
    showWaveDecorations: true,
  },
  header: {
    showLogo: true,
    showTagline: true,
    showTimestamp: true,
    badgeTitle: 'IPD Admission Ticket',
    tokenLabel: 'IPD Adm / Bed',
  },
  patientDetails: {
    cardTitle: 'Patient Demographic Details',
    showName: true,
    showAgeGender: true,
    showPhone: true,
    showAddress: true,
    showBloodGroup: true,
    showEmergency: true,
  },
  visitDetails: {
    cardTitle: 'Admission & Ward Details',
    showVisitType: true,
    showEncounterNo: true,
    showEncounterDate: true,
    showDoctor: true,
    showDepartment: true,
    showWardBed: true,
    showStatus: true,
  },
  particulars: {
    showTable: true,
    headerIndex: '#',
    headerParticulars: 'Charges / Advance Particulars',
    headerAmount: 'Amount (₹)',
    defaultItems: [
      { id: '1', particular: 'IPD Admission Fee', amount: 1000 },
      { id: '2', particular: 'Initial Advance Deposit', amount: 5000 },
    ],
    totalLabel: 'Total Deposit Paid',
  },
  footer: {
    infoBullets: [
      'Please keep this admission slip safe until final discharge.',
      'Only 1 attendant allowed in patient room/ward during rounds.',
    ],
    helpline: {
      show: true,
      label: 'Emergency Desk:',
      number: '+91 7388660408',
    },
    stamp: {
      show: true,
      label: 'ADMISSION DESK STAMP',
    },
    signature: {
      show: true,
      label: 'Duty Nursing Officer / Attendant',
    },
  },
};

const field = (label: string, show: boolean = true) => ({ label, show });

export const DEFAULT_IPD_DISCHARGE_SETTINGS = {
  hospital: {
    name: 'Narayan Hospital',
    subtitle: 'Super Speciality Healthcare & Research Institute',
    registrationNo: 'REG/UP/2024/098',
    address: 'Jansa, Varanasi, Uttar Pradesh, 221405',
    phone: '+91 7388660408',
    email: 'info@narayanhospital.com',
    logoUrl: '/images/Narayan_Logo.png',
  },
  page: {
    size: 'A4',
    orientation: 'portrait',
    margin: 9,
    showPageNumber: true,
    showGeneratedAt: true,
  },
  style: {
    primary: '#173b63',
    accent: '#087fbd',
    text: '#17263b',
    muted: '#64748b',
    border: '#d7e1ec',
    sectionBackground: '#f3f7fb',
    fontFamily: 'Arial, sans-serif',
    fontSize: 10,
    compact: false,
  },
  header: {
    title: 'DISCHARGE SUMMARY',
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
    title: 'PATIENT DETAILS',
    fields: {
      uhid: field('UHID No.'),
      name: field('Patient Name'),
      ageGender: field('Age / Gender'),
      mobile: field('Mobile No.'),
      address: field('Address'),
      bloodGroup: field('Blood Group'),
      allergies: field('Known Allergies / Allergy Status'),
      guardian: field('Guardian / Attendant'),
      relation: field('Relation'),
    },
  },
  admission: {
    enabled: true,
    title: 'ADMISSION & DISCHARGE DETAILS',
    fields: {
      ipdNumber: field('IPD Admission No.'),
      admissionDate: field('Date & Time of Admission'),
      dischargeDate: field('Date & Time of Discharge'),
      stay: field('Length of Stay'),
      wardBed: field('Ward / Bed'),
      department: field('Department'),
      consultant: field('Treating Consultant'),
      referredBy: field('Referred By', false),
      dischargeType: field('Discharge Type'),
      dischargeCondition: field('Condition at Discharge'),
      destination: field('Discharged To', false),
    },
  },
  diagnosis: {
    enabled: true,
    title: 'CLINICAL SUMMARY',
    fields: {
      chiefComplaints: field('Chief Complaints'),
      history: field('Relevant History'),
      examination: field('Examination on Admission', false),
      primaryDiagnosis: field('Final / Primary Diagnosis'),
      secondaryDiagnosis: field('Other Diagnoses / Comorbidities', false),
      investigations: field('Important Investigations'),
      procedures: field('Procedures / Operations', false),
      treatmentGiven: field('Treatment During Admission'),
      hospitalCourse: field('Brief Hospital Course'),
    },
  },
  vitals: {
    enabled: true,
    title: 'VITALS AT DISCHARGE',
    leaveBlankForPen: true,
    fields: {
      bp: field('Blood Pressure'),
      pulse: field('Pulse'),
      temperature: field('Temperature'),
      spo2: field('SpO₂'),
      respiratoryRate: field('Respiratory Rate', false),
      weight: field('Weight', false),
      bloodSugar: field('Blood Sugar', false),
      consciousness: field('Consciousness / Orientation', false),
      mobility: field('Mobility', false),
    },
  },
  billing: {
    enabled: true,
    title: 'BILLING SUMMARY & PAYMENT CLEARANCE',
    showNoDuesCertificate: true,
    showDepartmentBreakdown: false,
    fields: {
      totalCharges: field('Total IPD Charges'),
      discount: field('Discount / Waiver', false),
      amountPaid: field('Amount Paid'),
      balance: field('Balance Outstanding'),
      paymentMode: field('Payment Mode', false),
      receiptNo: field('Receipt / Transaction No.', false),
      clearanceStatus: field('Financial Clearance Status'),
      verifiedBy: field('Clearance Verified By', false),
    },
  },
  medicines: {
    enabled: true,
    title: 'DISCHARGE MEDICATIONS & DOSAGE REGIMEN',
    note: 'Take medicines exactly as directed by the treating physician.',
    showEmptyState: false,
    columns: [
      { key: 'sr', label: '#', show: true, width: 4 },
      { key: 'medicine', label: 'Medicine Name & Formulation', show: true, width: 27 },
      { key: 'dose', label: 'Dose', show: true, width: 14 },
      { key: 'route', label: 'Route', show: false, width: 10 },
      { key: 'frequency', label: 'Frequency & Timing', show: true, width: 22 },
      { key: 'duration', label: 'Duration', show: true, width: 12 },
      { key: 'instructions', label: 'Instructions', show: true, width: 19 },
    ],
  },
  advice: {
    enabled: true,
    title: 'DISCHARGE ADVICE & FOLLOW-UP',
    fields: {
      followUpDate: field('Follow-up Date & Time'),
      followUpDepartment: field('Follow-up Department / Clinic', false),
      diet: field('Diet Advice'),
      activity: field('Activity / Rest Advice'),
      woundCare: field('Wound / Dressing Care', false),
      pendingReports: field('Pending Reports / Results', false),
      referral: field('Referral / Further Care', false),
      warningSigns: field('When to Seek Emergency Care'),
      emergencyContact: field('Emergency Contact'),
    },
  },
  handover: {
    enabled: false,
    title: 'PATIENT HANDOVER & DOCUMENTS',
    fields: {
      documents: field('Documents / Reports Handed Over'),
      belongings: field('Patient Belongings Returned', false),
      devices: field('Devices / Implants / Lines', false),
      attendant: field('Instructions Explained to Attendant', false),
    },
  },
  signatures: {
    enabled: true,
    showPatient: true,
    showNurse: true,
    showResident: false,
    showConsultant: true,
    showStamp: true,
    patientLabel: 'Patient / Attendant Signature',
    nurseLabel: 'Discharging Nurse',
    residentLabel: 'Resident Medical Officer',
    consultantLabel: 'Treating Consultant',
  },
  footer: {
    enabled: true,
    showHospitalName: true,
    showAddress: true,
    showPhone: true,
    showDisclaimer: true,
    disclaimer:
      "This discharge summary is part of the patient's medical record. Please retain it and bring it to every follow-up visit.",
    closingText: 'We wish you a smooth and speedy recovery.',
  },
  customSections: [] as any[],
};

const DEFAULT_SETTINGS_MAP: Record<string, any> = {
  print_slip_opd: DEFAULT_OPD_SLIP_SETTINGS,
  print_slip_ipd: DEFAULT_IPD_SLIP_SETTINGS,
  print_slip_ipd_discharge: DEFAULT_IPD_DISCHARGE_SETTINGS,
};

function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object') return target;
  const output = { ...target };

  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val !== undefined && val !== null) {
      if (
        typeof val === 'object' &&
        !Array.isArray(val) &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        output[key] = deepMerge(target[key], val);
      } else {
        output[key] = val;
      }
    }
  }

  return output;
}

export class SettingsService {
  /**
   * Fetch setting by key for the specified organization.
   * Merges database value over default structure.
   */
  static async getSetting(key: string, organizationId?: string, facilityId?: string) {
    const orgId = organizationId || DEFAULT_ORG_ID;
    const defaultVal = DEFAULT_SETTINGS_MAP[key] || {};

    try {
      let queryStr = `
        SELECT value FROM settings
        WHERE key = $1
          AND organization_id = $2
      `;
      const params: any[] = [key, orgId];

      if (facilityId) {
        queryStr += ` AND (facility_id = $3 OR facility_id IS NULL) ORDER BY facility_id DESC NULLS LAST LIMIT 1`;
        params.push(facilityId);
      } else {
        queryStr += ` AND facility_id IS NULL LIMIT 1`;
      }

      const result = await db.query(queryStr, params);

      if (result.rows.length > 0 && result.rows[0].value) {
        return deepMerge(defaultVal, result.rows[0].value);
      }

      // If not in DB, return standard default config
      return defaultVal;
    } catch (err: any) {
      logger.error({ err, key, orgId }, 'Error retrieving setting from DB');
      return defaultVal;
    }
  }

  /**
   * Insert or update setting by key.
   */
  static async upsertSetting(
    key: string,
    value: any,
    organizationId?: string,
    facilityId?: string | null,
    userId?: string | null
  ) {
    const orgId = organizationId || DEFAULT_ORG_ID;
    const facId = facilityId || null;

    const queryStr = `
      INSERT INTO settings (organization_id, facility_id, key, value, created_by, updated_by)
      VALUES ($1, $2, $3, $4::jsonb, $5, $5)
      ON CONFLICT (organization_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid), key)
      DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = now(),
        updated_by = EXCLUDED.updated_by
      RETURNING *;
    `;

    const res = await db.query(queryStr, [
      orgId,
      facId,
      key,
      JSON.stringify(value),
      userId || null,
    ]);

    return res.rows[0];
  }

  /**
   * Upload logo to Cloudinary if credentials are configured.
   */
  static async uploadLogo(dataUriOrBase64: string) {
    const { cloudName, apiKey, apiSecret } = config.cloudinary;

    if (!cloudName || !apiKey || !apiSecret) {
      return {
        configured: false,
        message: 'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured in backend .env',
        url: null,
      };
    }

    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const crypto = await import('crypto');
      const signatureStr = `folder=hims/branding&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

      const formData = new URLSearchParams();
      formData.append('file', dataUriOrBase64);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('folder', 'hims/branding');
      formData.append('signature', signature);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const json = await response.json() as any;

      if (!response.ok) {
        throw new Error(json.error?.message || 'Cloudinary upload failed');
      }

      return {
        configured: true,
        url: json.secure_url || json.url,
      };
    } catch (err: any) {
      logger.error({ err }, 'Failed to upload logo to Cloudinary');
      throw err;
    }
  }
}
