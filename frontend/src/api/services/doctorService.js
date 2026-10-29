import axiosInstance from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

const STORAGE_KEY = "hims_mock_doctors";
const SCHEDULES_STORAGE_PREFIX = "hims_mock_doctor_schedules_";




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
    qualification: doc.qualification || doc.qualifications || "",
    qualificationHindi: doc.qualificationHindi || doc.qualification_hindi || "",
    specialization: doc.specialization || doc.department || "",
    specializationHindi: doc.specializationHindi || doc.specialization_hindi || "",
    specialty: doc.specialty || "",
    experience: doc.experience || (doc.experience_years ? `${doc.experience_years} Years` : ""),
    consultation_fee: Number(doc.consultation_fee ?? 0),
    old_patient_fee: Number(doc.old_patient_fee ?? 0),
    emergency_fee: Number(doc.emergency_fee ?? 0),
    gender: (doc.gender || "").toLowerCase(),
    displaySchedule: doc.displaySchedule || doc.display_schedule || doc.timing || "",
    maxNewPatients: Number(doc.maxNewPatients || doc.max_new_patients || 0),
    maxOldPatients: Number(doc.maxOldPatients || doc.max_old_patients || 0),
    registration_no: doc.registration_no || "",
    phone: doc.phone || "",
    email: doc.email || "",
    address: doc.address || doc.opdRoom || "",
    avatar: doc.avatar || "",
    is_active: doc.is_active !== undefined ? Boolean(doc.is_active) : (doc.status !== "Inactive"),
    role: doc.role || doc.designation || "",
  };
};

function getLocalDoctors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [].map(normalizeDoctorRecord);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(normalizeDoctorRecord);
    }
    return [].map(normalizeDoctorRecord);
  } catch (err) {
    console.warn("Error reading local doctors store:", err);
    return [].map(normalizeDoctorRecord);
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
      const defaults = [];
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
   * Fetch all doctors (alias)
   */
  getAll: async (params = {}) => {
    return doctorService.getDoctors(params);
  },

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

  /**
   * Get all departments from backend DB or derived from doctors
   */
  getDepartments: async () => {
    try {
      const res = await axiosInstance.get("/staff/departments", { skipErrorToast: true });
      const list = res.data?.data ?? res.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    } catch {
      // Backend unavailable or error, fall through
    }

    // Fallback: derive departments from doctors + standard clinical list
    const doctors = await doctorService.getDoctors();
    const deptNames = Array.from(
      new Set(
        doctors
          .map((d) => d.specialization || d.department)
          .filter(Boolean)
      )
    );
    if (deptNames.length === 0) {
      deptNames.push("General Medicine", "Cardiology", "Orthopedics", "Pediatrics", "Gynecology & Obstetrics");
    }
    return deptNames.map((name, idx) => ({
      id: `dept-${idx + 1}`,
      name,
      code: name.replace(/[^A-Za-z0-9]/g, "").substring(0, 4).toUpperCase() || `D${idx + 1}`,
      department_type: "clinical",
      is_active: true,
    }));
  },

  /**
   * Filter doctors by department name or ID
   */
  getDoctorsByDepartment: async (deptIdentifier) => {
    const all = await doctorService.getDoctors();
    if (!deptIdentifier) return all;
    const clean = String(deptIdentifier).toLowerCase().trim();
    return all.filter((d) => {
      const matchId = String(d.department_id || d.departmentId || "").toLowerCase() === clean;
      const matchSpec = String(d.specialization || "").toLowerCase() === clean;
      const matchDept = String(d.department || "").toLowerCase() === clean;
      return matchId || matchSpec || matchDept;
    });
  },
};

export default doctorService;
