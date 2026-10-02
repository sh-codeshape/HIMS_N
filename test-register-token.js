async function test() {
  try {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNWY5YTYyNS0wYmY2LTRkYjYtYjNkZS05NTRlMzVjMTFkMjAiLCJvcmdhbml6YXRpb25JZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImlhdCI6MTc5MDk3MTA0NiwiZXhwIjoxNzkxMDU3NDQ2fQ.ZdGU5RMC1jQUUKHWcC7iBaSfIwxVjCCt9uCnE3NBdz4";
    
    console.log("Creating patient...");
    const pResp = await fetch('http://localhost:3000/api/v1/patients', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: "Test",
        last_name: "Patient",
        gender: "male",
        date_of_birth: "1990-01-01",
        phone: "9876543210"
      })
    });
    
    const pData = await pResp.json();
    console.log("Patient response:", pData);
    
    if (!pData.success) {
      console.log("Failed to create patient");
      return;
    }
    
    const patientId = pData.data.id;

    console.log("\nIssuing Token...");
    const tResp = await fetch('http://localhost:3000/api/v1/opd/tokens', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient_id: patientId,
        facility_id: "00000000-0000-0000-0000-000000000000",
        referred_by: "Dr. Test",
        chief_complaint: "Headache"
      })
    });
    
    const tData = await tResp.json();
    console.log("Token response:", tData);
  } catch (err) {
    console.error(err);
  }
}

test();
