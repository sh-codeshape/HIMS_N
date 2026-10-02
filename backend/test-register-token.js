const axios = require('axios');

async function test() {
  try {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNWY5YTYyNS0wYmY2LTRkYjYtYjNkZS05NTRlMzVjMTFkMjAiLCJvcmdhbml6YXRpb25JZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImlhdCI6MTc5MDk3MTA0NiwiZXhwIjoxNzkxMDU3NDQ2fQ.ZdGU5RMC1jQUUKHWcC7iBaSfIwxVjCCt9uCnE3NBdz4";
    
    // Create patient
    console.log("Creating patient...");
    const pResp = await axios.post('http://localhost:3000/api/v1/patients', {
      first_name: "Test",
      last_name: "Patient",
      gender: "male",
      date_of_birth: "1990-01-01",
      phone: "9876543210"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Created patient:", pResp.data);
    const patientId = pResp.data.data.id;

    // Issue Token
    console.log("\nIssuing Token...");
    const payload = {
      patient_id: patientId,
      facility_id: "00000000-0000-0000-0000-000000000000",
      referred_by: "Dr. Test",
      chief_complaint: "Headache"
    };

    const tResp = await axios.post('http://localhost:3000/api/v1/opd/tokens', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(tResp.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

test();
