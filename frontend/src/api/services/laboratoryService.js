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

  // Create new lab order
  createLabOrder: async (payload) => {
    const res = await axiosInstance.post("/laboratory/orders", payload);
    return res.data?.data || res.data;
  },

  // Update lab result
  updateLabResult: async (id, payload) => {
    const res = await axiosInstance.patch(`/laboratory/results/${id}`, payload);
    return res.data?.data || res.data;
  },
};

export default laboratoryService;
