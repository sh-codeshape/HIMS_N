import axiosInstance from "../axiosInstance";
import createCrudService from "./createCrudService";
import { ENDPOINTS } from "../endpoints";

// Base CRUD (getAll, getById, create, update, remove) generated from the
// factory. Add module-specific calls below when a screen needs more than
// plain CRUD (e.g. a custom "discharge" action).
const staffService = {
  ...createCrudService(ENDPOINTS.STAFF.BASE),
  getDoctors: async (params = {}) => {
    const res = await axiosInstance.get(ENDPOINTS.STAFF.DOCTORS, { params });
    return res.data?.data ?? res.data ?? [];
  },
  getDepartments: async () => {
    const res = await axiosInstance.get(ENDPOINTS.STAFF.DEPARTMENTS);
    return res.data?.data ?? res.data ?? [];
  },
};

export default staffService;
