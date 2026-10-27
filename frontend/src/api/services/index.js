import authService from "./authService";
import patientService from "./patientService";
import opdService from "./opdService";
import ipdService from "./ipdService";
import billingService from "./billingService";
import doctorService from "./doctorService";
import createCrudService from "./createCrudService";

export {
  authService,
  patientService,
  opdService,
  ipdService,
  billingService,
  doctorService,
  createCrudService,
};

export const api = {
  auth: authService,
  patients: patientService,
  opd: opdService,
  ipd: ipdService,
  billing: billingService,
  doctors: doctorService,
};

export default api;
