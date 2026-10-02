import axiosInstance from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

const opdService = {
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
  getReports: async (params = {}) => {
    const res = await axiosInstance.get("/opd/reports", { params });
    return res.data?.data ?? res.data ?? [];
  },
};

export default opdService;
