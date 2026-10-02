import React, { useState, useEffect } from "react";
import Icon from "../../../components/common/Icon.jsx";
import { toast } from "react-hot-toast";
import patientService from "../../../api/services/patientService";
import "./PatientDirectoryTable.css";

export default function PatientDirectoryTable() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await patientService.getAll();
        const mapped = data.map(p => {
          const age = p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth).getTime()) / 3.15576e+10) : 0;
          return {
            id: p.id,
            uhid: p.uhid,
            name: p.full_name,
            age,
            gender: p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "Unknown",
            bloodGroup: p.blood_group || "—",
            phone: p.phone,
            registeredAt: new Date(p.created_at).toLocaleDateString(),
            doctor: "—",
            department: "—",
            category: "—"
          };
        });
        setPatients(mapped);
      } catch (error) {
        toast.error("Failed to fetch patients");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const departments = ["All", ...new Set(patients.map((p) => p.department).filter(Boolean))];

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.uhid?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search);
    const matchesDept = filterDept === "All" || p.department === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="pat-dir-mod">
      <div className="pat-dir-header">
        <div className="pat-dir-search">
          <Icon name="LuSearch" size={16} />
          <input
            type="text"
            placeholder="Search by UHID, Name, Mobile, Blood Group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pat-dir-filters">
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              className={`pat-dir-chip ${filterDept === dept ? "pat-dir-chip--active" : ""}`}
              onClick={() => setFilterDept(dept)}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="pat-dir-table-wrap">
        <table className="pat-dir-table">
          <thead>
            <tr>
              <th>UHID</th>
              <th>Patient Name</th>
              <th>Demographics</th>
              <th>Contact & City</th>
              <th>Attending Doctor & Dept</th>
              <th>Category</th>
              <th>Vitals Summary</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{textAlign:"center", padding:"20px"}}>Loading...</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.uhid}>
                <td>
                  <span className="pat-dir-uhid">{p.uhid}</span>
                </td>
                <td>
                  <div className="pat-dir-name">{p.name}</div>
                  <div className="pat-dir-meta">Reg: {p.registeredAt}</div>
                </td>
                <td>
                  <div className="pat-dir-name">{p.age} Y / {p.gender}</div>
                  <div className="pat-dir-meta">Blood: <strong>{p.bloodGroup || "—"}</strong></div>
                </td>
                <td>
                  <div className="pat-dir-name">{p.phone}</div>
                  <div className="pat-dir-meta">{p.address || "Jaipur, RJ"}</div>
                </td>
                <td>
                  <div className="pat-dir-name">{p.doctor || "Dr. Rajesh Sharma"}</div>
                  <div className="pat-dir-meta">{p.department}</div>
                </td>
                <td>
                  <span className={`pat-dir-pill pat-dir-pill--${(p.category || "OPD").toLowerCase()}`}>
                    {p.category || "OPD"}
                  </span>
                </td>
                <td>
                  {p.vitals ? (
                    <span className="pat-dir-vitals">
                      BP: {p.vitals.bp} • SpO2: {p.vitals.spo2}
                    </span>
                  ) : (
                    <span className="pat-dir-meta">BP: 120/80</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="pat-dir-btn-emr"
                    onClick={() => setSelectedPatient(p)}
                  >
                    <Icon name="LuEye" size={14} /> View EMR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Patient EMR Modal */}
      {selectedPatient && (
        <div className="pat-dir-modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="pat-dir-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pat-dir-modal-head">
              <div>
                <h2>{selectedPatient.name} ({selectedPatient.uhid})</h2>
                <p>{selectedPatient.age} Y • {selectedPatient.gender} • Blood: {selectedPatient.bloodGroup}</p>
              </div>
              <button
                type="button"
                className="pat-dir-modal-close"
                onClick={() => setSelectedPatient(null)}
              >
                ✕
              </button>
            </div>

            <div className="pat-dir-emr-grid">
              <div className="pat-dir-emr-panel">
                <h4>🩺 Latest Recorded Vitals</h4>
                <div className="pat-dir-emr-list">
                  <div><strong>Blood Pressure:</strong> {selectedPatient.vitals?.bp || "120/80 mmHg"}</div>
                  <div><strong>Pulse Rate:</strong> {selectedPatient.vitals?.pulse || "76 bpm"}</div>
                  <div><strong>Temperature:</strong> {selectedPatient.vitals?.temp || "98.6 °F"}</div>
                  <div><strong>Oxygen SpO2:</strong> {selectedPatient.vitals?.spo2 || "99%"}</div>
                  <div><strong>Weight:</strong> {selectedPatient.vitals?.weight || "68 kg"}</div>
                </div>
              </div>

              <div className="pat-dir-emr-panel">
                <h4>🏥 Hospital Admission / Consultation</h4>
                <div className="pat-dir-emr-list">
                  <div><strong>Category:</strong> {selectedPatient.category}</div>
                  <div><strong>Department:</strong> {selectedPatient.department}</div>
                  <div><strong>Doctor:</strong> {selectedPatient.doctor}</div>
                  <div><strong>Guardian:</strong> {selectedPatient.guardianName || "N/A"}</div>
                  <div><strong>Address:</strong> {selectedPatient.address}</div>
                </div>
              </div>
            </div>

            <div className="pat-dir-modal-footer">
              <button
                type="button"
                className="pat-dir-btn-print"
                onClick={() => window.print()}
              >
                <Icon name="LuPrinter" size={15} /> Print Medical Summary
              </button>
              <button
                type="button"
                className="pat-dir-btn-dismiss"
                onClick={() => setSelectedPatient(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
