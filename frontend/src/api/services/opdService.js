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
    const {
      from,
      to,
      page = 1,
      limit = 50,
      doctorId,
      departmentId,
      sortBy = "started_at",
      sortOrder = "DESC",
    } = params;
    const query = {
      from: from || undefined,
      to: to || undefined,
      page,
      limit,
      doctorId: doctorId || undefined,
      departmentId: departmentId || undefined,
      sortBy,
      sortOrder,
    };

    const res = await axiosInstance.get("/opd/reports", { params: query });
    const body = res.data ?? {};
    return { data: body.data ?? [], meta: body.meta ?? {} };
  },
};

export default opdService;
