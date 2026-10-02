import createCrudService from "./createCrudService";
import { ENDPOINTS } from "../endpoints";

// Base CRUD (getAll, getById, create, update, remove) generated from the
// factory. Add module-specific calls below when a screen needs more than
// plain CRUD (e.g. a custom "discharge" action).
const followUpService = {
  ...createCrudService(ENDPOINTS.FOLLOW_UP.LIST),
};

export default followUpService;
