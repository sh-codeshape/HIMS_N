import axiosInstance from "../axiosInstance";
import createCrudService from "./createCrudService";
import { ENDPOINTS } from "../endpoints";

const billingService = {
  ...createCrudService(ENDPOINTS.BILLING.OPD),
  createInvoice: async (payload) => {
    const res = await axiosInstance.post("/billing/invoices", payload);
    return res.data?.data ?? res.data ?? null;
  },
  getInvoices: async (params = {}) => {
    const res = await axiosInstance.get("/billing/invoices", { params });
    return res.data?.data ?? res.data ?? [];
  },
};
