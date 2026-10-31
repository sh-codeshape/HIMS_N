"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = exports.DEFAULT_IPD_SLIP_SETTINGS = exports.DEFAULT_OPD_SLIP_SETTINGS = exports.DEFAULT_ORG_ID = void 0;
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
exports.DEFAULT_IPD_SLIP_SETTINGS = {
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
const DEFAULT_SETTINGS_MAP = {
    print_slip_opd: exports.DEFAULT_OPD_SLIP_SETTINGS,
    print_slip_ipd: exports.DEFAULT_IPD_SLIP_SETTINGS,
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
