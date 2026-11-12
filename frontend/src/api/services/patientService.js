import axiosInstance from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

const normalizePatientRecord = (patient) => {
  if (!patient) return patient;

  const dob = patient.date_of_birth || patient.dob;
  const calculatedAge =
    patient.age ??
    (dob
      ? Math.floor(
          (Date.now() - new Date(dob).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25),
        )
      : null);
  const fullName =
    patient.full_name ||
    [patient.first_name, patient.middle_name, patient.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

  const customFields =
    typeof patient.custom_fields === "string"
      ? JSON.parse(patient.custom_fields || "{}")
      : patient.custom_fields || {};

  let primaryAddress = {};
  if (Array.isArray(patient.addresses) && patient.addresses.length > 0) {
    primaryAddress =
      patient.addresses.find((a) => a.is_primary) || patient.addresses[0];
  }

  return {
    ...patient,
    full_name: fullName || patient.name || "",
    first_name: patient.first_name || (fullName || "").split(" ")[0] || "",
    last_name:
      patient.last_name ||
      (fullName || "").split(" ").slice(1).join(" ") ||
      null,
    age: calculatedAge,
    blood_group: patient.blood_group || patient.bloodGroup || null,
    category: customFields.visit_type || patient.category || "OPD",
    status: customFields.status || patient.status || "Waiting",
    department: customFields.department || patient.department || "",
    paymentMode: customFields.payment_type || patient.paymentMode || "",
    doctor: customFields.doctor || customFields.referred_by || patient.doctor || "",
    custom_fields: customFields,
    address: primaryAddress.line1 || patient.address || "",
    city: primaryAddress.city || patient.city || "",
    state: primaryAddress.state || patient.state || "",
    pincode: primaryAddress.postal_code || patient.pincode || patient.pin || "",
    country: primaryAddress.country || patient.country || "India",
    aadhaar_number: patient.aadhaar_number || customFields.aadhaar_number || customFields.aadhaar || customFields.idNo || "",
    aadhaar: patient.aadhaar || patient.aadhaar_number || customFields.aadhaar || customFields.aadhaar_number || customFields.idNo || "",
    pan_number: patient.pan_number || customFields.pan_number || customFields.pan || "",
    pan: patient.pan || patient.pan_number || customFields.pan || customFields.pan_number || "",
    emergency_name: patient.emergency_name || customFields.emergency_name || customFields.guardian_name || "",
    emergency_phone: patient.emergency_phone || customFields.emergency_phone || customFields.emergency_contact || "",
    emergency_relation: patient.emergency_relation || customFields.emergency_relation || "",
    health_insurance: customFields.health_insurance || patient.health_insurance || "",
    insurance_provider: customFields.insurance_provider || patient.insurance_provider || "",
    insurance_number: customFields.insurance_number || patient.insurance_number || "",
  };
};

const patientService = {
  getAll: async (params = {}) => {
    const queryParams = { page: 1, limit: 500, ...params };
    const res = await axiosInstance.get(ENDPOINTS.PATIENTS.BASE, {
      params: queryParams,
    });
    const records = res.data?.data ?? res.data ?? [];
    return Array.isArray(records)
      ? records.map(normalizePatientRecord)
      : normalizePatientRecord(records);
  },
  getById: async (id) => {
    const res = await axiosInstance.get(`${ENDPOINTS.PATIENTS.BASE}/${id}`);
    return normalizePatientRecord(res.data?.data ?? res.data);
  },
  create: async (data, config = {}) => {
    const res = await axiosInstance.post(ENDPOINTS.PATIENTS.BASE, data, config);
    return normalizePatientRecord(res.data?.data ?? res.data);
  },
  update: async (id, data) => {
    const res = await axiosInstance.patch(
      `${ENDPOINTS.PATIENTS.BASE}/${id}`,
      data,
    );
    return normalizePatientRecord(res.data?.data ?? res.data);
  },
  remove: async (id) => {
    const res = await axiosInstance.delete(`${ENDPOINTS.PATIENTS.BASE}/${id}`);
    return normalizePatientRecord(res.data?.data ?? res.data);
  },
  search: async (params = {}) => {
    const queryParams = { page: 1, limit: 500, ...params };
    const res = await axiosInstance.get(ENDPOINTS.PATIENTS.BASE, {
      params: queryParams,
    });
    const records = res.data?.data ?? res.data ?? [];
    return Array.isArray(records)
      ? records.map(normalizePatientRecord)
      : normalizePatientRecord(records);
  },
  getFamilyMembers: async (id) => {
    const res = await axiosInstance.get(
      `${ENDPOINTS.PATIENTS.BASE}/${id}/family`,
    );
    const records = res.data?.data ?? res.data ?? [];
    return Array.isArray(records)
      ? records.map(normalizePatientRecord)
      : normalizePatientRecord(records);
  },
};

export default patientService;
