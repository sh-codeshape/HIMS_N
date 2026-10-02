import axiosInstance from "../axiosInstance";

/**
 * Generic CRUD service factory so every module (OPD, IPD, Billing,
 * Pharmacy, Lab, ...) doesn't need to hand-write the same 5 functions.
 *
 * Usage:
 *   const opdRegistrationService = createCrudService(ENDPOINTS.OPD.REGISTRATION);
 *   await opdRegistrationService.getAll({ page: 1 });
 *   await opdRegistrationService.create(payload);
 */
const unwrapData = (response) => response?.data?.data ?? response?.data ?? null;

export default function createCrudService(basePath) {
  return {
    getAll: async (params = {}) => {
      const res = await axiosInstance.get(basePath, { params });
      return unwrapData(res);
    },
    getById: async (id) => {
      const res = await axiosInstance.get(`${basePath}/${id}`);
      return unwrapData(res);
    },
    create: async (payload) => {
      const res = await axiosInstance.post(basePath, payload);
      return unwrapData(res);
    },
    update: async (id, payload) => {
      const res = await axiosInstance.put(`${basePath}/${id}`, payload);
      return unwrapData(res);
    },
    remove: async (id) => {
      const res = await axiosInstance.delete(`${basePath}/${id}`);
      return unwrapData(res);
    },
  };
}
