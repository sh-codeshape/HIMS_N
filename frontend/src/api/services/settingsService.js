import axiosInstance from "../axiosInstance";

const settingsService = {
  // Outsource Laboratories
  getOutsourceLabs: async (params = {}) => {
    try {
      const res = await axiosInstance.get("/laboratory/outsource-labs", { params });
      return res.data?.data || res.data || [];
    } catch (err) {
      console.warn("API /laboratory/outsource-labs error:", err?.message);
      return [];
    }
  },

  createOutsourceLab: async (payload) => {
    const res = await axiosInstance.post("/laboratory/outsource-labs", payload);
    return res.data?.data || res.data;
  },

  updateOutsourceLab: async (id, payload) => {
    const res = await axiosInstance.put(`/laboratory/outsource-labs/${id}`, payload);
    return res.data?.data || res.data;
  },

  deleteOutsourceLab: async (id) => {
    const res = await axiosInstance.delete(`/laboratory/outsource-labs/${id}`);
    return res.data?.data || res.data;
  },

  // In-House Test Definitions Master
  getTestDefinitions: async (params = {}) => {
    try {
      const res = await axiosInstance.get("/laboratory/definitions", { params });
      return res.data?.data || res.data || [];
    } catch (err) {
      console.warn("API /laboratory/definitions error:", err?.message);
      return [];
    }
  },

  createTestDefinition: async (payload) => {
    const res = await axiosInstance.post("/laboratory/definitions", payload);
    return res.data?.data || res.data;
  },

  updateTestDefinition: async (id, payload) => {
    const res = await axiosInstance.put(`/laboratory/definitions/${id}`, payload);
    return res.data?.data || res.data;
  },

  deleteTestDefinition: async (id) => {
    const res = await axiosInstance.delete(`/laboratory/definitions/${id}`);
    return res.data?.data || res.data;
  },

  // Generic System Settings (e.g. print_slip_opd, print_slip_ipd)
  getSetting: async (key) => {
    try {
      const res = await axiosInstance.get(`/settings/${key}`);
      return res.data?.data || null;
    } catch (err) {
      console.warn(`API /settings/${key} error:`, err?.message);
      return null;
    }
  },

  updateSetting: async (key, value) => {
    const res = await axiosInstance.put(`/settings/${key}`, { value });
    return res.data?.data || res.data;
  },

  uploadLogo: async (image) => {
    const res = await axiosInstance.post(`/settings/upload-logo`, { image });
    return res.data?.data || res.data;
  },
};

export default settingsService;
