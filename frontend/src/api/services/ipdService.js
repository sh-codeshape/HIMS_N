import axiosInstance from "../axiosInstance";
import createCrudService from "./createCrudService";
import { ENDPOINTS } from "../endpoints";

const ipdService = {
  ...createCrudService(ENDPOINTS.IPD.ADMISSION),
  admitPatient: async (payload) => {
    const res = await axiosInstance.post("/ipd/admissions", payload);
    return res.data?.data ?? res.data ?? null;
  },
  getAdmissions: async (params = {}) => {
    const res = await axiosInstance.get("/ipd/admissions", { params });
    return res.data?.data ?? res.data ?? [];
  },
};

export default ipdService;
