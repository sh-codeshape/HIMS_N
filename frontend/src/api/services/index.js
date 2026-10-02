import authService from "./authService";
import patientService from "./patientService";
import opdService from "./opdService";
import ipdService from "./ipdService";
import billingService from "./billingService";
import createCrudService from "./createCrudService";

export {
  authService,
  patientService,
  opdService,
  ipdService,
  billingService,
  createCrudService,
};

export const api = {
  auth: authService,
  patients: patientService,
  opd: opdService,
  ipd: ipdService,
  billing: billingService,
};

export default api;
