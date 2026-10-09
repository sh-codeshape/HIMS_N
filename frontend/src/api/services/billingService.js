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
  
  // IPD Running Bill methods
  addCharge: async (payload) => {
    const res = await axiosInstance.post("/billing/charges", payload);
    return res.data?.data ?? res.data ?? null;
  },
  removeCharge: async (id, payload) => {
    const res = await axiosInstance.delete(`/billing/charges/${id}`, { data: payload });
    return res.data?.data ?? res.data ?? null;
  },
  getRunningBill: async (encounterId, params = {}) => {
    const res = await axiosInstance.get(`/billing/running-bill/${encounterId}`, { params });
    return res.data?.data ?? res.data ?? [];
  },
  recordAdvancePayment: async (payload) => {
    const res = await axiosInstance.post("/billing/payments/advance", payload);
    return res.data?.data ?? res.data ?? null;
  },
  getEncounterPayments: async (encounterId, params = {}) => {
    const res = await axiosInstance.get(`/billing/payments/encounter/${encounterId}`, { params });
    return res.data?.data ?? res.data ?? [];
  }
};
export default billingService;
