import axiosInstance from "../axiosInstance";

const laboratoryService = {
  // Get lab orders / tests
  getLabTests: async (params = {}) => {
    try {
      const res = await axiosInstance.get("/laboratory/tests", { params });
      return res.data?.data || res.data || [];
    } catch (err) {
      console.warn("API /laboratory/tests call:", err?.message);
      return [];
    }
  },

  // Get test definitions (catalog)
  getTestDefinitions: async (params = {}) => {
    try {
      const res = await axiosInstance.get("/laboratory/definitions", { params });
      return res.data?.data || res.data || [];
    } catch (err) {
      console.warn("API /laboratory/definitions call:", err?.message);
      return [];
    }
  },

  // Get single order details
  getOrderDetails: async (orderId) => {
    const res = await axiosInstance.get(`/laboratory/orders/${orderId}`);
    return res.data?.data || res.data;
  },

  // Get test parameters for an order item
  getOrderItemParameters: async (orderItemId) => {
    const res = await axiosInstance.get(`/laboratory/tests/${orderItemId}/parameters`);
    return res.data?.data || res.data;
  },

  // Create new lab order
  createLabOrder: async (payload) => {
    const res = await axiosInstance.post("/laboratory/orders", payload);
    return res.data?.data || res.data;
  },

  // Update lab result (legacy/notes)
  updateLabResult: async (id, payload) => {
    const res = await axiosInstance.patch(`/laboratory/results/${id}`, payload);
    return res.data?.data || res.data;
  },

  // Submit bulk parameter results into lab_results
  submitBulkResults: async (orderItemId, results, status = "preliminary") => {
    const res = await axiosInstance.post(`/laboratory/results/${orderItemId}/bulk`, { results, status });
    return res.data?.data || res.data;
  },

  // Pathologist verification
  verifyResult: async (orderItemId, payload = {}) => {
    const res = await axiosInstance.patch(`/laboratory/results/${orderItemId}/verify`, payload);
    return res.data?.data || res.data;
  },

  // Specimen status
  updateSpecimenStatus: async (specimenId, payload) => {
    const res = await axiosInstance.patch(`/laboratory/specimens/${specimenId}/status`, payload);
    return res.data?.data || res.data;
  },

  // Outsource dispatch
  outsourceSpecimen: async (specimenId, payload) => {
    const res = await axiosInstance.patch(`/laboratory/specimens/${specimenId}/outsource`, payload);
    return res.data?.data || res.data;
  },

  // Outsource return
  outsourceReturnSpecimen: async (specimenId, payload) => {
    const res = await axiosInstance.patch(`/laboratory/specimens/${specimenId}/outsource-return`, payload);
    return res.data?.data || res.data;
  },

  // KPI Dashboard Stats
  getDashboardStats: async () => {
    try {
      const res = await axiosInstance.get("/laboratory/dashboard-stats");
      return res.data?.data || res.data;
    } catch (err) {
      console.warn("API /laboratory/dashboard-stats call:", err?.message);
      return null;
    }
  },

  // Outsource Labs Master
  getOutsourceLabs: async (params = {}) => {
    try {
      const res = await axiosInstance.get("/laboratory/outsource-labs", { params });
      return res.data?.data || res.data || [];
    } catch (err) {
      console.warn("API /laboratory/outsource-labs call:", err?.message);
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
};

export default laboratoryService;
