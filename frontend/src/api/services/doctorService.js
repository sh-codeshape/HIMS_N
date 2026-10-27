import axiosInstance from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

const STORAGE_KEY = "hims_mock_doctors";
const SCHEDULES_STORAGE_PREFIX = "hims_mock_doctor_schedules_";

const DEFAULT_DOCTORS = [
  {
    id: "DOC-0001",
    practitioner_id: "DOC-0001",
    staff_code: "DOC-0001",
    name: "Dr. Rajesh Sharma",
    nameHindi: "डॉ. राजेश शर्मा",
    qualification: "MBBS, MS (General Surgery)",
    qualificationHindi: "एम.बी.बी.एस., एम.एस. (सर्जरी)",
    specialization: "General & Laparoscopic Surgery",
    specializationHindi: "सामान्य एवं लैप्रोस्कोपिक सर्जरी",
    specialty: "Advanced Laparoscopy & GI Surgery",
    experience: "14 Years",
    consultation_fee: 500,
    old_patient_fee: 300,
    emergency_fee: 800,
    gender: "male",
    displaySchedule: "Mon - Sat: 09:00 AM - 02:00 PM",
    maxNewPatients: 45,
    maxOldPatients: 30,
    registration_no: "MCI-48201",
    phone: "+91 98765 43210",
    email: "rajesh.sharma@hospital.com",
    address: "OPD Room 101, Ground Floor",
    avatar: "",
    is_active: true,
    role: "Senior Consultant",
  },
  {
    id: "DOC-0002",
    practitioner_id: "DOC-0002",
    staff_code: "DOC-0002",
    name: "Dr. Priya Deshmukh",
    nameHindi: "डॉ. प्रिया देशमुख",
    qualification: "MBBS, MD, DM (Cardiology)",
    qualificationHindi: "एम.बी.बी.एस., एम.डी., डी.एम. (कार्डियोलॉजी)",
    specialization: "Cardiology",
    specializationHindi: "हृदय रोग विभाग",
    specialty: "Interventional Cardiology & Angioplasty",
    experience: "11 Years",
    consultation_fee: 800,
    old_patient_fee: 500,
    emergency_fee: 1200,
    gender: "female",
    displaySchedule: "Mon - Fri: 10:00 AM - 04:00 PM",
    maxNewPatients: 35,
    maxOldPatients: 25,
    registration_no: "MCI-52918",
    phone: "+91 98234 56789",
    email: "priya.deshmukh@hospital.com",
    address: "OPD Room 102, 1st Floor",
    avatar: "",
    is_active: true,
    role: "Chief Cardiologist",
  },
  {
    id: "DOC-0003",
    practitioner_id: "DOC-0003",
    staff_code: "DOC-0003",
    name: "Dr. Anand Kulkarni",
    nameHindi: "डॉ. आनंद कुलकर्णी",
    qualification: "MBBS, MS (Orthopedics)",
    qualificationHindi: "एम.बी.बी.एस., एम.एस. (हड्डी रोग)",
    specialization: "Orthopedics",
    specializationHindi: "अस्थि एवं जोड़ रोग विभाग",
    specialty: "Joint Replacement & Arthroscopy",
    experience: "16 Years",
    consultation_fee: 600,
    old_patient_fee: 400,
    emergency_fee: 1000,
    gender: "male",
    displaySchedule: "Mon - Sat: 09:30 AM - 01:30 PM",
    maxNewPatients: 40,
    maxOldPatients: 30,
    registration_no: "MCI-39102",
    phone: "+91 97654 32109",
    email: "anand.kulkarni@hospital.com",
    address: "OPD Room 103, Ground Floor",
    avatar: "",
    is_active: true,
    role: "Senior Orthopedic Surgeon",
  },
  {
    id: "DOC-0004",
    practitioner_id: "DOC-0004",
    staff_code: "DOC-0004",
    name: "Dr. Meenakshi Iyer",
    nameHindi: "डॉ. मीनाक्षी अय्यर",
    qualification: "MBBS, MS (Obs & Gynae)",
    qualificationHindi: "एम.बी.बी.एस., एम.एस. (स्त्री एवं प्रसूति रोग)",
    specialization: "Gynecology & Obstetrics",
    specializationHindi: "प्रसूति एवं स्त्री रोग विभाग",
    specialty: "High-Risk Pregnancy & Infertility",
    experience: "12 Years",
    consultation_fee: 600,
    old_patient_fee: 400,
    emergency_fee: 900,
    gender: "female",
    displaySchedule: "Mon - Sat: 11:00 AM - 05:00 PM",
    maxNewPatients: 40,
    maxOldPatients: 30,
    registration_no: "MCI-44183",
    phone: "+91 98450 12345",
    email: "meenakshi.iyer@hospital.com",
    address: "OPD Room 104, 2nd Floor (Maternity Wing)",
    avatar: "",
    is_active: true,
    role: "Consultant Gynecologist",
  },
  {
    id: "DOC-0005",
    practitioner_id: "DOC-0005",
    staff_code: "DOC-0005",
    name: "Dr. Arvind Saxena",
    nameHindi: "डॉ. अरविंद सक्सेना",
    qualification: "MBBS, MD (Pediatrics)",
    qualificationHindi: "एम.बी.बी.एस., एम.डी. (शिशु एवं बाल रोग)",
    specialization: "Pediatrics & Neonatology",
    specializationHindi: "बाल एवं शिशु रोग विभाग",
    specialty: "Pediatric Critical Care & Immunization",
    experience: "9 Years",
    consultation_fee: 500,
    old_patient_fee: 300,
    emergency_fee: 800,
    gender: "male",
    displaySchedule: "Mon - Sat: 09:00 AM - 01:00 PM",
    maxNewPatients: 50,
    maxOldPatients: 35,
    registration_no: "MCI-58219",
    phone: "+91 99345 67812",
    email: "arvind.saxena@hospital.com",
    address: "OPD Room 105, 1st Floor",
    avatar: "",
    is_active: true,
    role: "Pediatrician",
  },
];

const DEFAULT_SCHEDULES_MAP = {
  "DOC-0001": [
    { id: "SCH-101", day_of_week: 1, start_time: "09:00", end_time: "14:00", slot_minutes: 15, consultation_mode: "both" },
    { id: "SCH-102", day_of_week: 2, start_time: "09:00", end_time: "14:00", slot_minutes: 15, consultation_mode: "both" },
    { id: "SCH-103", day_of_week: 3, start_time: "09:00", end_time: "14:00", slot_minutes: 15, consultation_mode: "both" },
    { id: "SCH-104", day_of_week: 4, start_time: "09:00", end_time: "14:00", slot_minutes: 15, consultation_mode: "both" },
    { id: "SCH-105", day_of_week: 5, start_time: "09:00", end_time: "14:00", slot_minutes: 15, consultation_mode: "both" },
    { id: "SCH-106", day_of_week: 6, start_time: "09:00", end_time: "13:00", slot_minutes: 15, consultation_mode: "in_person" },
  ],
  "DOC-0002": [
    { id: "SCH-201", day_of_week: 1, start_time: "10:00", end_time: "16:00", slot_minutes: 20, consultation_mode: "both" },
    { id: "SCH-202", day_of_week: 3, start_time: "10:00", end_time: "16:00", slot_minutes: 20, consultation_mode: "both" },
    { id: "SCH-203", day_of_week: 5, start_time: "10:00", end_time: "16:00", slot_minutes: 20, consultation_mode: "both" },
  ],
  "DOC-0003": [
    { id: "SCH-301", day_of_week: 1, start_time: "09:30", end_time: "13:30", slot_minutes: 15, consultation_mode: "in_person" },
    { id: "SCH-302", day_of_week: 2, start_time: "09:30", end_time: "13:30", slot_minutes: 15, consultation_mode: "in_person" },
    { id: "SCH-303", day_of_week: 4, start_time: "09:30", end_time: "13:30", slot_minutes: 15, consultation_mode: "in_person" },
    { id: "SCH-304", day_of_week: 5, start_time: "09:30", end_time: "13:30", slot_minutes: 15, consultation_mode: "in_person" },
    { id: "SCH-305", day_of_week: 6, start_time: "09:30", end_time: "13:00", slot_minutes: 15, consultation_mode: "in_person" },
  ],
};

export const normalizeDoctorRecord = (doc) => {
  if (!doc) return null;
  const id = doc.id || doc.practitioner_id || doc.staff_id;
  const fullName = doc.name || [doc.first_name, doc.last_name].filter(Boolean).join(" ");
  
  return {
    id: id,
    practitioner_id: doc.practitioner_id || id,
    staff_id: doc.staff_id || id,
    staff_code: doc.staff_code || id,
    name: fullName.startsWith("Dr.") ? fullName : `Dr. ${fullName}`.trim(),
    first_name: doc.first_name || (fullName || "").replace(/^Dr\.?\s*/i, "").split(" ")[0] || "",
    last_name: doc.last_name || (fullName || "").replace(/^Dr\.?\s*/i, "").split(" ").slice(1).join(" ") || "",
    nameHindi: doc.nameHindi || doc.name_hindi || "",
    qualification: doc.qualification || doc.qualifications || "MBBS",
    qualificationHindi: doc.qualificationHindi || doc.qualification_hindi || "",
    specialization: doc.specialization || doc.department || "General Medicine",
    specializationHindi: doc.specializationHindi || doc.specialization_hindi || "",
    specialty: doc.specialty || "",
    experience: doc.experience || (doc.experience_years ? `${doc.experience_years} Years` : "5 Years"),
    consultation_fee: Number(doc.consultation_fee ?? 500),
    old_patient_fee: Number(doc.old_patient_fee ?? 300),
    emergency_fee: Number(doc.emergency_fee ?? 800),
    gender: (doc.gender || "male").toLowerCase(),
    displaySchedule: doc.displaySchedule || doc.display_schedule || doc.timing || "Mon - Sat: 09:00 AM - 02:00 PM",
    maxNewPatients: Number(doc.maxNewPatients || doc.max_new_patients || 40),
    maxOldPatients: Number(doc.maxOldPatients || doc.max_old_patients || 30),
    registration_no: doc.registration_no || "",
    phone: doc.phone || "",
    email: doc.email || "",
    address: doc.address || doc.opdRoom || "",
    avatar: doc.avatar || "",
    is_active: doc.is_active !== undefined ? Boolean(doc.is_active) : (doc.status !== "Inactive"),
    role: doc.role || doc.designation || "Doctor",
  };
};

function getLocalDoctors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DOCTORS));
      return DEFAULT_DOCTORS.map(normalizeDoctorRecord);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(normalizeDoctorRecord);
    }
    return DEFAULT_DOCTORS.map(normalizeDoctorRecord);
  } catch (err) {
    console.warn("Error reading local doctors store:", err);
    return DEFAULT_DOCTORS.map(normalizeDoctorRecord);
  }
}

function saveLocalDoctors(doctors) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors));
  } catch (err) {
    console.warn("Failed to persist doctors in localStorage:", err);
  }
}

function getLocalSchedules(practitionerId) {
  try {
    const key = `${SCHEDULES_STORAGE_PREFIX}${practitionerId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      const defaults = DEFAULT_SCHEDULES_MAP[practitionerId] || [
        { id: `SCH-${Date.now().toString().slice(-4)}`, day_of_week: 1, start_time: "09:00", end_time: "17:00", slot_minutes: 15, consultation_mode: "both" }
      ];
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveLocalSchedules(practitionerId, schedules) {
  try {
    const key = `${SCHEDULES_STORAGE_PREFIX}${practitionerId}`;
    localStorage.setItem(key, JSON.stringify(schedules));
  } catch (err) {
    console.warn("Failed to persist doctor schedules:", err);
  }
}

const doctorService = {
  /**
   * Fetch all doctors
   */
  getDoctors: async (params = {}) => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.PRACTITIONERS.BASE, {
        params,
        skipErrorToast: true,
      });
      const list = res.data?.data ?? res.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        const normalized = list.map(normalizeDoctorRecord);
        saveLocalDoctors(normalized);
        return normalized;
      }
      return getLocalDoctors();
    } catch {
      return getLocalDoctors();
    }
  },

  /**
   * Create new doctor
   */
  createDoctor: async (data) => {
    const normalizedData = {
      ...data,
      name: data.name?.trim(),
      nameHindi: data.nameHindi?.trim() || "",
      qualification: data.qualification || "MBBS",
      qualificationHindi: data.qualificationHindi || "",
      specialization: data.specialization || "General Medicine",
      specializationHindi: data.specializationHindi || "",
      specialty: data.specialty || "",
      experience: data.experience || "5 Years",
      consultation_fee: Number(data.consultation_fee || 500),
      old_patient_fee: Number(data.old_patient_fee || 300),
      emergency_fee: Number(data.emergency_fee || 800),
      gender: data.gender || "male",
      displaySchedule: data.displaySchedule || "Mon - Sat: 09:00 AM - 02:00 PM",
      maxNewPatients: Number(data.maxNewPatients || 40),
      maxOldPatients: Number(data.maxOldPatients || 30),
      registration_no: data.registration_no || "",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      avatar: data.avatar || "",
      role: data.role || "Consultant",
    };

    try {
      const res = await axiosInstance.post(ENDPOINTS.PRACTITIONERS.BASE, normalizedData);
      const created = normalizeDoctorRecord(res.data?.data ?? res.data);
      const current = getLocalDoctors();
      saveLocalDoctors([created, ...current]);
      return created;
    } catch (err) {
      console.warn("Backend unavailable, adding doctor to local mock store:", err);
      const localList = getLocalDoctors();
      const code = `DOC-${String(localList.length + 1).padStart(4, "0")}`;
      const newDoc = normalizeDoctorRecord({
        ...normalizedData,
        id: code,
        practitioner_id: code,
        staff_code: code,
        is_active: true,
      });
      saveLocalDoctors([newDoc, ...localList]);
      return newDoc;
    }
  },

  /**
   * Update doctor
   */
  updateDoctor: async (id, data) => {
    try {
      const res = await axiosInstance.put(`${ENDPOINTS.PRACTITIONERS.BASE}/${id}`, data);
      const updated = normalizeDoctorRecord(res.data?.data ?? res.data ?? { ...data, id });
      const current = getLocalDoctors();
      const newDocs = current.map((d) => (d.id === id || d.practitioner_id === id ? { ...d, ...updated } : d));
      saveLocalDoctors(newDocs);
      return updated;
    } catch (err) {
      console.warn("Backend unavailable, updating doctor in local store:", err);
      const current = getLocalDoctors();
      let updatedDoc = null;
      const newDocs = current.map((d) => {
        if (d.id === id || d.practitioner_id === id) {
          updatedDoc = normalizeDoctorRecord({ ...d, ...data });
          return updatedDoc;
        }
        return d;
      });
      saveLocalDoctors(newDocs);
      return updatedDoc || normalizeDoctorRecord({ ...data, id });
    }
  },

  /**
   * Toggle doctor active/available status
   */
  toggleActive: async (id) => {
    try {
      const res = await axiosInstance.patch(`${ENDPOINTS.PRACTITIONERS.BASE}/${id}/toggle`);
      const backendResult = res.data?.data ?? res.data;
      const current = getLocalDoctors();
      let updatedDoc = null;
      const newDocs = current.map((d) => {
        if (d.id === id || d.practitioner_id === id) {
          const newStatus = backendResult?.is_active !== undefined ? Boolean(backendResult.is_active) : !d.is_active;
          updatedDoc = { ...d, is_active: newStatus };
          return updatedDoc;
        }
        return d;
      });
      saveLocalDoctors(newDocs);
      return updatedDoc;
    } catch (err) {
      console.warn("Backend unavailable, toggling doctor in local store:", err);
      const current = getLocalDoctors();
      let updatedDoc = null;
      const newDocs = current.map((d) => {
        if (d.id === id || d.practitioner_id === id) {
          updatedDoc = { ...d, is_active: !d.is_active };
          return updatedDoc;
        }
        return d;
      });
      saveLocalDoctors(newDocs);
      return updatedDoc;
    }
  },

  /**
   * Soft-delete doctor
   */
  deleteDoctor: async (id) => {
    try {
      await axiosInstance.delete(`${ENDPOINTS.PRACTITIONERS.BASE}/${id}`);
      const current = getLocalDoctors();
      const filtered = current.filter((d) => d.id !== id && d.practitioner_id !== id);
      saveLocalDoctors(filtered);
      return true;
    } catch (err) {
      console.warn("Backend unavailable, deleting doctor from local store:", err);
      const current = getLocalDoctors();
      const filtered = current.filter((d) => d.id !== id && d.practitioner_id !== id);
      saveLocalDoctors(filtered);
      return true;
    }
  },

  /**
   * Get schedules for a doctor
   */
  getSchedules: async (practitionerId) => {
    try {
      const res = await axiosInstance.get(
        `${ENDPOINTS.PRACTITIONERS.BASE}/${practitionerId}/schedules`,
        { skipErrorToast: true }
      );
      const list = res.data?.data ?? res.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        saveLocalSchedules(practitionerId, list);
        return list;
      }
      return getLocalSchedules(practitionerId);
    } catch {
      return getLocalSchedules(practitionerId);
    }
  },

  /**
   * Create schedule slot
   */
  createSchedule: async (practitionerId, data) => {
    try {
      const res = await axiosInstance.post(
        `${ENDPOINTS.PRACTITIONERS.BASE}/${practitionerId}/schedules`,
        data
      );
      const created = res.data?.data ?? res.data;
      const list = getLocalSchedules(practitionerId);
      saveLocalSchedules(practitionerId, [...list, created]);
      return created;
    } catch (err) {
      console.warn("Backend unavailable, creating schedule slot in local store:", err);
      const list = getLocalSchedules(practitionerId);
      const created = {
        id: `SCH-${Date.now().toString().slice(-5)}`,
        practitioner_id: practitionerId,
        is_active: true,
        ...data,
      };
      saveLocalSchedules(practitionerId, [...list, created]);
      return created;
    }
  },

  /**
   * Update schedule slot
   */
  updateSchedule: async (practitionerId, scheduleId, data) => {
    try {
      const res = await axiosInstance.put(
        `${ENDPOINTS.PRACTITIONERS.BASE}/${practitionerId}/schedules/${scheduleId}`,
        data
      );
      const updated = res.data?.data ?? res.data ?? { ...data, id: scheduleId };
      const list = getLocalSchedules(practitionerId);
      const updatedList = list.map((s) => (s.id === scheduleId ? { ...s, ...updated } : s));
      saveLocalSchedules(practitionerId, updatedList);
      return updated;
    } catch (err) {
      console.warn("Backend unavailable, updating schedule in local store:", err);
      const list = getLocalSchedules(practitionerId);
      const updatedList = list.map((s) => (s.id === scheduleId ? { ...s, ...data } : s));
      saveLocalSchedules(practitionerId, updatedList);
      return { id: scheduleId, ...data };
    }
  },

  /**
   * Delete schedule slot
   */
  deleteSchedule: async (practitionerId, scheduleId) => {
    try {
      await axiosInstance.delete(
        `${ENDPOINTS.PRACTITIONERS.BASE}/${practitionerId}/schedules/${scheduleId}`
      );
      const list = getLocalSchedules(practitionerId);
      const filtered = list.filter((s) => s.id !== scheduleId);
      saveLocalSchedules(practitionerId, filtered);
      return true;
    } catch (err) {
      console.warn("Backend unavailable, deleting schedule from local store:", err);
      const list = getLocalSchedules(practitionerId);
      const filtered = list.filter((s) => s.id !== scheduleId);
      saveLocalSchedules(practitionerId, filtered);
      return true;
    }
  },
};

export default doctorService;
