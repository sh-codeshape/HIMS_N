const axios = require('axios');

async function test() {
  try {
    // We'll use the token from the user's prompt
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNWY5YTYyNS0wYmY2LTRkYjYtYjNkZS05NTRlMzVjMTFkMjAiLCJvcmdhbml6YXRpb25JZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImlhdCI6MTc5MDk3MTA0NiwiZXhwIjoxNzkxMDU3NDQ2fQ.ZdGU5RMC1jQUUKHWcC7iBaSfIwxVjCCt9uCnE3NBdz4";
    
    // First, let's get a patient
    const pResp = await axios.get('http://localhost:3000/api/v1/patients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const patientId = pResp.data.data[0]?.id || "00000000-0000-0000-0000-000000000001";
    console.log("Patient ID:", patientId);

    const payload = {
      patient_id: patientId,
      facility_id: "00000000-0000-0000-0000-000000000000",
      referred_by: "Dr. Test",
      chief_complaint: "Headache"
    };

    const resp = await axios.post('http://localhost:3000/api/v1/opd/tokens', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(resp.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

test();
