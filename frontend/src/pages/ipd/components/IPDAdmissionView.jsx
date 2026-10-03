import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Button from "../../../components/common/Button.jsx";
import ipdService from "../../../api/services/ipdService";
import patientService from "../../../api/services/patientService";

export default function IPDAdmissionView() {
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [selectedUhid, setSelectedUhid] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchText, setPatientSearchText] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedBed, setSelectedBed] = useState("");
  const [doctor, setDoctor] = useState("Dr. Rajesh Sharma");
  const [admitReason, setAdmitReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsData, bedsData] = await Promise.all([
          patientService.search(),
          ipdService.getBedMatrix()
        ]);

        const mappedPatients = patientsData.map(p => ({
          id: p.id,
          uhid: p.uhid,
          name: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient",
          age: p.age ?? (p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth).getTime()) / 3.15576e+10) : 0),
          gender: p.gender,
          bloodGroup: p.blood_group || "Unknown"
        }));

        const mappedBeds = bedsData.map(b => ({
          id: b.id,
          bedNo: b.bed_no,
          ward: b.ward_name,
          floor: b.room_name ? `Room ${b.room_name}` : "General",
          status: b.current_status
        }));

        setPatients(mappedPatients);
        setBeds(mappedBeds);
      } catch (err) {
        toast.error("Failed to load admission data");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = patientSearchText.trim();
      if (!q) {
        setPatientSearchResults([]);
        setShowPatientSearch(false);
        return;
      }

      try {
        setIsSearchingPatients(true);
        const results = await patientService.search({ query: q });
        setPatientSearchResults(results.slice(0, 8));
        setShowPatientSearch(true);
      } catch (err) {
        setPatientSearchResults([]);
      } finally {
        setIsSearchingPatients(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [patientSearchText]);

  const availableBeds = beds.filter((b) => b.status === "Available");

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!selectedUhid || !selectedBed) {
      toast.error("Please select both a patient and an available bed.");
      return;
    }

    const patient = patients.find((p) => p.uhid === selectedUhid) || selectedPatient;
    const bed = beds.find((b) => b.id === selectedBed);

    try {
      await ipdService.admitPatient({
        patient_id: patient.id,
        bed_id: bed.id,
        facility_id: "00000000-0000-0000-0000-000000000000",
        department_id: null,
        admitting_practitioner_id: null,
        admission_type: "elective",
        reason_for_admission: admitReason
      });

      setBeds(prev => prev.map(b => b.id === bed.id ? { ...b, status: "Occupied" } : b));
      toast.success(`IPD Admission created for ${patient.name} on ${bed.bedNo}!`, { icon: "🏥" });
      setSelectedUhid("");
      setSelectedPatient(null);
      setPatientSearchText("");
      setSelectedBed("");
      setAdmitReason("");
    } catch (err) {
      toast.error("Failed to admit patient");
    }
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
        <div style={{ position: "relative" }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
            Search Registered Patient *
          </label>
          <input
            type="text"
            value={patientSearchText}
            placeholder="Type patient name, UHID, or phone..."
            onChange={(e) => {
              setPatientSearchText(e.target.value);
              if (selectedPatient) setSelectedPatient(null);
              setSelectedUhid("");
            }}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13.5 }}
            required
          />
          {selectedPatient && (
            <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: 13 }}>
              Selected: <strong>{selectedPatient.name}</strong> ({selectedPatient.uhid})
            </div>
          )}
          {showPatientSearch && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, zIndex: 10, boxShadow: "0 8px 20px rgba(15,23,42,0.08)", maxHeight: 220, overflowY: "auto", marginTop: 6 }}>
              {isSearchingPatients ? <div style={{ padding: "8px 12px", color: "#64748b", fontSize: 12 }}>Searching...</div> : patientSearchResults.length > 0 ? patientSearchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    const patientEntry = {
                      id: p.id,
                      uhid: p.uhid,
                      name: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient",
                      age: p.age ?? (p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth).getTime()) / 3.15576e+10) : 0),
                      gender: p.gender,
                      bloodGroup: p.blood_group || "Unknown"
                    };
                    setSelectedPatient(patientEntry);
                    setSelectedUhid(p.uhid);
                    setPatientSearchText(`${patientEntry.name} (${p.uhid})`);
                    setShowPatientSearch(false);
                  }}
                  style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eef2f7", fontSize: 13 }}
                >
                  <strong>{p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient"}</strong> ({p.uhid}) • {p.blood_group || "Unknown"} • Age: {p.age ?? (p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth).getTime()) / 3.15576e+10) : 0)}Y
                </div>
              )) : <div style={{ padding: "8px 12px", color: "#64748b", fontSize: 12 }}>No patient found</div>}
            </div>
          )}
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
                <option key={b.id} value={b.id}>
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
