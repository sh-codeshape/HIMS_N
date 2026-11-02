import axiosInstance from "../axiosInstance";
import createCrudService from "./createCrudService";
import { ENDPOINTS } from "../endpoints";

const billingService = {
  ...createCrudService(ENDPOINTS.BILLING.OPD),
  createInvoice: async (payload) => {
    // Backend exposes invoice creation at POST /api/v1/billing (not /billing/invoices)
    const res = await axiosInstance.post("/billing", payload);
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
  postBedCharges: async (payload) => {
    const res = await axiosInstance.post("/billing/charges/bed", payload);
    return res.data?.data ?? res.data ?? null;
  },
  removeCharge: async (id, payload) => {
    const res = await axiosInstance.delete(`/billing/charges/${id}`, { data: payload });
    return res.data?.data ?? res.data ?? null;
  },
  updateChargeDiscount: async (id, payload) => {
    const res = await axiosInstance.patch(`/billing/charges/${id}/discount`, payload);
    return res.data?.data ?? res.data ?? null;
  },
  applyConcessionBatch: async (payload) => {
    const res = await axiosInstance.post(`/billing/charges/apply-concession`, payload);
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
  },
  settleBill: async (payload) => {
    const res = await axiosInstance.post("/billing/settle", payload);
    return res.data?.data ?? res.data ?? null;
  },
  processRefund: async (payload) => {
    const res = await axiosInstance.post("/billing/refund", payload);
    return res.data?.data ?? res.data ?? null;
  },
  creditWallet: async (payload) => {
    const res = await axiosInstance.post("/billing/wallet/credit", payload);
    return res.data?.data ?? res.data ?? null;
  },
  settleWithWallet: async (payload) => {
    const res = await axiosInstance.post("/billing/wallet/settle", payload);
    return res.data?.data ?? res.data ?? null;
  },

  // Billing Master Data: Discount reasons and Referral doctors
  getDiscountReasons: async () => {
    try {
      const res = await axiosInstance.get("/billing/discount-reasons");
      return res.data?.data ?? res.data ?? [];
    } catch (err) {
      console.warn("Failed to load discount reasons:", err?.message);
      return [];
    }
  },
  getReferrals: async () => {
    try {
      const res = await axiosInstance.get("/billing/referrals");
      return res.data?.data ?? res.data ?? { doctors: [], referral_sources: [] };
    } catch (err) {
      console.warn("Failed to load referrals:", err?.message);
      return { doctors: [], referral_sources: [] };
    }
  },

  // Billing Reports methods
  getReportsSummary: async (params = {}) => {
    try {
      const res = await axiosInstance.get("/billing/reports/summary", { params });
      return res.data?.data ?? res.data ?? null;
    } catch (err) {
      console.warn("API /billing/reports/summary error:", err?.message);
      return null;
    }
  },

  getPendingDues: async (params = {}) => {
    try {
      const res = await axiosInstance.get("/billing/reports/pending-dues", { params });
      return res.data?.data ?? res.data ?? { invoices: [], pagination: { total: 0 } };
    } catch (err) {
      console.warn("API /billing/reports/pending-dues error:", err?.message);
      return { invoices: [], pagination: { total: 0 } };
    }
  },

  getCollections: async (params = {}) => {
    try {
      const res = await axiosInstance.get("/billing/reports/collections", { params });
      return res.data?.data ?? res.data ?? { byPaymentMode: [], ledger: [] };
    } catch (err) {
      console.warn("API /billing/reports/collections error:", err?.message);
      return { byPaymentMode: [], ledger: [] };
    }
  },

  getPatientDues: async (patientId) => {
    const res = await axiosInstance.get(`/billing/patient/${patientId}/dues`);
    return res.data?.data ?? res.data ?? null;
  }
};
export default billingService;
