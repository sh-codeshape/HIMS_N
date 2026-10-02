import axiosInstance from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

const patientService = {
  getAll: async (params = {}) => {
    const res = await axiosInstance.get(ENDPOINTS.PATIENTS.BASE, { params });
    return res.data?.data ?? res.data ?? [];
  },
  getById: async (id) => {
    const res = await axiosInstance.get(`${ENDPOINTS.PATIENTS.BASE}/${id}`);
    return res.data?.data ?? res.data;
  },
  create: async (data) => {
    const res = await axiosInstance.post(ENDPOINTS.PATIENTS.BASE, data);
    return res.data?.data ?? res.data;
  },
  update: async (id, data) => {
    const res = await axiosInstance.patch(`${ENDPOINTS.PATIENTS.BASE}/${id}`, data);
    return res.data?.data ?? res.data;
  },
  remove: async (id) => {
    const res = await axiosInstance.delete(`${ENDPOINTS.PATIENTS.BASE}/${id}`);
    return res.data?.data ?? res.data;
  },
  search: async (params = {}) => {
    const res = await axiosInstance.get(ENDPOINTS.PATIENTS.DIRECTORY, { params });
    return res.data?.data ?? res.data ?? [];
  },
};

export default patientService;
