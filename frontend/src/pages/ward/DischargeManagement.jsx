import React, { useState } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/common/Icon.jsx";
import "./DischargeManagement.css";

export default function DischargeManagement() {
  const [activeTab, setActiveTab] = useState("Discharge Process");
  const [dischargeForm, setDischargeForm] = useState({
    date: "02-10-2026",
    time: "04:20 PM",
    dischargeType: "Normal",
    condition: "Improved",
    dischargeTo: "Home",
    attendedBy: "Ramesh Kumar (Brother)",
    relationship: "Brother",
    contactNo: "9876543211",
    remarks: "Patient is clinically stable and advised to follow prescribed medications and follow-up.",
    followUpAfter: "1 Week",
    followUpWith: "Dr. Amit Sharma",
    followUpDate: "09-10-2026",
    followUpRemarks: "Review with reports",
  });

  const adviceChecklist = [
    "Continue oral antibiotics for 5 days",
    "Steam inhalation twice daily",
    "Maintain adequate hydration",
    "Regular BP monitoring",
    "Follow up after 1 week or earlier if symptoms persist",
    "Diet and lifestyle modification",
    "Emergency contact if required",
  ];

  const handleGenerateSummary = () => {
    toast.success("Discharge Summary generated successfully!", { icon: "📄" });
  };

  const handleCompleteDischarge = () => {
    toast.success("Discharge completed and Bed GW102 (B-12) released!", { icon: "🔓" });
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
          <div className="discharge-avatar-box">RK</div>
          <div className="patient-main-info">
            <div className="patient-name-title">
              Rohit Kumar
              <span className="patient-badge-exist">Admitted</span>
            </div>
            <div className="patient-meta-row">
              <span className="patient-uhid-tag">UHID12345</span>
              <span className="patient-meta-text">
                <Icon name="LuUser" size={13} /> 28 Y / Male
              </span>
              <span className="patient-meta-text">
                <Icon name="LuPhone" size={13} /> 9876543210
              </span>
              <span className="patient-meta-text">
                <Icon name="LuMapPin" size={13} /> Varanasi, UP
              </span>
            </div>
          </div>
        </div>

        <div className="discharge-patient-meta-grid">
          <div className="meta-item">
            <span className="meta-label">IPD No.:</span>
            <span className="meta-value">IPD20260929001</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Department:</span>
            <span className="meta-value">General Medicine</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Admission Date:</span>
            <span className="meta-value">29-09-2026 10:30 AM</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Consultant:</span>
            <span className="meta-value">Dr. Amit Sharma</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Admission Type:</span>
            <span className="meta-value">Routine</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Ward / Bed:</span>
            <span className="meta-value highlight-bed">GW102 (B-12)</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Discharge Date:</span>
            <span className="meta-value">02-10-2026 04:20 PM</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Length of Stay:</span>
            <span className="meta-value">3 Days</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Discharge Type:</span>
            <span className="meta-value">Normal</span>
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
                <span className="clearance-meta-sub">Dr. Amit Sharma</span>
                <span className="clearance-meta-sub">02-10-2026 10:00 AM</span>
              </div>

              <div className="clearance-badge-card">
                <div className="clearance-title-row">
                  <Icon name="LuCheckCircle" size={13} className="icon-emerald" />
                  <span>Nursing Clearance</span>
                </div>
                <span className="clearance-status-tag">Cleared</span>
                <span className="clearance-meta-sub">Nursing Staff</span>
                <span className="clearance-meta-sub">02-10-2026 10:30 AM</span>
              </div>

              <div className="clearance-badge-card">
                <div className="clearance-title-row">
                  <Icon name="LuCheckCircle" size={13} className="icon-emerald" />
                  <span>Pharmacy Clearance</span>
                </div>
                <span className="clearance-status-tag">Cleared</span>
                <span className="clearance-meta-sub">Pharmacy Dept</span>
                <span className="clearance-meta-sub">02-10-2026 11:00 AM</span>
              </div>

              <div className="clearance-badge-card">
                <div className="clearance-title-row">
                  <Icon name="LuCheckCircle" size={13} className="icon-emerald" />
                  <span>Lab/Investigation</span>
                </div>
                <span className="clearance-status-tag">Cleared</span>
                <span className="clearance-meta-sub">Lab Department</span>
                <span className="clearance-meta-sub">02-10-2026 11:15 AM</span>
              </div>

              <div className="clearance-badge-card">
                <div className="clearance-title-row">
                  <Icon name="LuCheckCircle" size={13} className="icon-emerald" />
                  <span>Billing Clearance</span>
                </div>
                <span className="clearance-status-tag">Cleared</span>
                <span className="clearance-meta-sub">Accounts Dept</span>
                <span className="clearance-meta-sub">02-10-2026 11:30 AM</span>
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
                      <option value="Dr. Amit Sharma">Dr. Amit Sharma</option>
                      <option value="Dr. Rajesh Sharma">Dr. Rajesh Sharma</option>
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

            {/* Patient Meta Info Grid Table */}
            <table className="doc-info-table">
              <tbody>
                <tr>
                  <td><strong>UHID:</strong> UHID12345</td>
                  <td><strong>IPD No.:</strong> IPD20260929001</td>
                </tr>
                <tr>
                  <td><strong>Patient Name:</strong> Rohit Kumar</td>
                  <td><strong>Age / Gender:</strong> 28 Years / Male</td>
                </tr>
                <tr>
                  <td><strong>Department:</strong> General Medicine</td>
                  <td><strong>Consultant:</strong> Dr. Amit Sharma</td>
                </tr>
                <tr>
                  <td><strong>Ward / Room / Bed:</strong> GW102 (B-12)</td>
                  <td><strong>Admission Type:</strong> Routine</td>
                </tr>
                <tr>
                  <td><strong>Admission Date:</strong> 29-09-2026 10:30 AM</td>
                  <td><strong>Discharge Date:</strong> 02-10-2026 04:20 PM</td>
                </tr>
                <tr>
                  <td><strong>Length of Stay:</strong> 3 Days</td>
                  <td><strong>Discharge Type:</strong> Normal</td>
                </tr>
              </tbody>
            </table>

            {/* Section 1: Diagnosis */}
            <div className="doc-section-head">Diagnosis</div>
            <div className="doc-section-body">
              <div><strong>Primary Diagnosis:</strong> Pneumonia</div>
              <div><strong>Secondary Diagnosis:</strong> Hypertension</div>
              <div><strong>Other Comorbidities:</strong> Type 2 Diabetes Mellitus</div>
            </div>

            {/* Section 2: Clinical Summary */}
            <div className="doc-section-head">Clinical Summary</div>
            <div className="doc-section-body">
              <div><strong>Chief Complaints:</strong> Fever, cough, breathlessness</div>
              <div><strong>Clinical Findings:</strong> Bilateral basal crepitations, mild tachycardia.</div>
              <div><strong>Investigations (Key):</strong> CBC, Chest X-Ray, CRP</div>
              <div><strong>Treatment Given:</strong> IV Antibiotics, Nebulization, Supportive care</div>
            </div>

            {/* Section 3: Hospital Course */}
            <div className="doc-section-head">Hospital Course</div>
            <div className="doc-section-body doc-section-body--italic">
              Patient admitted with complaints of fever, cough and breathlessness. Managed with IV antibiotics, supportive care and nebulization. Patient responded well to treatment and is clinically stable at discharge.
            </div>

            {/* Section 4: Advice on Discharge */}
            <div className="doc-section-head">Advice on Discharge</div>
            <ul className="doc-bullet-list">
              <li>Continue oral antibiotics for 5 days</li>
              <li>Steam inhalation twice daily</li>
              <li>Maintain adequate hydration</li>
              <li>Regular BP monitoring</li>
              <li>Follow up after 1 week or earlier if symptoms persist</li>
            </ul>

            {/* Section 5: Follow Up */}
            <div className="doc-section-head">Follow Up</div>
            <table className="doc-info-table">
              <tbody>
                <tr>
                  <td><strong>Follow Up After:</strong> 1 Week</td>
                  <td><strong>Follow Up Date:</strong> 09-10-2026</td>
                </tr>
                <tr>
                  <td><strong>Consultant:</strong> Dr. Amit Sharma</td>
                  <td><strong>Remarks:</strong> Review with reports</td>
                </tr>
              </tbody>
            </table>

            {/* Sign Off Footer */}
            <div className="doc-signature-wrap">
              <div className="signature-date">
                <strong>Date: 02-10-2026</strong>
              </div>

              <div className="signature-doctor">
                <div className="doctor-cursive-sign">Dr. Amit Sharma</div>
                <div className="doctor-name-bold">Dr. Amit Sharma</div>
                <div className="doctor-title-sub">
                  Consultant - General Medicine <br />
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
