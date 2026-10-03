import {
  INITIAL_PATIENTS,
  INITIAL_OPD_QUEUE,
  INITIAL_BEDS,
  INITIAL_INVOICES,
  INITIAL_MEDICINES,
  INITIAL_LAB_TESTS,
  INITIAL_DOCTORS,
} from "./mockData";
import { buildUHID, nextUHIDSerial } from "../utils/uhid";
import { isMockMode } from "../config/appConfig";

const KEYS = {
  PATIENTS: "hims_mock_patients",
  OPD: "hims_mock_opd",
  BEDS: "hims_mock_beds",
  INVOICES: "hims_mock_invoices",
  MEDICINES: "hims_mock_medicines",
  LAB_TESTS: "hims_mock_lab_tests",
  DOCTORS: "hims_mock_doctors",
  IPD_ADMISSIONS: "hims_mock_ipd_admissions",
};

function getStored(key, defaultData) {
  if (!isMockMode()) {
    return [];
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function setStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn("Local storage write failed:", err);
  }
}

export const mockStore = {
  // ── Patients ──────────────────────────────────────────────────────────────
  getPatients: () => getStored(KEYS.PATIENTS, INITIAL_PATIENTS),
  addPatient: (patient) => {
    const list = getStored(KEYS.PATIENTS, INITIAL_PATIENTS);
    const year = new Date().getFullYear();
    const highestSerial =
      list
        .map((p) => Number(String(p.uhid || "").split("-")[2] || 0))
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => b - a)[0] || 0;

    const newPatient = {
      id: `P-${Date.now().toString().slice(-5)}`,
      uhid: buildUHID(new Date(), nextUHIDSerial(highestSerial)),
      registeredAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "Active",
      ...patient,
    };
    const updated = [newPatient, ...list];
    setStored(KEYS.PATIENTS, updated);
    return newPatient;
  },
  updatePatient: (uhid, updates) => {
    const list = getStored(KEYS.PATIENTS, INITIAL_PATIENTS);
    const updated = list.map((p) =>
      p.uhid === uhid ? { ...p, ...updates } : p,
    );
    setStored(KEYS.PATIENTS, updated);
    return updated;
  },
  deletePatient: (uhid) => {
    const list = getStored(KEYS.PATIENTS, INITIAL_PATIENTS);
    const updated = list.filter((p) => p.uhid !== uhid);
    setStored(KEYS.PATIENTS, updated);
    return updated;
  },

  // ── OPD Queue ─────────────────────────────────────────────────────────────
  getOPDQueue: () => getStored(KEYS.OPD, INITIAL_OPD_QUEUE),
  addOPDToken: (opdEntry) => {
    const list = getStored(KEYS.OPD, INITIAL_OPD_QUEUE);
    const count = list.length + 1;
    const newEntry = {
      tokenNo: `T-${count < 10 ? "0" + count : count}`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Waiting",
      ...opdEntry,
    };
    const updated = [...list, newEntry];
    setStored(KEYS.OPD, updated);
    return newEntry;
  },
  updateOPDStatus: (tokenNo, status) => {
    const list = getStored(KEYS.OPD, INITIAL_OPD_QUEUE);
    const updated = list.map((item) =>
      item.tokenNo === tokenNo ? { ...item, status } : item,
    );
    setStored(KEYS.OPD, updated);
    return updated;
  },

  // ── IPD Admissions ────────────────────────────────────────────────────────
  getIPDAdmissions: () => getStored(KEYS.IPD_ADMISSIONS, []),
  addIPDAdmission: (admissionEntry) => {
    const list = getStored(KEYS.IPD_ADMISSIONS, []);
    const admNo = `IPD-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, "0")}`;
    const newAdmission = {
      admissionNo: admNo,
      admissionDate: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "Admitted",
      bedNo: "—",
      ward: "—",
      ...admissionEntry,
    };
    const updated = [newAdmission, ...list];
    setStored(KEYS.IPD_ADMISSIONS, updated);
    return newAdmission;
  },
  updateIPDStatus: (admissionNo, updates) => {
    const list = getStored(KEYS.IPD_ADMISSIONS, []);
    const updated = list.map((a) =>
      a.admissionNo === admissionNo ? { ...a, ...updates } : a,
    );
    setStored(KEYS.IPD_ADMISSIONS, updated);
    return updated;
  },

  // ── Beds ──────────────────────────────────────────────────────────────────
  getBeds: () => getStored(KEYS.BEDS, INITIAL_BEDS),
  updateBedStatus: (bedNo, updates) => {
    const list = getStored(KEYS.BEDS, INITIAL_BEDS);
    const updated = list.map((b) =>
      b.bedNo === bedNo ? { ...b, ...updates } : b,
    );
    setStored(KEYS.BEDS, updated);
    return updated;
  },

  // ── Invoices / Billing ────────────────────────────────────────────────────
  getInvoices: () => getStored(KEYS.INVOICES, INITIAL_INVOICES),
  addInvoice: (invoice) => {
    const list = getStored(KEYS.INVOICES, INITIAL_INVOICES);
    const count = list.length + 105;
    const newInv = {
      id: `INV-2026-${count}`,
      invoiceNo: `INV-${count}`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "Paid",
      ...invoice,
    };
    const updated = [newInv, ...list];
    setStored(KEYS.INVOICES, updated);
    return newInv;
  },

  // ── Medicines / Pharmacy ──────────────────────────────────────────────────
  getMedicines: () => getStored(KEYS.MEDICINES, INITIAL_MEDICINES),
  dispenseMedicine: (medicineId, quantity) => {
    const list = getStored(KEYS.MEDICINES, INITIAL_MEDICINES);
    const updated = list.map((m) =>
      m.id === medicineId
        ? { ...m, stock: Math.max(0, m.stock - quantity) }
        : m,
    );
    setStored(KEYS.MEDICINES, updated);
    return updated;
  },

  // ── Lab Tests ─────────────────────────────────────────────────────────────
  getLabTests: () => getStored(KEYS.LAB_TESTS, INITIAL_LAB_TESTS),
  addLabTest: (test) => {
    const list = getStored(KEYS.LAB_TESTS, INITIAL_LAB_TESTS);
    const newTest = {
      id: `LAB-${Date.now().toString().slice(-4)}`,
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      orderedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "Sample Pending",
      sampleCollected: "Pending",
      result: "Pending",
      ...test,
    };
    const updated = [newTest, ...list];
    setStored(KEYS.LAB_TESTS, updated);
    return newTest;
  },
  updateLabResult: (orderId, result, status = "Completed") => {
    const list = getStored(KEYS.LAB_TESTS, INITIAL_LAB_TESTS);
    const updated = list.map((t) =>
      t.orderId === orderId
        ? { ...t, result, status, sampleCollected: "Yes" }
        : t,
    );
    setStored(KEYS.LAB_TESTS, updated);
    return updated;
  },

  // ── Doctors ───────────────────────────────────────────────────────────────
  getDoctors: () => getStored(KEYS.DOCTORS, INITIAL_DOCTORS),
};
