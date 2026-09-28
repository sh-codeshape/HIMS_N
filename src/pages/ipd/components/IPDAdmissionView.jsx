import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Button from "../../../components/common/Button.jsx";
import { mockStore } from "../../../mock/mockStore";

export default function IPDAdmissionView() {
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedUhid, setSelectedUhid] = useState("");
  const [selectedBed, setSelectedBed] = useState("");
  const [doctor, setDoctor] = useState("Dr. Rajesh Sharma");
  const [admitReason, setAdmitReason] = useState("");

  useEffect(() => {
    setPatients(mockStore.getPatients());
    setBeds(mockStore.getBeds());
  }, []);

  const availableBeds = beds.filter((b) => b.status === "Available");

  const handleAdmit = (e) => {
    e.preventDefault();
    if (!selectedUhid || !selectedBed) {
      toast.error("Please select both a patient and an available bed.");
      return;
    }

    const patient = patients.find((p) => p.uhid === selectedUhid);
    mockStore.updateBedStatus(selectedBed, {
      status: "Occupied",
      patient: `${patient.name} (${patient.age}${patient.gender?.[0] || "M"})`,
      doctor: doctor,
      admittedDate: new Date().toISOString().slice(0, 10),
    });

    setBeds(mockStore.getBeds());
    toast.success(`IPD Admission created for ${patient.name} on ${selectedBed}!`, { icon: "🏥" });
    setSelectedUhid("");
    setSelectedBed("");
    setAdmitReason("");
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0", maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, borderBottom: "1px solid #f1f5f9", paddingBottom: 14 }}>
        <Icon name="LuBedDouble" size={22} className="text-blue-600" />
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>IPD Patient Admission & Bed Allotment</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>Formal inpatient hospital admission form</p>
        </div>
      </div>

      <form onSubmit={handleAdmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
            Select Registered Patient *
          </label>
          <select
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13.5 }}
            value={selectedUhid}
            onChange={(e) => setSelectedUhid(e.target.value)}
            required
          >
            <option value="">-- Choose Patient by Name / UHID --</option>
            {patients.map((p) => (
              <option key={p.uhid} value={p.uhid}>
                {p.name} ({p.uhid}) • {p.bloodGroup} • Age: {p.age}Y
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Select Available Bed *
            </label>
            <select
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13.5 }}
              value={selectedBed}
              onChange={(e) => setSelectedBed(e.target.value)}
              required
            >
              <option value="">-- Choose Vacant Bed --</option>
              {availableBeds.map((b) => (
                <option key={b.id} value={b.bedNo}>
                  {b.bedNo} ({b.ward} - {b.floor})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Primary Consultant Doctor *
            </label>
            <select
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13.5 }}
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
            >
              <option value="Dr. Rajesh Sharma">Dr. Rajesh Sharma (Gen Surgery)</option>
              <option value="Dr. Priya Deshmukh">Dr. Priya Deshmukh (Cardiology)</option>
              <option value="Dr. Anand Kulkarni">Dr. Anand Kulkarni (Orthopedics)</option>
              <option value="Dr. Meenakshi Iyer">Dr. Meenakshi Iyer (Gynecology)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
            Admission Diagnosis / Clinical Indication
          </label>
          <input
            type="text"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13.5 }}
            placeholder="e.g. Acute Appendicitis scheduled for laparoscopic surgery"
            value={admitReason}
            onChange={(e) => setAdmitReason(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <Button type="submit">
            <Icon name="LuCheckCircle" size={16} /> Complete Admission & Generate IPD Tag
          </Button>
        </div>
      </form>
    </div>
  );
}
