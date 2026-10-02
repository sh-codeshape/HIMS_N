import axiosInstance from "../axiosInstance";
import createCrudService from "./createCrudService";
import { ENDPOINTS } from "../endpoints";

const opdService = {
  ...createCrudService(ENDPOINTS.OPD.REGISTRATION),
  issueToken: async (payload) => {
    const res = await axiosInstance.post("/opd/tokens", payload);
    return res.data?.data ?? res.data ?? null;
  },
  getQueue: async (params = {}) => {
    const res = await axiosInstance.get("/opd/queue", { params });
    return res.data?.data ?? res.data ?? [];
  },
  updateStatus: async (id, status, payload = {}) => {
    const res = await axiosInstance.patch(`/opd/tokens/${id}/status`, {
      status,
      ...payload,
    });
    return res.data?.data ?? res.data ?? null;
  },
};

export default opdService;
