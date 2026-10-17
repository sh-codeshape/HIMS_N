import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import ipdService from "../../../api/services/ipdService";
import "../IPDDischarge.css";

const DISCHARGE_TYPES = [
  { value: "normal", label: "Normal / Planned Discharge" },
  { value: "lama", label: "LAMA (Left Against Medical Advice)" },
  { value: "dama", label: "DAMA (Discharge Against Medical Advice)" },
  { value: "transferred", label: "Referred / Transferred to Higher Center" },
  { value: "absconded", label: "Absconded (Left without notice)" },
  { value: "death", label: "Expired / Death Summary" },
];

const DISCHARGE_CONDITIONS = [
  "Clinically Stable & Symptom Free",
  "Recovered - Vitals Normal",
  "Relieved - Under Medication",
  "Guarded / Critical",
  "Deceased"
];

export default function IPDDischargeWorkflow({ admission, onBack }) {
  const [clearanceChecklist, setClearanceChecklist] = useState({
    billingCleared: true,
    pharmacyReturned: true,
    nursingChartHandover: true,
  });

  const [dischargeForm, setDischargeForm] = useState({
    discharge_type: "normal",
    discharge_condition: "Clinically Stable & Symptom Free",
    final_diagnosis: "",
    history_of_present_illness: "",
    hospital_course: "",
    procedures_performed: "",
    follow_up_instructions: "Review in OPD after 5 days with updated vitals/lab tests.",
    follow_up_date: "",
    diet_advice: "Light, easily digestible diet. Maintain adequate hydration.",
    activity_advice: "Avoid heavy lifting or strenuous exercise for 1 week.",
    medications: [
      { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "SOS / Max TDS", days: "3 Days" },
      { name: "Cap Pantoprazole 40mg", dosage: "1 Cap", frequency: "OD (Empty Stomach)", days: "5 Days" }
    ]
  });

  // Pending dues (clearance) state — fetched per admission from backend
  const [pendingDues, setPendingDues] = useState(null);
  const [duesLoading, setDuesLoading] = useState(false);

  // Printable Summary Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(null);

  // Fetch pending dues for clearance (bill phase breakdown)
  const fetchPendingDues = useCallback(async (encounterId) => {
    if (!encounterId) {
      setPendingDues(null);
      return;
    }
    setDuesLoading(true);
    try {
      const dues = await ipdService.getPendingDues(encounterId);
      setPendingDues(dues);
      // Seed the clearance checklist from real backend data
      setClearanceChecklist({
        billingCleared: dues.cleared || false,
        pharmacyReturned: true, // operational, kept manual
        nursingChartHandover: true, // operational, kept manual
      });
    } catch (err) {
      console.error("Failed to fetch pending dues", err);
      setPendingDues(null);
      toast.warn("Could not fetch pending dues. Clearance shown as unverified.");
    } finally {
      setDuesLoading(false);
    }
  }, []);

  // Fetch pending dues when admission is available
  useEffect(() => {
    if (admission) {
      fetchPendingDues(admission.encounter_id || admission.id);
    }
  }, [admission, fetchPendingDues]);

  // Add Medication Row
  const handleAddMedication = () => {
    setDischargeForm((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: "", dosage: "1 Tab", frequency: "BD", days: "5 Days" }
      ]
    }));
  };

  // Remove Medication Row
  const handleRemoveMedication = (index) => {
    setDischargeForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  // Medication change handler
  const handleMedChange = (index, field, value) => {
    setDischargeForm((prev) => {
      const nextMeds = [...prev.medications];
      nextMeds[index][field] = value;
      return { ...prev, medications: nextMeds };
    });
  };

  // Submit Discharge Action
  const handleConfirmDischarge = async (e) => {
    e.preventDefault();
    if (!admission) return;

    // 1. Block if real backend dues are pending
    if (pendingDues && !pendingDues.cleared) {
      const pendingDept = pendingDues.breakdown?.filter((b) => !b.cleared).map((b) => b.department).join(", ") || "dues";
      toast.error(`Cannot discharge — pending ${pendingDept} dues of ₹${pendingDues.pendingAmount.toLocaleString("en-IN")} not cleared.`);
      return;
    }

    // 2. Block if operational clearances not confirmed
    if (!clearanceChecklist.billingCleared || !clearanceChecklist.pharmacyReturned || !clearanceChecklist.nursingChartHandover) {
      toast.error("Please verify all hospital clearances before discharge!");
      return;
    }

    try {
      // 1. Mark patient discharged in backend
      await ipdService.dischargePatient(admission.id, {
        discharge_type: dischargeForm.discharge_type,
        discharge_condition: dischargeForm.discharge_condition
      });

      // 2. Save Clinical Discharge Summary
      await ipdService.saveDischargeSummary(admission.id, {
        final_diagnosis: dischargeForm.final_diagnosis,
        history_of_present_illness: dischargeForm.history_of_present_illness,
        hospital_course: dischargeForm.hospital_course,
        procedures_performed: dischargeForm.procedures_performed,
        condition_at_discharge: dischargeForm.discharge_condition,
        follow_up_instructions: dischargeForm.follow_up_instructions,
        follow_up_date: dischargeForm.follow_up_date,
        diet_advice: dischargeForm.diet_advice,
        activity_advice: dischargeForm.activity_advice,
        status: "finalized",
        data: {
          medications: dischargeForm.medications,
          clearances: clearanceChecklist
        }
      });

      toast.success(
        `Patient ${admission.first_name} ${admission.last_name} discharged successfully! Bed released.`,
        { icon: "🏥" }
      );

      onBack && onBack();
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete patient discharge. Check network or clearances.");
    }
  };

  // Open Printable Summary
  const handleOpenSummary = async () => {
    try {
      const summary = await ipdService.getDischargeSummary(admission.id);
      setCurrentSummary(summary || {
        final_diagnosis: admission.admission_diagnosis || "General Observation",
        hospital_course: "Course of inpatient stay was unremarkable and responsive to medical therapy.",
        procedures_performed: "Diagnostic and therapeutic care under standard protocol.",
        condition_at_discharge: admission.discharge_condition || "Stable",
        follow_up_instructions: "Review in OPD with laboratory reports.",
        follow_up_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
        diet_advice: "Light, home-cooked food. Avoid heavy spices.",
        activity_advice: "Adequate rest for 5 days.",
        data: {
          medications: [
            { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "SOS", days: "3 Days" },
            { name: "Cap Pantoprazole 40mg", dosage: "1 Cap", frequency: "OD (Empty Stomach)", days: "5 Days" }
          ]
        }
      });
      setPrintModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch discharge summary details.");
    }
  };

  if (!admission) {
    return (
      <div className="ipd-discharge-container">
        <div className="ipd-dues-loading">Admission context not found. Please reopen from the IPD list.</div>
      </div>
    );
  }

  return (
    <div className="ipd-discharge-container">
      <form id="ipd-discharge-form" onSubmit={handleConfirmDischarge}>
        {/* Step 1: Clearance Verification */}
        <div className="ipd-form-section">
          <h4 className="ipd-form-section-title">1. Hospital Clearance Verification</h4>
          {/* Real pending dues from backend (pharmacy, IPD billing, lab) */}
          {duesLoading ? (
            <div className="ipd-dues-loading">Fetching pending dues from billing, pharmacy & lab…</div>
          ) : pendingDues ? (
            <div className="ipd-dues-breakdown">
              <div className="ipd-dues-summary-row">
                <span className="ipd-dues-label">IPD Billing Charges</span>
                <span className="ipd-dues-val">{`₹${pendingDues.totalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</span>
              </div>
              <div className="ipd-dues-summary-row">
                <span className="ipd-dues-label">Payments Received</span>
                <span className="ipd-dues-val ipd-text-green">{`₹${pendingDues.totalPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</span>
              </div>
              <div className="ipd-dues-summary-row ipd-dues-summary-row--pending">
                <span className="ipd-dues-label">{pendingDues.cleared ? "Balance Cleared" : "Pending Dues (All Departments)"}</span>
                <span className="ipd-dues-val ipd-text-red">{`₹${pendingDues.pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</span>
              </div>
              <div className="ipd-dues-dept-list">
                {pendingDues.breakdown.map((dept) => (
                  <div key={dept.department} className="ipd-dues-dept-row">
                    <span className="ipd-dues-dept-name">{dept.department}</span>
                    <span className={`ipd-dues-dept-status ${dept.cleared ? "ipd-dues-dept-cleared" : "ipd-dues-dept-pending"}`}>
                      {dept.cleared ? (
                        <><Icon name="LuCheckCircle" size={12} /> Cleared ₹{dept.clearedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</>
                      ) : (
                        <><Icon name="LuAlertCircle" size={12} /> Pending ₹{dept.pending.toLocaleString("en-IN", { minimumFractionDigits: 2 })} of ₹{dept.charges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</>
                      )}
                    </span>
                  </div>
                ))}
                {pendingDues.breakdown.length === 0 && (
                  <div className="ipd-dues-dept-row ipd-dues-dept-row--empty">
                    <span>No charge records found for this encounter.</span>
                  </div>
                )}
              </div>
              {pendingDues.sourceBreakdown?.length > 0 && (
                <div className="ipd-dues-sources">
                  <div className="ipd-dues-sources-title">Fee-wise pending dues (all charge sources)</div>
                  <div className="ipd-dues-dept-list">
                    {pendingDues.sourceBreakdown.map((src) => (
                      <div key={`${src.department}-${src.sourceType}`} className="ipd-dues-source-row">
                        <div className="ipd-dues-source-head">
                          <span className="ipd-dues-source-dept">{src.department}</span>
                          <span className="ipd-dues-source-type">{src.sourceType}</span>
                        </div>
                        <span className={`ipd-dues-dept-status ${src.cleared ? "ipd-dues-dept-cleared" : "ipd-dues-dept-pending"}`}>
                          {src.cleared ? (
                            <><Icon name="LuCheckCircle" size={12} /> Cleared ₹{src.clearedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</>
                          ) : (
                            <><Icon name="LuAlertCircle" size={12} /> Pending ₹{src.pending.toLocaleString("en-IN", { minimumFractionDigits: 2 })} of ₹{src.charges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ipd-dues-loading">Dues data unavailable.</div>
          )}

          <div className="ipd-operational-clearances">
            <label className="ipd-checklist-label">
              <input
                type="checkbox"
                checked={clearanceChecklist.billingCleared}
                onChange={(e) =>
                  setClearanceChecklist({ ...clearanceChecklist, billingCleared: e.target.checked })
                }
                disabled={pendingDues && !pendingDues.cleared}
              />
              <span style={{ opacity: pendingDues && !pendingDues.cleared ? 0.6 : 1 }}>
                Billing & Cash Dues Cleared
              </span>
              {pendingDues && !pendingDues.cleared && (
                <span style={{ fontSize: 11, color: "#dc2626", marginLeft: 6 }}>Clear dues first</span>
              )}
            </label>
            <label className="ipd-checklist-label">
              <input
                type="checkbox"
                checked={clearanceChecklist.pharmacyReturned}
                onChange={(e) =>
                  setClearanceChecklist({ ...clearanceChecklist, pharmacyReturned: e.target.checked })
                }
              />
              <span>Pharmacy Unused Drugs Returned</span>
            </label>
            <label className="ipd-checklist-label">
              <input
                type="checkbox"
                checked={clearanceChecklist.nursingChartHandover}
                onChange={(e) =>
                  setClearanceChecklist({ ...clearanceChecklist, nursingChartHandover: e.target.checked })
                }
              />
              <span>Nursing Chart & Vitals Handover</span>
            </label>
          </div>
        </div>

        {/* Step 2: Disposition & Condition */}
        <div className="ipd-form-section">
          <h4 className="ipd-form-section-title">2. Discharge Disposition & Condition</h4>
          <div className="ipd-form-row">
            <div className="ipd-form-group">
              <label>Discharge Type</label>
              <select
                className="ipd-form-control"
                value={dischargeForm.discharge_type}
                onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_type: e.target.value })}
              >
                {DISCHARGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="ipd-form-group">
              <label>Condition at Discharge</label>
              <select
                className="ipd-form-control"
                value={dischargeForm.discharge_condition}
                onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_condition: e.target.value })}
              >
                {DISCHARGE_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Clinical Discharge Summary */}
        <div className="ipd-form-section">
          <h4 className="ipd-form-section-title">3. Clinical Summary & Hospital Course</h4>
          <div className="ipd-form-group">
            <label>Final Clinical Diagnosis</label>
            <input
              type="text"
              className="ipd-form-control"
              value={dischargeForm.final_diagnosis}
              onChange={(e) => setDischargeForm({ ...dischargeForm, final_diagnosis: e.target.value })}
              placeholder="e.g. Acute Appendicitis - Post Laparoscopic Appendectomy"
              required
            />
          </div>

          <div className="ipd-form-group">
            <label>Hospital Course & Response to Treatment</label>
            <textarea
              className="ipd-form-control"
              value={dischargeForm.hospital_course}
              onChange={(e) => setDischargeForm({ ...dischargeForm, hospital_course: e.target.value })}
              rows={3}
            />
          </div>

          <div className="ipd-form-group">
            <label>Procedures & Investigations Done</label>
            <input
              type="text"
              className="ipd-form-control"
              value={dischargeForm.procedures_performed}
              onChange={(e) => setDischargeForm({ ...dischargeForm, procedures_performed: e.target.value })}
              placeholder="e.g. USG Abdomen, Routine Hematology, Appendectomy"
            />
          </div>
        </div>

        {/* Step 4: Discharge Medications */}
        <div className="ipd-form-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 className="ipd-form-section-title">4. Discharge Medication Schedule</h4>
            <button
              type="button"
              onClick={handleAddMedication}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <Icon name="LuPlus" size={14} /> Add Medicine
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dischargeForm.medications.map((med, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Medicine Name & Strength"
                  className="ipd-form-control"
                  value={med.name}
                  onChange={(e) => handleMedChange(idx, "name", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Dosage"
                  className="ipd-form-control"
                  value={med.dosage}
                  onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Freq (OD/BD/TDS)"
                  className="ipd-form-control"
                  value={med.frequency}
                  onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Duration"
                  className="ipd-form-control"
                  value={med.days}
                  onChange={(e) => handleMedChange(idx, "days", e.target.value)}
                />
                {dischargeForm.medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(idx)}
                    style={{ background: "#fee2e2", border: "none", color: "#dc2626", padding: "8px", borderRadius: 6, cursor: "pointer" }}
                  >
                    <Icon name="LuX" size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 5: Follow-up & Advice */}
        <div className="ipd-form-section">
          <h4 className="ipd-form-section-title">5. Post-Discharge Advice & Follow-Up</h4>
          <div className="ipd-form-row">
            <div className="ipd-form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                className="ipd-form-control"
                value={dischargeForm.follow_up_date}
                onChange={(e) => setDischargeForm({ ...dischargeForm, follow_up_date: e.target.value })}
              />
            </div>
            <div className="ipd-form-group">
              <label>Dietary Instructions</label>
              <input
                type="text"
                className="ipd-form-control"
                value={dischargeForm.diet_advice}
                onChange={(e) => setDischargeForm({ ...dischargeForm, diet_advice: e.target.value })}
              />
            </div>
          </div>

          <div className="ipd-form-group">
            <label>Follow-up Instructions & Emergency Warning Signs</label>
            <textarea
              className="ipd-form-control"
              value={dischargeForm.follow_up_instructions}
              onChange={(e) => setDischargeForm({ ...dischargeForm, follow_up_instructions: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </form>

      {/* Footer: Back / Cancel + Confirm Discharge */}
      <div className="ipd-modal-footer" style={{ padding: "14px 16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button type="button" className="ipd-btn-summary" onClick={onBack}>
          Back to IPD List
        </button>
        <button type="submit" form="ipd-discharge-form" className="ipd-btn-discharge" style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
          <Icon name="LuCheckCircle" size={15} /> Confirm Discharge & Release Bed
        </button>
      </div>

      {/* Printable Official Discharge Slip */}
      {printModalOpen && admission && currentSummary && (
        <div className="ipd-modal-overlay" onClick={() => setPrintModalOpen(false)}>
          <div className="ipd-modal-card ipd-print-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ipd-modal-header">
              <h3 className="ipd-modal-title">Clinical Discharge Summary Document</h3>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  <Icon name="LuPrinter" size={15} /> Print Summary Slip
                </button>
                <button
                  type="button"
                  className="ipd-modal-close-btn"
                  onClick={() => setPrintModalOpen(false)}
                >
                  <Icon name="LuX" size={20} />
                </button>
              </div>
            </div>

            <div className="ipd-modal-body" style={{ background: "#f8fafc" }}>
              <div className="ipd-print-sheet">
                {/* Hospital Header */}
                <div className="ipd-print-header">
                  <div>
                    <h1 className="ipd-print-hospital-name">NARAYAN SUPER SPECIALITY HOSPITAL</h1>
                    <p className="ipd-print-hospital-sub">
                      Plot 12, Healthcare City, Institutional Area • Helpline: +91 11-45678900 • NABH & NABL Accredited
                    </p>
                  </div>
                  <div className="ipd-print-title-badge">
                    DISCHARGE SUMMARY
                  </div>
                </div>

                {/* Patient Demographics */}
                <div className="ipd-print-meta-grid">
                  <div className="ipd-print-meta-item">
                    <span>Patient Name:</span>
                    <span>{admission.first_name} {admission.last_name}</span>
                  </div>
                  <div className="ipd-print-meta-item">
                    <span>UHID:</span>
                    <span>{admission.uhid || "—"}</span>
                  </div>
                  <div className="ipd-print-meta-item">
                    <span>IPD Admission No:</span>
                    <span>{admission.admission_no}</span>
                  </div>
                  <div className="ipd-print-meta-item">
                    <span>Ward & Bed:</span>
                    <span>{admission.ward_name || "Ward"} / {admission.bed_name || "Bed"}</span>
                  </div>
                  <div className="ipd-print-meta-item">
                    <span>Admission Date:</span>
                    <span>{new Date(admission.admitted_at).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="ipd-print-meta-item">
                    <span>Discharge Date:</span>
                    <span>{admission.discharged_at ? new Date(admission.discharged_at).toLocaleString("en-IN") : new Date().toLocaleString("en-IN")}</span>
                  </div>
                  <div className="ipd-print-meta-item">
                    <span>Discharge Disposition:</span>
                    <span style={{ textTransform: "uppercase" }}>{admission.discharge_type || "NORMAL"}</span>
                  </div>
                  <div className="ipd-print-meta-item">
                    <span>Consultant In-Charge:</span>
                    <span>
                      {admission.doctor_first_name
                        ? `Dr. ${admission.doctor_first_name} ${admission.doctor_last_name || ""}`
                        : "Dr. On-Duty Specialist"}
                    </span>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="ipd-print-section">
                  <h5 className="ipd-print-section-title">Final Clinical Diagnosis</h5>
                  <p className="ipd-print-section-text" style={{ fontWeight: 700, color: "#0f172a" }}>
                    {currentSummary.final_diagnosis || admission.admission_diagnosis || "Acute Clinical Condition"}
                  </p>
                </div>

                {/* Clinical Course */}
                <div className="ipd-print-section">
                  <h5 className="ipd-print-section-title">Brief History & Hospital Course</h5>
                  <p className="ipd-print-section-text">
                    {currentSummary.hospital_course || "Patient was admitted under care, stabilized with supportive treatment and scheduled medications. Response to therapy was satisfactory."}
                  </p>
                </div>

                {/* Procedures */}
                {currentSummary.procedures_performed && (
                  <div className="ipd-print-section">
                    <h5 className="ipd-print-section-title">Procedures / Key Investigations</h5>
                    <p className="ipd-print-section-text">{currentSummary.procedures_performed}</p>
                  </div>
                )}

                {/* Discharge Medications */}
                <div className="ipd-print-section">
                  <h5 className="ipd-print-section-title">Discharge Medications (Rx)</h5>
                  <table className="ipd-rx-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Medicine Name</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentSummary.data?.medications || []).map((med, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{med.name}</td>
                          <td>{med.dosage}</td>
                          <td>{med.frequency}</td>
                          <td>{med.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    );
}
