import axiosInstance from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

const ipdService = {
  admitPatient: async (payload) => {
    const res = await axiosInstance.post("/ipd/admissions", payload);
    return res.data?.data ?? res.data ?? null;
  },
  getAdmissions: async (params = {}) => {
    const res = await axiosInstance.get("/ipd/admissions", { params });
    return res.data?.data ?? res.data ?? [];
  },
  getBedMatrix: async (params = {}) => {
    const res = await axiosInstance.get("/beds", { params });
    return res.data?.data ?? res.data ?? [];
  },
  getBedWards: async (params = {}) => {
    const res = await axiosInstance.get("/beds/wards", { params });
    return res.data?.data ?? res.data ?? [];
  },
  getBedRooms: async (params = {}) => {
    const res = await axiosInstance.get("/beds/rooms", { params });
    return res.data?.data ?? res.data ?? [];
  },
  dischargePatient: async (id, payload) => {
    const res = await axiosInstance.post(`/ipd/admissions/${id}/discharge`, payload);
    return res.data?.data ?? res.data ?? null;
  },
  getDischargeSummary: async (admissionId) => {
    const res = await axiosInstance.get(`/ipd/admissions/${admissionId}/discharge-summary`);
    return res.data?.data ?? res.data ?? null;
  },
  saveDischargeSummary: async (admissionId, payload) => {
    const res = await axiosInstance.post(`/ipd/admissions/${admissionId}/discharge-summary`, payload);
    return res.data?.data ?? res.data ?? null;
  },
  getReportStats: async () => {
    const res = await axiosInstance.get(`/ipd/reports/stats`);
    return res.data?.data ?? res.data ?? null;
  },

  getPendingDues: async (encounterId) => {
    const res = await axiosInstance.get(`/ipd/admissions/${encounterId}/pending-dues`);
    return res.data?.data ?? res.data ?? null;
  },
};

export default ipdService;
