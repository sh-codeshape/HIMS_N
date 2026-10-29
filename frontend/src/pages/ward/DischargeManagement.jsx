import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import doctorService from "../../api/services/doctorService";
import ipdService from "../../api/services/ipdService";
import "./DischargeManagement.css";

export default function DischargeManagement() {
  const [activeTab, setActiveTab] = useState("Discharge Process");
  const [doctorList, setDoctorList] = useState([]);
  const [admittedPatient, setAdmittedPatient] = useState(null);

  const [dischargeForm, setDischargeForm] = useState({
    date: new Date().toLocaleDateString("en-GB"),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    dischargeType: "Normal",
    condition: "Improved",
    dischargeTo: "Home",
    attendedBy: "",
    relationship: "",
    contactNo: "",
    remarks: "",
    followUpAfter: "1 Week",
    followUpWith: "",
    followUpDate: "",
    followUpRemarks: "",
  });

  useEffect(() => {
    const fetchDocs = (doctorService.getAll || doctorService.getDoctors || (() => Promise.resolve([])))();
    fetchDocs.then((res) => {
      const docs = res?.data || res || [];
      if (Array.isArray(docs)) setDoctorList(docs);
    }).catch(() => {});

    ipdService.getBedMatrix().then((res) => {
      const beds = Array.isArray(res) ? res : [];
      const occupied = beds.find((b) => b.patient_uhid || b.patient_first_name);
      if (occupied) {
        setAdmittedPatient({
          name: occupied.patient_first_name ? `${occupied.patient_first_name} ${occupied.patient_last_name || ""}`.trim() : "Patient",
          uhid: occupied.patient_uhid || "—",
          genderAge: occupied.gender ? `${occupied.gender}` : "—",
          phone: occupied.patient_phone || "—",
          city: occupied.patient_address || "Varanasi",
          ipdNo: occupied.ipd_no || "IPD-" + String(occupied.id || "001").slice(-6),
          department: occupied.ward_name || "General Medicine",
          admissionDate: occupied.admitted_at ? new Date(occupied.admitted_at).toLocaleDateString("en-GB") : "—",
          consultant: occupied.consultant_name || "—",
          bed: `${occupied.ward_name || "Ward"} (${occupied.bed_no || "Bed"})`,
          lengthOfStay: "—",
        });
      }
    }).catch(() => {});
  }, []);

  const adviceChecklist = [
    "Continue prescribed oral medications as directed",
    "Maintain adequate hydration and rest",
    "Regular vital monitoring (BP / Pulse)",
    "Follow up on scheduled date or earlier if symptoms aggravate",
    "Diet and lifestyle precautions advised",
    "Emergency contact if required",
  ];

  const handleGenerateSummary = () => {
    toast.success("Discharge Summary generated successfully!", { icon: "📄" });
  };

  const handleCompleteDischarge = () => {
    toast.success(`Discharge completed and bed released successfully!`, { icon: "🔓" });
  };

  return (
    <div className="discharge-mgmt-page">
      {/* 1. Header Section */}
      <div className="discharge-header">
        <div className="discharge-header__title-group">
          <div className="discharge-header__icon">
            <Icon name="LuFileText" size={20} />
          </div>
          <div>
            <h1 className="discharge-header__title">Discharge Management</h1>
            <p className="discharge-header__subtitle">
              Manage complete discharge process from clearance to summary and bed release
            </p>
          </div>
        </div>

        <div className="breadcrumb-text">
          Home &gt; IPD / OPD Ward &gt; <span className="breadcrumb-current">Discharge Management</span>
        </div>
      </div>

      {/* 2. 5-Step Stepper Bar */}
      <div className="discharge-stepper-bar">
        <div className="discharge-stepper-item discharge-stepper-item--completed">
          <span className="discharge-stepper-num">✓</span>
          <div className="discharge-stepper-text">
            <div className="stepper-title">Patient Selection</div>
            <div className="stepper-sub">Select IPD Patient</div>
          </div>
        </div>
        <div className="discharge-stepper-divider"></div>

        <div className="discharge-stepper-item discharge-stepper-item--active">
          <span className="discharge-stepper-num">2</span>
          <div className="discharge-stepper-text">
            <div className="stepper-title">Clinical & Discharge Details</div>
            <div className="stepper-sub">Diagnosis, Treatment, Advice</div>
          </div>
        </div>
        <div className="discharge-stepper-divider"></div>

        <div className="discharge-stepper-item">
          <span className="discharge-stepper-num">3</span>
          <div className="discharge-stepper-text">
            <div className="stepper-title">Clearances</div>
            <div className="stepper-sub">Billing, Pharmacy, Nursing</div>
          </div>
        </div>
        <div className="discharge-stepper-divider"></div>

        <div className="discharge-stepper-item">
          <span className="discharge-stepper-num">4</span>
          <div className="discharge-stepper-text">
            <div className="stepper-title">Discharge Summary</div>
            <div className="stepper-sub">Generate & Review</div>
          </div>
        </div>
        <div className="discharge-stepper-divider"></div>

        <div className="discharge-stepper-item">
          <span className="discharge-stepper-num">5</span>
          <div className="discharge-stepper-text">
            <div className="stepper-title">Final Discharge</div>
            <div className="stepper-sub">Release Bed</div>
          </div>
        </div>
      </div>

      {/* 3. Top Patient Summary Banner */}
      <div className="discharge-patient-banner">
        <div className="discharge-patient-left">
          <div className="discharge-avatar-box">
            {(admittedPatient?.name || "P")[0].toUpperCase()}
          </div>
          <div className="patient-main-info">
            <div className="patient-name-title">
              <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                {admittedPatient?.name || "No Patient Selected"}
              </span>
              <span className="patient-badge-exist">
                {admittedPatient ? "Admitted" : "Pending"}
              </span>
            </div>
            <div className="patient-meta-row">
              <span className="patient-uhid-tag">
                {admittedPatient?.uhid || "—"}
              </span>
              <span className="patient-meta-text">
                <Icon name="LuUser" size={13} /> {admittedPatient?.genderAge || "—"}
              </span>
              <span className="patient-meta-text">
                <Icon name="LuPhone" size={13} /> {admittedPatient?.phone || "—"}
              </span>
              <span className="patient-meta-text">
                <Icon name="LuMapPin" size={13} /> {admittedPatient?.city || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="discharge-patient-meta-grid">
          <div className="meta-item">
            <span className="meta-label">IPD No.:</span>
            <span className="meta-value">{admittedPatient?.ipdNo || "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Department:</span>
            <span className="meta-value">{admittedPatient?.department || "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Admission Date:</span>
            <span className="meta-value">{admittedPatient?.admissionDate || "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Consultant:</span>
            <span className="meta-value">{admittedPatient?.consultant || dischargeForm.followUpWith || "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Admission Type:</span>
            <span className="meta-value">{dischargeForm.dischargeType}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Ward / Bed:</span>
            <span className="meta-value highlight-bed">{admittedPatient?.bed || "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Discharge Date:</span>
            <span className="meta-value">{dischargeForm.date} {dischargeForm.time}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Length of Stay:</span>
            <span className="meta-value">{admittedPatient?.lengthOfStay || "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Discharge Type:</span>
            <span className="meta-value">{dischargeForm.dischargeType}</span>
          </div>
        </div>
      </div>

      {/* 4. Discharge Workflow Navigation Tabs */}
      <div className="discharge-tabs-bar">
        {[
          { label: "Discharge Process", icon: "LuClipboardList" },
          { label: "Clinical Details", icon: "LuStethoscope" },
          { label: "Investigations", icon: "LuFlaskConical" },
          { label: "Treatment & Course", icon: "LuPill" },
          { label: "Discharge Summary", icon: "LuFileText" },
          { label: "Documents", icon: "LuFolder" },
        ].map((tab) => (
          <button
            key={tab.label}
            type="button"
            className={`discharge-tab-btn ${
              activeTab === tab.label ? "discharge-tab-btn--active" : ""
            }`}
            onClick={() => setActiveTab(tab.label)}
          >
            <Icon name={tab.icon} size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 5. Main Dual Grid Layout */}
      <div className="discharge-main-grid">
        {/* Left Main Form & Clearances Column */}
        <div className="discharge-left-col">
          {/* Card 1: Discharge Clearance Status */}
          <div className="discharge-card">
            <div className="discharge-card__header">
              <h3 className="discharge-card__title">
                <Icon name="LuShieldCheck" size={17} className="icon-emerald" />
                Discharge Clearance Status
              </h3>
              <span className="clearance-all-badge">
                <Icon name="LuCheckCircle2" size={13} /> 5/5 Cleared
              </span>
            </div>

            <div className="clearances-row">
              <div className="clearance-badge-card">
                <div className="clearance-title-row">
                  <Icon name="LuCheckCircle" size={13} className="icon-emerald" />
                  <span>Doctor Clearance</span>
                </div>
                <span className="clearance-status-tag">Cleared</span>
                <span className="clearance-meta-sub">{dischargeForm.followUpWith || "Attending Consultant"}</span>
              </div>

              <div className="clearance-badge-card">
                <div className="clearance-title-row">
                  <Icon name="LuCheckCircle" size={13} className="icon-emerald" />
                  <span>Nursing Clearance</span>
                </div>
                <span className="clearance-status-tag">Cleared</span>
                <span className="clearance-meta-sub">Ward Station</span>
              </div>

              <div className="clearance-badge-card">
                <div className="clearance-title-row">
                  <Icon name="LuCheckCircle" size={13} className="icon-emerald" />
                  <span>Pharmacy Clearance</span>
                </div>
                <span className="clearance-status-tag">Cleared</span>
                <span className="clearance-meta-sub">Hospital Pharmacy</span>
              </div>

              <div className="clearance-badge-card">
                <div className="clearance-title-row">
                  <Icon name="LuCheckCircle" size={13} className="icon-emerald" />
                  <span>Lab/Investigation</span>
                </div>
                <span className="clearance-status-tag">Cleared</span>
                <span className="clearance-meta-sub">Diagnostic Lab</span>
              </div>

              <div className="clearance-badge-card">
                <div className="clearance-title-row">
                  <Icon name="LuCheckCircle" size={13} className="icon-emerald" />
                  <span>Billing Clearance</span>
                </div>
                <span className="clearance-status-tag">Cleared</span>
                <span className="clearance-meta-sub">IPD Billing Dept</span>
              </div>
            </div>
          </div>

          {/* Card 2: Discharge Details Form */}
          <div className="discharge-card">
            <h3 className="discharge-card__title">
              <Icon name="LuCalendar" size={17} className="icon-blue" />
              Discharge Details
            </h3>

            {/* Row 1: Date & Time, Discharge Type, Condition at Discharge */}
            <div className="form-row-3col">
              <div className="d-form-group">
                <label className="d-form-label">Discharge Date & Time *</label>
                <div className="d-datetime-inputs">
                  <input
                    type="text"
                    className="d-form-input"
                    value={dischargeForm.date}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, date: e.target.value })}
                  />
                  <input
                    type="text"
                    className="d-form-input"
                    value={dischargeForm.time}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-form-group">
                <label className="d-form-label">Discharge Type *</label>
                <div className="d-select-wrapper">
                  <select
                    className="d-form-select"
                    value={dischargeForm.dischargeType}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeType: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="LAMA">LAMA</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
              </div>

              <div className="d-form-group">
                <label className="d-form-label">Condition at Discharge *</label>
                <div className="d-select-wrapper">
                  <select
                    className="d-form-select"
                    value={dischargeForm.condition}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, condition: e.target.value })}
                  >
                    <option value="Improved">Improved</option>
                    <option value="Cured">Cured</option>
                    <option value="Stable">Stable</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Discharge to, Attended By, Relationship, Contact No. */}
            <div className="form-row-4col">
              <div className="d-form-group">
                <label className="d-form-label">Discharge to *</label>
                <div className="d-select-wrapper">
                  <select
                    className="d-form-select"
                    value={dischargeForm.dischargeTo}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeTo: e.target.value })}
                  >
                    <option value="Home">Home</option>
                    <option value="Other Hospital">Other Hospital</option>
                  </select>
                </div>
              </div>

              <div className="d-form-group">
                <label className="d-form-label">Attended By</label>
                <input
                  type="text"
                  className="d-form-input"
                  value={dischargeForm.attendedBy}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, attendedBy: e.target.value })}
                />
              </div>

              <div className="d-form-group">
                <label className="d-form-label">Relationship</label>
                <div className="d-select-wrapper">
                  <select
                    className="d-form-select"
                    value={dischargeForm.relationship}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, relationship: e.target.value })}
                  >
                    <option value="Brother">Brother</option>
                    <option value="Father">Father</option>
                    <option value="Spouse">Spouse</option>
                  </select>
                </div>
              </div>

              <div className="d-form-group">
                <label className="d-form-label">Contact No.</label>
                <input
                  type="text"
                  className="d-form-input"
                  value={dischargeForm.contactNo}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, contactNo: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Discharge Remarks Textarea */}
            <div className="d-form-group">
              <label className="d-form-label">Discharge Remarks</label>
              <textarea
                className="d-form-textarea"
                rows="2"
                value={dischargeForm.remarks}
                onChange={(e) => setDischargeForm({ ...dischargeForm, remarks: e.target.value })}
              ></textarea>
            </div>
          </div>

          {/* Bottom Dual Cards: Advice on Discharge & Follow Up Details */}
          <div className="bottom-dual-cards">
            {/* Advice on Discharge Card */}
            <div className="discharge-card">
              <h3 className="discharge-card__title">
                <Icon name="LuCheckSquare" size={16} className="icon-blue" />
                Advice on Discharge
              </h3>

              <div className="advice-checklist">
                {adviceChecklist.map((item, idx) => (
                  <label key={idx} className="advice-item">
                    <input type="checkbox" defaultChecked className="advice-checkbox" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Follow Up Details Card */}
            <div className="discharge-card">
              <h3 className="discharge-card__title">
                <Icon name="LuUserCheck" size={16} className="icon-blue" />
                Follow Up Details
              </h3>

              <div className="form-row-3col-compact">
                <div className="d-form-group">
                  <label className="d-form-label">Follow Up After</label>
                  <div className="d-select-wrapper">
                    <select
                      className="d-form-select"
                      value={dischargeForm.followUpAfter}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, followUpAfter: e.target.value })}
                    >
                      <option value="1 Week">1 Week</option>
                      <option value="2 Weeks">2 Weeks</option>
                    </select>
                  </div>
                </div>

                <div className="d-form-group">
                  <label className="d-form-label">Follow Up With</label>
                  <div className="d-select-wrapper">
                    <select
                      className="d-form-select"
                      value={dischargeForm.followUpWith}
                      onChange={(e) => setDischargeForm({ ...dischargeForm, followUpWith: e.target.value })}
                    >
                      <option value="">Select Doctor / चिकित्सक चुनें</option>
                      {doctorList.map((doc) => {
                        const dName = doc.name || doc.full_name || `Dr. ${doc.first_name || ""} ${doc.last_name || ""}`.trim();
                        return (
                          <option key={doc.id || dName} value={dName}>
                            {dName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="d-form-group">
                  <label className="d-form-label">Follow Up Date</label>
                  <input
                    type="text"
                    className="d-form-input"
                    value={dischargeForm.followUpDate}
                    onChange={(e) => setDischargeForm({ ...dischargeForm, followUpDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-form-group" style={{ marginTop: "0.2rem" }}>
                <label className="d-form-label">Remarks</label>
                <input
                  type="text"
                  className="d-form-input"
                  value={dischargeForm.followUpRemarks}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, followUpRemarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Form Action Buttons Row */}
          <div className="discharge-actions-bar">
            <button
              type="button"
              className="action-btn action-btn--back"
              onClick={() => toast.info("Going back to Ward Dashboard")}
            >
              <Icon name="LuArrowLeft" size={14} /> Back
            </button>

            <div className="action-btns-right">
              <button
                type="button"
                className="action-btn action-btn--draft"
                onClick={() => toast.success("Draft saved successfully!")}
              >
                <Icon name="LuSave" size={14} /> Save as Draft
              </button>

              <button
                type="button"
                className="action-btn action-btn--emerald"
                onClick={handleGenerateSummary}
              >
                <Icon name="LuFileText" size={14} /> Generate Discharge Summary
              </button>

              <button
                type="button"
                className="action-btn action-btn--primary"
                onClick={handleCompleteDischarge}
              >
                <Icon name="LuLock" size={14} /> Complete Discharge & Release Bed
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Official Printable Discharge Summary Document Preview */}
        <div className="discharge-right-col">
          <div className="preview-top-header">
            <h3 className="preview-title">
              <Icon name="LuFileCheck" size={16} className="icon-blue" />
              Discharge Summary Preview
            </h3>

            <div className="preview-actions">
              <button
                type="button"
                className="preview-btn-subtle"
                onClick={() => toast.info("Edit mode active")}
              >
                <Icon name="LuEdit" size={12} /> Edit
              </button>
              <button
                type="button"
                className="preview-btn-print"
                onClick={() => toast.success("Generating Printable PDF...")}
              >
                <Icon name="LuPrinter" size={12} /> Print/PDF
              </button>
            </div>
          </div>

          {/* Paper Letterhead Printable Card */}
          <div className="paper-preview-card">
            {/* Hospital Header Letterhead */}
            <div className="hospital-letterhead-header">
              <div className="hospital-logo-circle">
                <Icon name="LuPlus" size={22} />
              </div>
              <div className="hospital-branding-box">
                <h2 className="hospital-name-bold">NARAYAN HOSPITAL</h2>
                <div className="hospital-city-sub">Varanasi</div>
                <div className="hospital-tagline">Your Health, Our Priority</div>
                <div className="hospital-address-line">
                  Chandauli Road, Varanasi, Uttar Pradesh | Phone: 0542-XXXXXX | www.narayanhospital.in
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="document-title-banner">DISCHARGE SUMMARY</div>

        

            {/* Section 1: Diagnosis */}
            <div className="doc-section-head">Diagnosis</div>
            <div className="doc-section-body">
              <div><strong>Condition at Discharge:</strong> {dischargeForm.condition || "Stable / Improved"}</div>
              <div><strong>Discharge Type:</strong> {dischargeForm.dischargeType}</div>
            </div>

            {/* Section 2: Clinical Summary */}
            <div className="doc-section-head">Clinical Summary</div>
            <div className="doc-section-body">
              <div><strong>Clinical Remarks:</strong> {dischargeForm.remarks || "Patient clinically stable at time of discharge."}</div>
            </div>

            {/* Section 3: Advice on Discharge */}
            <div className="doc-section-head">Advice on Discharge</div>
            <ul className="doc-bullet-list">
              {adviceChecklist.map((adv, i) => (
                <li key={i}>{adv}</li>
              ))}
            </ul>

            {/* Section 4: Follow Up */}
            <div className="doc-section-head">Follow Up</div>
            <table className="doc-info-table">
              <tbody>
                <tr>
                  <td><strong>Follow Up After:</strong> {dischargeForm.followUpAfter || "1 Week"}</td>
                  <td><strong>Follow Up Date:</strong> {dischargeForm.followUpDate || "—"}</td>
                </tr>
                <tr>
                  <td><strong>Consultant:</strong> {dischargeForm.followUpWith || "—"}</td>
                  <td><strong>Remarks:</strong> {dischargeForm.followUpRemarks || "Review with reports"}</td>
                </tr>
              </tbody>
            </table>

            {/* Sign Off Footer */}
            <div className="doc-signature-wrap">
              <div className="signature-date">
                <strong>Date: {dischargeForm.date}</strong>
              </div>

              <div className="signature-doctor">
                <div className="doctor-cursive-sign">{dischargeForm.followUpWith || "Consultant"}</div>
                <div className="doctor-name-bold">{dischargeForm.followUpWith || "Authorized Medical Officer"}</div>
                <div className="doctor-title-sub">
                  Narayan Hospital, Varanasi
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
