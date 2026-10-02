import createCrudService from "./createCrudService";
import { ENDPOINTS } from "../endpoints";

// Base CRUD (getAll, getById, create, update, remove) generated from the
// factory. Add module-specific calls below when a screen needs more than
// plain CRUD (e.g. a custom "discharge" action).
const patientService = {
  ...createCrudService(ENDPOINTS.PATIENTS.BASE),
  search: async (params = {}) => {
    const res = await axiosInstance.get(ENDPOINTS.PATIENTS.DIRECTORY, {
      params,
    });
    return res.data?.data ?? res.data ?? [];
  },
};

export default patientService;
