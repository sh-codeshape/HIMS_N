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
  };
};

const patientService = {
  getAll: async (params = {}) => {
    const res = await axiosInstance.get(ENDPOINTS.PATIENTS.BASE, { params });
    const records = res.data?.data ?? res.data ?? [];
    return Array.isArray(records)
      ? records.map(normalizePatientRecord)
      : normalizePatientRecord(records);
  },
  getById: async (id) => {
    const res = await axiosInstance.get(`${ENDPOINTS.PATIENTS.BASE}/${id}`);
    return normalizePatientRecord(res.data?.data ?? res.data);
  },
  create: async (data) => {
    const res = await axiosInstance.post(ENDPOINTS.PATIENTS.BASE, data);
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
    const res = await axiosInstance.get(ENDPOINTS.PATIENTS.BASE, {
      params,
    });
    const records = res.data?.data ?? res.data ?? [];
    return Array.isArray(records)
      ? records.map(normalizePatientRecord)
      : normalizePatientRecord(records);
  },
  getFamilyMembers: async (id) => {
    const res = await axiosInstance.get(`${ENDPOINTS.PATIENTS.BASE}/${id}/family`);
    const records = res.data?.data ?? res.data ?? [];
    return Array.isArray(records)
      ? records.map(normalizePatientRecord)
      : normalizePatientRecord(records);
  },
};

export default patientService;
