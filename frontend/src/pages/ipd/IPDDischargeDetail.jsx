import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import IPDDischargeWorkflow from "./components/IPDDischargeWorkflow.jsx";

export default function IPDDischargeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const admission = location.state?.admission;

  const handleBack = () => {
    // Prefer history back (deep-link safe), fall back to the IPD list
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/ipd/discharge");
    }
  };

  return (
    <IPDDischargeWorkflow admission={admission} onBack={handleBack} />
  );
}
