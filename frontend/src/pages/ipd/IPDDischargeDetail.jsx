import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import IPDDischargeWorkflow from "./components/IPDDischargeWorkflow.jsx";
import ipdService from "../../api/services/ipdService";

export default function IPDDischargeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [admission, setAdmission] = useState(location.state?.admission || null);
  const [loading, setLoading] = useState(!location.state?.admission && !!id);

  useEffect(() => {
    if (!admission && id) {
      setLoading(true);
      ipdService
        .getAdmissions()
        .then((data) => {
          const list = Array.isArray(data) ? data : (data?.data || []);
          const found = list.find((a) => String(a.id) === String(id) || String(a.admission_no) === String(id));
          if (found) {
            setAdmission(found);
          }
        })
        .catch((err) => {
          console.error("Error fetching admission details for discharge workflow:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, admission]);

  const handleBack = () => {
    // Prefer history back (deep-link safe), fall back to the IPD list
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/ipd/discharge");
    }
  };

  if (loading) {
    return (
      <div className="ipd-workflow-page-container" style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ color: "#0284c7", fontWeight: 700, fontSize: "15px" }}>
          Loading Inpatient Admission Details…
        </div>
      </div>
    );
  }

  return (
    <IPDDischargeWorkflow admission={admission} onBack={handleBack} />
  );
}

