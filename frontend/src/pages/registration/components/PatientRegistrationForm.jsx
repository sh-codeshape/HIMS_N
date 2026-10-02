import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Input from "../../../components/common/Input.jsx";
import Button from "../../../components/common/Button.jsx";
import { mockStore } from "../../../mock/mockStore"; // Keep for fallback or remove if not needed elsewhere
import patientService from "../../../api/services/patientService";
import "./PatientRegistrationForm.css";

const DEPARTMENTS = [
  "General Medicine",
  "General Surgery",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "Gynecology & Obstetrics",
  "ENT",
  "Ophthalmology",
  "Dermatology",
  "Neurology",
];

const DOCTOR_OPTIONS = {
  "General Medicine": "Dr. Priyadarshan Joshi",
  "General Surgery": "Dr. Rajesh Sharma",
  "Cardiology": "Dr. Priya Deshmukh",
  "Orthopedics": "Dr. Anand Kulkarni",
  "Pediatrics": "Dr. Arvind Saxena",
  "Gynecology & Obstetrics": "Dr. Meenakshi Iyer",
};

export default function PatientRegistrationForm({ onRegistered }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    bloodGroup: "O+",
    category: "OPD",
    department: "General Medicine",
    doctor: "Dr. Priyadarshan Joshi",
    address: "",
    guardianName: "",
    emergencyContact: "",
    notes: "",
  });

  const [lastRegistered, setLastRegistered] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "department") {
      setForm((prev) => ({
        ...prev,
        department: value,
        doctor: DOCTOR_OPTIONS[value] || "Dr. Rajesh Sharma",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.age) {
      toast.error("Please fill all required patient details.");
      return;
    }

    try {
      const [firstName, ...lastNameArr] = form.name.split(" ");
      const lastName = lastNameArr.join(" ");

      const payload = {
        first_name: firstName,
        last_name: lastName,
        gender: form.gender.toLowerCase(),
        phone: form.phone,
        date_of_birth: new Date(new Date().setFullYear(new Date().getFullYear() - Number(form.age))).toISOString().split('T')[0],
      };

      const newPatientData = await patientService.create(payload);
      
      const newPatient = {
        id: newPatientData.id,
        uhid: newPatientData.uhid,
        name: form.name,
        age: form.age,
        gender: form.gender,
        phone: form.phone,
        bloodGroup: form.bloodGroup,
        department: form.department
      };

      setLastRegistered(newPatient);
      if (onRegistered) onRegistered(newPatient);

      toast.success(`Patient Registered! UHID: ${newPatient.uhid}`, {
        icon: "📋",
        duration: 4000,
      });

      setForm({
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        bloodGroup: "O+",
        category: "OPD",
        department: "General Medicine",
        doctor: "Dr. Priyadarshan Joshi",
        address: "",
        guardianName: "",
        emergencyContact: "",
        notes: "",
      });
    } catch (err) {
      toast.error("Failed to register patient");
      console.error(err);
    }
  };

  return (
    <div className="pat-reg-module">
      <div className="pat-reg-grid">
        <div className="pat-reg-form-card">
          <div className="pat-reg-header">
            <Icon name="LuUserPlus" size={20} className="pat-reg-icon" />
            <div>
              <h3 className="pat-reg-title">New Patient Intake Form</h3>
              <p className="pat-reg-sub">Fill in mandatory fields (*) to register patient</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="pat-reg-form">
            <div className="pat-reg-row">
              <Input
                label="Patient Full Name *"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Kumar"
                required
              />
              <div className="pat-reg-group">
                <label className="pat-reg-label">Age *</label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Years"
                  className="pat-reg-input"
                  min="0"
                  max="120"
                  required
                />
              </div>
              <div className="pat-reg-group">
                <label className="pat-reg-label">Gender *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="pat-reg-select"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="pat-reg-row">
              <Input
                label="Mobile Number *"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                required
              />
              <div className="pat-reg-group">
                <label className="pat-reg-label">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                  className="pat-reg-select"
                >
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pat-reg-group">
                <label className="pat-reg-label">Intake Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="pat-reg-select"
                >
                  <option value="OPD">OPD Consultation</option>
                  <option value="IPD">IPD Admission</option>
                  <option value="Emergency">Emergency / Trauma</option>
                </select>
              </div>
            </div>

            <div className="pat-reg-row">
              <div className="pat-reg-group">
                <label className="pat-reg-label">Department *</label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="pat-reg-select"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Consulting Doctor"
                name="doctor"
                value={form.doctor}
                onChange={handleChange}
              />
              <Input
                label="Father / Guardian Name"
                name="guardianName"
                value={form.guardianName}
                onChange={handleChange}
                placeholder="Guardian name"
              />
            </div>

            <div className="pat-reg-row">
              <div className="pat-reg-group" style={{ gridColumn: "span 2" }}>
                <label className="pat-reg-label">Residential Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street / Area, City, State"
                  className="pat-reg-input"
                />
              </div>
              <Input
                label="Emergency Contact"
                name="emergencyContact"
                value={form.emergencyContact}
                onChange={handleChange}
                placeholder="Alternate phone"
              />
            </div>

            <div className="pat-reg-submit">
              <Button type="submit">
                <Icon name="LuCheckCircle" size={16} /> Register & Generate UHID
              </Button>
            </div>
          </form>
        </div>

        {/* UHID Card Preview */}
        <div className="pat-reg-side">
          {lastRegistered ? (
            <div className="pat-card-preview">
              <div className="pat-card-top">
                <span className="pat-card-hosp">K.G. NANDA HOSPITAL</span>
                <span className="pat-card-badge">UHID SMART CARD</span>
              </div>
              <div className="pat-card-body">
                <div className="pat-card-uhid">{lastRegistered.uhid}</div>
                <div className="pat-card-name">{lastRegistered.name}</div>
                <div className="pat-card-meta">
                  <div><strong>Age/Sex:</strong> {lastRegistered.age}Y / {lastRegistered.gender}</div>
                  <div><strong>Blood:</strong> {lastRegistered.bloodGroup}</div>
                  <div><strong>Dept:</strong> {lastRegistered.department}</div>
                  <div><strong>Mobile:</strong> {lastRegistered.phone}</div>
                </div>
              </div>
              <button
                type="button"
                className="pat-card-print"
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={14} /> Print Patient Card
              </button>
            </div>
          ) : (
            <div className="pat-reg-guide">
              <Icon name="LuCreditCard" size={32} className="pat-reg-guide-icon" />
              <h4>Instant UHID Barcode Card</h4>
              <p>
                Patient details submitted on the left will immediately generate an official hospital UHID and printable registration badge.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
