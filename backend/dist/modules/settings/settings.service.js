"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = exports.DEFAULT_IPD_BILLING_SETTINGS = exports.DEFAULT_IPD_DISCHARGE_SETTINGS = exports.DEFAULT_IPD_SLIP_SETTINGS = exports.DEFAULT_OPD_SLIP_SETTINGS = exports.DEFAULT_ORG_ID = void 0;
const database_1 = require("../../config/database");
const config_1 = require("../../config");
const logger_1 = require("../../config/logger");
exports.DEFAULT_ORG_ID = 'd6f81fd8-e196-4d3b-aa75-a69cfa8d8001';
exports.DEFAULT_OPD_SLIP_SETTINGS = {
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
const field = (label, show = true) => ({ label, show });
exports.DEFAULT_IPD_SLIP_SETTINGS = {
    hospital: {
        name: 'Narayan Hospital',
        subtitle: 'NABH & NABL ACCREDITED TERTIARY CARE HOSPITAL & RESEARCH INSTITUTE',
        slogan: 'Better Care. Healthier Tomorrow.',
        registrationNo: 'REG/UP/2024/098',
        address: 'Sector 4, Central Hospital Road, Jaipur - 302020 (Rajasthan)',
        phone: '+91 7388660408',
        emergencyPhone: '+91 9811223344',
        email: 'admissions@narayanhospital.com',
        website: 'www.narayanhospital.com',
        logoUrl: '/images/Narayan_Logo.png',
        logoHeight: 50,
        logoPosition: 'left',
        showLogo: true,
        accreditations: ['NABH ACCREDITED', 'ISO 9001:2015', 'NABL CERTIFIED LABS'],
        showAccreditationBadges: true,
    },
    header: {
        title: 'IPD ADMISSION TICKET',
        subTitle: 'Inpatient Encounter & Bed Allotment Slip',
        badgeTitle: 'IPD Admission Ticket',
        tokenLabel: 'IPD Adm / Bed',
        copyType: 'ORIGINAL FOR PATIENT',
        showCopyBadge: true,
        showLogo: true,
        showBarcode: true,
        showQRCode: true,
        showTopUHID: true,
        showTopAdmissionNo: true,
        showTimestamp: true,
    },
    patient: {
        enabled: true,
        title: 'PATIENT DEMOGRAPHICS',
        fields: {
            uhid: field('UHID No.'),
            name: field('Patient Name'),
            ageGender: field('Age / Gender'),
            mobile: field('Contact / Phone'),
            address: field('Address'),
            bloodGroup: field('Blood Group'),
            guardian: field('Guardian / Attendant'),
            relation: field('Relation'),
            payer: field('Payer / Category', false),
            policyNo: field('Policy / Card No.', false),
        },
    },
    admission: {
        enabled: true,
        title: 'CLINICAL ADMISSION & WARD RECORD',
        fields: {
            admissionType: field('Admission Type / Category'),
            admissionDate: field('Date & Time of Admission'),
            department: field('Admitting Department'),
            doctor: field('Treating Consultant / Doctor'),
            patientProblem: field('Patient Problem / Complaints'),
            duration: field('Duration of Problem / Stay'),
            provisionalDiagnosis: field('Provisional Diagnosis'),
            bedAllotted: field('Allotted Bed / Ward / Room'),
            referredBy: field('Referred By', false),
            mlcCase: field('Medico-Legal Case (MLC)', false),
        },
    },
    financial: {
        enabled: true,
        title: 'ADMISSION FEE & ADVANCE DEPOSIT',
        fields: {
            registrationFee: field('IPD Registration Fee'),
            advancePayment: field('Initial Advance Deposit'),
            paymentMode: field('Payment Mode'),
            receiptNo: field('Receipt / Txn No.'),
            amountInWords: field('Amount in Words'),
        },
    },
    terms: {
        enabled: true,
        title: 'INPATIENT ADMISSION TERMS & HOSPITAL RULES',
        items: [
            'Please keep this admission ticket safe until discharge reconciliation.',
            'Only one attendant pass is issued with this admission ticket for ward/room entry.',
            'Visiting hours are strictly 04:00 PM to 06:00 PM. Children under 12 are not permitted in ICU/wards.',
            'Hospital management is not responsible for any personal cash, jewelry, or valuables kept in patient rooms.',
            'Initial advance deposit will be adjusted in the final IPD billing invoice at discharge.',
        ],
        footerTagline: 'NARAYAN HOSPITAL • Sector 4, Hospital Road, Jaipur - 302020 • 24x7 Emergency: +91 9811223344',
        disclaimer: 'Wishing you a comfortable stay and a healthy, speedy recovery.',
    },
    signatures: {
        enabled: true,
        showDoctor: true,
        doctorTitle: 'Treating Consultant',
        doctorSub: 'Admitting Physician',
        showNurse: true,
        nurseTitle: 'Duty Nursing Officer',
        nurseSub: 'Ward Incharge',
        showAttendant: true,
        attendantTitle: 'Patient / Attendant Signature',
        attendantSub: 'Consent & Acknowledgment',
        showStamp: true,
        stampTitle: 'ADMISSION DESK STAMP',
    },
    elementStyles: {
        hospitalHeader: {
            offsetY: 0,
            offsetX: 0,
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '700',
            borderWidth: 1,
            borderRadius: 8,
            borderColor: '#cbd5e1',
            bgMode: 'gradient',
            bgColor: '#ffffff',
            bgGradientEnd: '#f8fafc',
            bgGradientAngle: 135,
            textColor: '#0f172a',
            show: true,
        },
        ticketHeader: {
            offsetY: 0,
            offsetX: 0,
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '700',
            borderWidth: 1,
            borderRadius: 8,
            borderColor: '#93c5fd',
            bgMode: 'gradient',
            bgColor: '#eff6ff',
            bgGradientEnd: '#dbeafe',
            bgGradientAngle: 90,
            textColor: '#1e3a8a',
            show: true,
        },
        patientCard: {
            offsetY: 0,
            offsetX: 0,
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            borderWidth: 1,
            borderRadius: 8,
            borderColor: '#e2e8f0',
            bgMode: 'solid',
            bgColor: '#ffffff',
            bgGradientEnd: '#f8fafc',
            bgGradientAngle: 135,
            textColor: '#1e293b',
            show: true,
        },
        admissionCard: {
            offsetY: 0,
            offsetX: 0,
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            borderWidth: 1,
            borderRadius: 8,
            borderColor: '#e2e8f0',
            bgMode: 'solid',
            bgColor: '#ffffff',
            bgGradientEnd: '#f8fafc',
            bgGradientAngle: 135,
            textColor: '#1e293b',
            show: true,
        },
        financialCard: {
            offsetY: 0,
            offsetX: 0,
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            borderWidth: 1.5,
            borderRadius: 8,
            borderColor: '#86efac',
            bgMode: 'gradient',
            bgColor: '#f0fdf4',
            bgGradientEnd: '#dcfce7',
            bgGradientAngle: 135,
            textColor: '#14532d',
            show: true,
        },
        termsCard: {
            offsetY: 0,
            offsetX: 0,
            fontSize: 9.5,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '500',
            borderWidth: 1,
            borderRadius: 6,
            borderColor: '#e2e8f0',
            bgMode: 'solid',
            bgColor: '#f8fafc',
            bgGradientEnd: '#f1f5f9',
            bgGradientAngle: 135,
            textColor: '#475569',
            show: true,
        },
        signaturesCard: {
            offsetY: 0,
            offsetX: 0,
            fontSize: 10,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            borderWidth: 0,
            borderRadius: 0,
            borderColor: 'transparent',
            bgMode: 'solid',
            bgColor: 'transparent',
            bgGradientEnd: '#ffffff',
            bgGradientAngle: 135,
            textColor: '#1e293b',
            show: true,
        },
    },
    // Legacy / fallback mappings
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
exports.DEFAULT_IPD_DISCHARGE_SETTINGS = {
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
        disclaimer: "This discharge summary is part of the patient's medical record. Please retain it and bring it to every follow-up visit.",
        closingText: 'We wish you a smooth and speedy recovery.',
    },
    customSections: [],
};
exports.DEFAULT_IPD_BILLING_SETTINGS = {
    hospital: {
        name: 'Narayan Hospital',
        subtitle: 'NABH & NABL ACCREDITED TERTIARY CARE HOSPITAL & RESEARCH INSTITUTE',
        registrationNo: 'REG/UP/2024/098',
        address: 'Sector 4, Central Hospital Road, Jaipur - 302020 (Rajasthan)',
        phone: '+91 7388660408 / +91 9811223344',
        email: 'billing@narayanhospital.com',
        website: 'www.narayanhospital.com',
        logoUrl: '/images/Narayan_Logo.png',
        logoHeight: 52,
        logoPosition: 'left',
        letterheadMode: 'full',
        stationeryTopMargin: 45,
        accreditations: ['NABH ACCREDITED', 'NABL CERTIFIED LABS', 'ISO 9001:2015'],
        showAccreditationBadges: true,
    },
    header: {
        title: 'INPATIENT ADMISSION & FINAL TAX INVOICE',
        subTitle: 'Tax Invoice Issued Under Section 31 of CGST Act 2017 & Hospital Regulatory Bylaws',
        badgeLabel: 'TAX INVOICE & ADM SLIP',
        copyType: 'ORIGINAL FOR RECIPIENT',
        showCopyBadge: true,
        showLogo: true,
        showBarcode: true,
        showQRCode: true,
        showTaxBox: true,
        showTopUHID: true,
        showTopAdmissionNo: true,
    },
    gst: {
        enabled: true,
        mode: 'exempt',
        taxRate: 0,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        isInterState: false,
        showTaxTable: true,
        roomRentGstEnabled: true,
        hospitalGstin: '08AAACN1234F1Z8',
        hospitalPan: 'AAACN1234F',
        stateName: 'Rajasthan',
        stateCode: '08',
        cin: 'U85110RJ2024PTC123456',
        defaultSacCode: '999311 (Inpatient Healthcare)',
        reverseCharge: 'No',
        placeOfSupply: '08 - Rajasthan',
        exemptionNotification: 'Healthcare services are exempted from GST vide Notification No. 12/2017-Central Tax (Rate) Serial No. 74.',
    },
    page: {
        size: 'A4',
        orientation: 'portrait',
        margin: 8,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: 10,
        compact: false,
        showPageNumber: true,
        showGeneratedAt: true,
        showWatermark: false,
        watermarkText: 'TAX INVOICE',
        watermarkOpacity: 0.05,
        roundOffToRupee: true,
    },
    style: {
        theme: 'navy',
        primary: '#0f2e5a',
        accent: '#0284c7',
        text: '#17263b',
        muted: '#64748b',
        border: '#cbd5e1',
        headerBg: '#f1f5f9',
        zebraStriping: true,
    },
    patient: {
        enabled: true,
        title: 'PATIENT DEMOGRAPHICS',
        fields: {
            name: field('Patient Name'),
            uhid: field('Patient UHID'),
            ageGender: field('Age / Gender'),
            mobile: field('Contact / Phone'),
            address: field('Patient Address'),
            bloodGroup: field('Blood Group'),
            guardian: field('Guardian / Attendant'),
            relation: field('Relation'),
            payer: field('Payer / TPA Sponsor', false),
            corporate: field('Corporate / Employer', false),
            policyNo: field('Policy / Card No.', false),
            claimNo: field('Claim / Pre-Auth No.', false),
            patientGstin: field('Patient / Corporate GSTIN', false),
        },
    },
    admission: {
        enabled: true,
        title: 'INPATIENT ADMISSION & VISIT RECORD',
        fields: {
            invoiceNo: field('Invoice / Bill No.'),
            invoiceDate: field('Invoice Date'),
            admissionNo: field('IPD Admission No.'),
            admissionDate: field('Date & Time of Admission'),
            dischargeDate: field('Date of Discharge / Status'),
            stay: field('Length of Stay (LOS)'),
            wardBed: field('Ward / Bed No.'),
            consultant: field('Attending Consultant'),
            consultantQual: field('Doctor Qualification', false),
            department: field('Specialty / Department'),
            referredBy: field('Referred By'),
            diagnosis: field('Primary Clinical Diagnosis'),
            dischargeCondition: field('Condition at Discharge', false),
        },
    },
    charges: {
        enabled: true,
        title: 'ITEMIZED INPATIENT CHARGES & SERVICE BREAKDOWN',
        groupByDepartment: true,
        showDepartmentTotals: true,
        showDepartmentSummary: true,
        showDiscountsBreakdown: true,
        showHsnSac: true,
        showUnitRate: true,
        columns: {
            sr: { label: '#', show: true, width: '4%' },
            date: { label: 'DATE', show: true, width: '11%' },
            department: { label: 'DEPARTMENT', show: false, width: '15%' },
            code: { label: 'HSN / SAC', show: true, width: '10%' },
            description: { label: 'PARTICULARS / SERVICE / MEDICINE DESCRIPTION', show: true, width: '40%' },
            qty: { label: 'QTY', show: true, width: '6%' },
            rate: { label: 'RATE (₹)', show: true, width: '11%' },
            discount: { label: 'DISC (₹)', show: true, width: '9%' },
            amount: { label: 'NET (₹)', show: true, width: '13%' },
        },
    },
    settlement: {
        enabled: true,
        title: 'SETTLEMENT RECONCILIATION & TOTALS',
        showAmountInWords: true,
        showPaymentBreakdown: true,
        showPaymentReceiptsTable: true,
        showGSTBreakupCard: true,
        showRoundOff: true,
        showOfficialStamp: true,
        stampStyle: 'circular',
        stampTextPaid: '✓ PAID & SETTLED IN FULL',
        stampTextDue: '⚠ BALANCE PAYABLE',
        stampTextExcess: '★ EXCESS ADVANCE CREDIT',
    },
    bankDetails: {
        show: true,
        title: 'HOSPITAL BANK & UPI REMITTANCE DETAILS',
        bankName: 'State Bank of India',
        accountName: 'Narayan Multispeciality Hospital Pvt Ltd',
        accountNo: '3988220019234',
        ifsc: 'SBIN0001234',
        branch: 'Central Hospital Road, Jaipur',
        upiId: 'narayan.hospital@sbi',
        showUpiQr: true,
    },
    signatures: {
        enabled: true,
        showCashier: true,
        cashierTitle: 'Billing Cashier',
        cashierSub: 'Narayan HIMS Counter',
        showAccounts: true,
        accountsTitle: 'Accounts Officer',
        accountsSub: 'Audit & Reconciliation',
        showDoctor: false,
        doctorTitle: 'Treating Consultant',
        doctorSub: 'Department Incharge',
        showPatient: true,
        patientTitle: 'Patient / Attendant Signature',
        patientSub: 'Received Bills, Drugs & Reports',
        showSuperintendent: true,
        superintendentTitle: 'Medical Superintendent',
        superintendentSub: 'Authorized Signatory',
        patientDeclaration: 'I hereby confirm that I have received all inpatient services, drugs, consumables, and original investigation reports as billed. All queries and charges have been clearly explained and verified.',
    },
    terms: {
        enabled: true,
        title: 'TERMS & CONDITIONS',
        items: [
            'This is an authenticated computer-generated Inpatient Tax Invoice issued in compliance with GST Act and Hospital Bylaws.',
            'Medicines, surgical consumables, and implants billed strictly as per approved Hospital Formulary / NPPA capped rates.',
            'In case of any billing clarifications or dispute, kindly present this slip at Inpatient Accounts Desk within 7 working days.',
            'Healthcare services provided by clinical establishments to inpatients are exempt from GST under Notification No. 12/2017-CT(Rate) Sl. 74.',
            'Cheques are subject to realization. Online payments via UPI / NEFT should be referenced with the IPD Admission Number.',
        ],
        footerTagline: 'NARAYAN HOSPITAL • Sector 4, Hospital Road, Jaipur - 302020 • 24x7 Emergency: +91 9811223344',
        disclaimer: 'Thank you for choosing Narayan Hospital. Wishing you a healthy and speedy recovery.',
    },
};
const DEFAULT_SETTINGS_MAP = {
    print_slip_opd: exports.DEFAULT_OPD_SLIP_SETTINGS,
    print_slip_ipd: exports.DEFAULT_IPD_SLIP_SETTINGS,
    print_slip_ipd_admission: exports.DEFAULT_IPD_SLIP_SETTINGS,
    print_slip_ipd_discharge: exports.DEFAULT_IPD_DISCHARGE_SETTINGS,
    print_slip_ipd_bill: exports.DEFAULT_IPD_BILLING_SETTINGS,
};
function deepMerge(target, source) {
    if (!source || typeof source !== 'object')
        return target;
    const output = { ...target };
    for (const key of Object.keys(source)) {
        const val = source[key];
        if (val !== undefined && val !== null) {
            if (typeof val === 'object' &&
                !Array.isArray(val) &&
                typeof target[key] === 'object' &&
                !Array.isArray(target[key])) {
                output[key] = deepMerge(target[key], val);
            }
            else {
                output[key] = val;
            }
        }
    }
    return output;
}
class SettingsService {
    /**
     * Fetch setting by key for the specified organization.
     * Merges database value over default structure.
     */
    static async getSetting(key, organizationId, facilityId) {
        const orgId = organizationId || exports.DEFAULT_ORG_ID;
        const defaultVal = DEFAULT_SETTINGS_MAP[key] || {};
        try {
            let queryStr = `
        SELECT value FROM settings
        WHERE key = $1
          AND organization_id = $2
      `;
            const params = [key, orgId];
            if (facilityId) {
                queryStr += ` AND (facility_id = $3 OR facility_id IS NULL) ORDER BY facility_id DESC NULLS LAST LIMIT 1`;
                params.push(facilityId);
            }
            else {
                queryStr += ` AND facility_id IS NULL LIMIT 1`;
            }
            const result = await database_1.db.query(queryStr, params);
            if (result.rows.length > 0 && result.rows[0].value) {
                return deepMerge(defaultVal, result.rows[0].value);
            }
            // If not in DB, return standard default config
            return defaultVal;
        }
        catch (err) {
            logger_1.logger.error({ err, key, orgId }, 'Error retrieving setting from DB');
            return defaultVal;
        }
    }
    /**
     * Insert or update setting by key.
     */
    static async upsertSetting(key, value, organizationId, facilityId, userId) {
        const orgId = organizationId || exports.DEFAULT_ORG_ID;
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
        const res = await database_1.db.query(queryStr, [
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
    static async uploadLogo(dataUriOrBase64) {
        const { cloudName, apiKey, apiSecret } = config_1.config.cloudinary;
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
            const json = await response.json();
            if (!response.ok) {
                throw new Error(json.error?.message || 'Cloudinary upload failed');
            }
            return {
                configured: true,
                url: json.secure_url || json.url,
            };
        }
        catch (err) {
            logger_1.logger.error({ err }, 'Failed to upload logo to Cloudinary');
            throw err;
        }
    }
}
exports.SettingsService = SettingsService;
