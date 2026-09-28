import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Icon from "../../../components/common/Icon.jsx";
import Button from "../../../components/common/Button.jsx";
import { mockStore } from "../../../mock/mockStore";
import "./LabTestOrderView.css";

const POPULAR_TESTS = [
  { name: "Complete Blood Count (CBC)", dept: "Hematology", price: 350 },
  { name: "Liver Function Test (LFT)", dept: "Biochemistry", price: 750 },
  { name: "Kidney Function Test (KFT)", dept: "Biochemistry", price: 650 },
  { name: "Lipid Profile (Cholesterol)", dept: "Biochemistry", price: 600 },
  { name: "Thyroid Profile (T3, T4, TSH)", dept: "Endocrinology", price: 550 },
  { name: "Urine Routine & Microscopic", dept: "Clinical Pathology", price: 200 },
  { name: "Blood Glucose (Fasting & PP)", dept: "Biochemistry", price: 150 },
  { name: "HbA1c Glycated Hemoglobin", dept: "Biochemistry", price: 450 },
  { name: "Dengue NS1 Antigen + IgM/IgG", dept: "Serology", price: 900 },
];

export default function LabTestOrderView() {
  const [patients, setPatients] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [selectedUhid, setSelectedUhid] = useState("");
  const [selectedTests, setSelectedTests] = useState(["Complete Blood Count (CBC)"]);
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    setPatients(mockStore.getPatients());
    setLabTests(mockStore.getLabTests());
  }, []);

  const handleToggleTest = (testName) => {
    if (selectedTests.includes(testName)) {
      setSelectedTests(selectedTests.filter((t) => t !== testName));
    } else {
      setSelectedTests([...selectedTests, testName]);
    }
  };

  const handleOrder = (e) => {
    e.preventDefault();
    if (!selectedUhid) {
      toast.error("Please select a patient for laboratory investigation.");
      return;
    }
    if (selectedTests.length === 0) {
      toast.error("Please select at least one laboratory test.");
      return;
    }

    const patient = patients.find((p) => p.uhid === selectedUhid);
    selectedTests.forEach((testName) => {
      const testObj = POPULAR_TESTS.find((t) => t.name === testName);
      mockStore.addLabTest({
        patientName: patient.name,
        testName: testName,
        department: testObj?.dept || "General Pathology",
        status: urgent ? "Urgent / Sample Pending" : "Sample Pending",
      });
    });

    setLabTests(mockStore.getLabTests());
    toast.success(`Lab Order created for ${patient.name}!`, { icon: "🧪" });
    setSelectedTests(["Complete Blood Count (CBC)"]);
    setUrgent(false);
  };

  const handleUpdateSample = (orderId) => {
    const updated = mockStore.updateLabResult(
      orderId,
      "Within Normal Limits (Automated Analyzer Verified)",
      "Completed"
    );
    setLabTests(updated);
    toast.success(`Report result entered and published for ${orderId}!`, { icon: "✅" });
  };

  return (
    <div className="lab-mod-grid">
      {/* Lab Order Card */}
      <div className="lab-mod-card">
        <h3 className="lab-mod-title">Book Laboratory Test</h3>
        <p className="lab-mod-sub">Select patient and check investigations to order</p>

        <form onSubmit={handleOrder}>
          <div className="lab-mod-group">
            <label className="lab-mod-label">Select Patient *</label>
            <select
              className="lab-mod-select"
              value={selectedUhid}
              onChange={(e) => setSelectedUhid(e.target.value)}
              required
            >
              <option value="">-- Choose Patient by Name / UHID --</option>
              {patients.map((p) => (
                <option key={p.uhid} value={p.uhid}>
                  {p.name} ({p.uhid}) • {p.bloodGroup}
                </option>
              ))}
            </select>
          </div>

          <div className="lab-mod-group">
            <label className="lab-mod-label">Select Diagnostics & Blood Tests:</label>
            <div className="lab-mod-test-grid">
              {POPULAR_TESTS.map((test) => {
                const isChecked = selectedTests.includes(test.name);
                return (
                  <div
                    key={test.name}
                    onClick={() => handleToggleTest(test.name)}
                    className={`lab-test-box ${isChecked ? "lab-test-box--active" : ""}`}
                  >
                    <input type="checkbox" checked={isChecked} onChange={() => {}} />
                    <div>
                      <div className="lab-test-name">{test.name}</div>
                      <div className="lab-test-price">{test.dept} • ₹{test.price}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lab-mod-urgent">
            <input
              type="checkbox"
              id="urgentCheckMod"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
            />
            <label htmlFor="urgentCheckMod">Mark as STAT / Emergency High Priority</label>
          </div>

          <Button type="submit">
            <Icon name="LuTestTube" size={16} /> Place Laboratory Order ({selectedTests.length} Tests)
          </Button>
        </form>
      </div>

      {/* Live Lab Queue Card */}
      <div className="lab-mod-card">
        <div className="lab-mod-header">
          <div>
            <h3 className="lab-mod-title">Laboratory Orders Stream</h3>
            <p className="lab-mod-sub">Recent sample test queue</p>
          </div>
          <span className="lab-mod-count">{labTests.length} Total</span>
        </div>

        <div className="lab-mod-list">
          {labTests.map((t) => (
            <div key={t.id} className="lab-mod-item">
              <div>
                <div className="lab-order-id">{t.orderId}</div>
                <div className="lab-order-pname">{t.patientName}</div>
                <div className="lab-order-test">{t.testName}</div>
                <div className="lab-order-meta">
                  Ordered: {t.orderedAt} • Result: <strong>{t.result}</strong>
                </div>
              </div>

              <div className="lab-order-actions">
                <span
                  className={`lab-order-status ${
                    t.status === "Completed" ? "lab-status--done" : "lab-status--pending"
                  }`}
                >
                  {t.status}
                </span>
                {t.status !== "Completed" && (
                  <button
                    type="button"
                    className="lab-btn-result"
                    onClick={() => handleUpdateSample(t.orderId)}
                  >
                    Enter Result
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
