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
  dischargePatient: async (id, payload) => {
    const res = await axiosInstance.post(`/ipd/admissions/${id}/discharge`, payload);
    return res.data?.data ?? res.data ?? null;
  }
};

export default ipdService;
