/**
 * printlslip.data.jsx
 *
 * Central configuration file for OPD and IPD print slips.
 * As a software solution provider, you can easily change hospital branding,
 * header information, logo, contacts, helpline numbers, counter notices,
 * and layout defaults here.
 *
 * This serves as the FRONTEND MOCK and FALLBACK whenever values are not
 * dynamically supplied from the database / API.
 */

export const DEFAULT_HOSPITAL_CONFIG = {
  // Hospital identity & branding
  hospital: {
    name: 'Narayan Hospital',
    subtitle: 'Super Speciality Healthcare & Research Institute',
    tagline: 'Super Speciality Healthcare & Research Institute',
    slogan: 'Better Care. Healthier Tomorrow.',
    registrationNo: 'REG/UP/2024/098',
    logo: {
      src: '/images/Narayan_Logo.png',
      alt: 'Narayan Hospital Logo',
      height: '48px',
      maxWidth: '160px',
      show: true,
    },
    address: 'Jansa, Varanasi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    pinCode: '221405',
    phone: '+91 7388660408',
  },

  // Document titles
  titles: {
    opd: 'OPD Consultation Slip',
    ipd: 'IPD Admission Ticket',
  },

  // Header options
  header: {
    showLogo: true,
    showTagline: true,
    showGenerationTime: false,
    timeFormat: 'en-IN',
  },

  // Footer & Contact information (WhatsApp chatbot, Helplines, website, etc.)
  contacts: {
    helplines: [
      {
        show: true,
        label: 'Helpline:',
        number: '+91 7388660408',
      },
    ],
  },

  // Counter notices and labels
  notices: {
    opd: {
      en: 'Please carry this slip for consultation.',
      hi: 'For any assistance, contact reception.',
    },
    ipd: {
      en: 'Please present this slip at the department IPD admission counter.',
      hi: 'कृपया इस पर्ची को संबंधित विभाग के आईपीडी काउंटर पर प्रस्तुत करें।',
    },
    signatureLabel: "Doctor's Signature / हस्ताक्षर",
    stampLabel: 'HOSPITAL STAMP',
  },

  // Theming & Colors (CSS colors used for borders, badges, backgrounds)
  theme: {
    opd: {
      primaryColor: '#0B3B60',
      secondaryColor: '#E0F2FE',
      accentColor: '#0284C7',
      slipBorder: '#93C5FD',
      titleColor: '#0B3B60',
      accentBg: '#E0F2FE',
      accentBorder: '#BAE6FD',
      accentText: '#0B3B60',
      counterType: 'OPD',
      hindiCounter: 'ओपीडी',
    },
    ipd: {
      primaryColor: '#1B5E20',
      secondaryColor: '#E8F5E9',
      accentColor: '#2E7D32',
      slipBorder: '#86EFAC',
      titleColor: '#1B5E20',
      accentBg: '#E8F5E9',
      accentBorder: '#C8E6C9',
      accentText: '#1B5E20',
      counterType: 'IPD admission',
      hindiCounter: 'आईपीडी',
    },
  },

  // Clinical & slip options
  clinical: {
    defaultFee: 500,
    defaultDoctorName: 'General Doctor',
    defaultSource: 'Offline',
    defaultUhid: 'KGN-PENDING',
    showPhysicalVitals: true,
    showGynaePanels: false,
    prescriptionLines: 4,
  },
}

/**
 * Deep merge utility for merging runtime/DB overrides into default configuration.
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
export function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target
  const output = { ...target }

  for (const key of Object.keys(source)) {
    const val = source[key]
    if (val !== undefined && val !== null) {
      if (
        typeof val === 'object' &&
        !Array.isArray(val) &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        output[key] = deepMerge(target[key], val)
      } else {
        output[key] = val
      }
    }
  }

  return output
}

/**
 * Resolves hospital configuration with a hierarchical fallback:
 * 1. Explicit customConfig passed to handler
 * 2. Hospital / facility fields inside the booking record (DB data)
 * 3. Default frontend mock configuration
 *
 * @param {Object} [booking={}] - The booking record that may contain DB hospital info
 * @param {Object} [customConfig={}] - Explicit overrides passed programmatically
 * @returns {Object} Merged and resolved configuration
 */
export function getHospitalConfig(booking = {}, customConfig = {}) {
  // Extract potential hospital fields from DB booking record
  const dbHospital = {}

  const hospitalName =
    booking?.hospital_name ||
    booking?.hospitalName ||
    booking?.facility_name ||
    booking?.facilityName ||
    booking?.hospital?.name ||
    booking?.facility?.name

  if (hospitalName) {
    dbHospital.hospital = {
      name: hospitalName,
    }
  }

  const logoSrc =
    booking?.hospital_logo ||
    booking?.hospitalLogo ||
    booking?.hospital_logo_url ||
    booking?.logo_url ||
    booking?.hospital?.logo ||
    booking?.facility?.logo

  if (logoSrc) {
    dbHospital.hospital = dbHospital.hospital || {}
    dbHospital.hospital.logo = {
      src: logoSrc,
      alt: `${hospitalName || 'Hospital'} Logo`,
    }
  }

  const helpline =
    booking?.hospital_helpline ||
    booking?.hospitalHelpline ||
    booking?.hospital_phone ||
    booking?.hospital?.helpline

  const whatsapp =
    booking?.hospital_whatsapp ||
    booking?.hospitalWhatsapp ||
    booking?.hospital?.whatsapp

  if (helpline || whatsapp) {
    dbHospital.contacts = {}
    if (whatsapp) {
      dbHospital.contacts.whatsapp = {
        number: whatsapp,
        display: whatsapp,
      }
    }
    if (helpline) {
      dbHospital.contacts.helplines = [
        { label: 'Helpline', number: helpline, show: true },
      ]
    }
  }

  // Merge: Default Mock -> DB Data -> Custom Config Override
  const intermediate = deepMerge(DEFAULT_HOSPITAL_CONFIG, dbHospital)
  return deepMerge(intermediate, customConfig)
}

export default DEFAULT_HOSPITAL_CONFIG
