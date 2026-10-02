#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/v1"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNWY5YTYyNS0wYmY2LTRkYjYtYjNkZS05NTRlMzVjMTFkMjAiLCJvcmdhbml6YXRpb25JZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImlhdCI6MTc5MDk3MTA0NiwiZXhwIjoxNzkxMDU3NDQ2fQ.ZdGU5RMC1jQUUKHWcC7iBaSfIwxVjCCt9uCnE3NBdz4"

echo "----------------------------------------"
echo "1. Registering a new Patient"
echo "----------------------------------------"

PATIENT_PAYLOAD=$(cat <<EOF
{
  "facility_id": "00000000-0000-0000-0000-000000000000",
  "first_name": "Test",
  "last_name": "Patient",
  "gender": "male",
  "date_of_birth": "1990-01-01",
  "phone": "999999999$(($RANDOM % 9))",
  "blood_group": "O+",
  "marital_status": "single",
  "address_line1": "123 Test St",
  "city": "Test City",
  "state": "TS",
  "postal_code": "123456",
  "country": "IN",
  "emergency_name": "Emergency Test",
  "emergency_phone": "8888888888",
  "emergency_relation": "Sibling"
}
EOF
)

PATIENT_RES=$(curl -s -X POST "$API_URL/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PATIENT_PAYLOAD")

echo "RAW RESPONSE:"
echo "$PATIENT_RES"
echo "----------------------------------------"
echo "$PATIENT_RES" | jq .

# Extract the patient ID
PATIENT_ID=$(echo "$PATIENT_RES" | jq -r '.data.id')
FACILITY_ID="00000000-0000-0000-0000-000000000000"

if [ "$PATIENT_ID" == "null" ] || [ -z "$PATIENT_ID" ]; then
  echo "Failed to create patient. Exiting."
  exit 1
fi

echo -e "\n----------------------------------------"
echo "2. Creating an OPD Token for the Patient"
echo "----------------------------------------"

OPD_PAYLOAD=$(cat <<EOF
{
  "patient_id": "$PATIENT_ID",
  "facility_id": "$FACILITY_ID",
  "referred_by": "Dr. Test Doctor",
  "chief_complaint": "Headache and fever"
}
EOF
)

OPD_RES=$(curl -s -X POST "$API_URL/opd/tokens" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$OPD_PAYLOAD")

echo "$OPD_RES" | jq .

echo -e "\n----------------------------------------"
echo "3. Admitting the Patient to IPD"
echo "----------------------------------------"

IPD_PAYLOAD=$(cat <<EOF
{
  "patient_id": "$PATIENT_ID",
  "facility_id": "$FACILITY_ID",
  "referred_by": "Dr. Test Admitting Doctor",
  "admission_type": "elective",
  "reason_for_admission": "Observation"
}
EOF
)

IPD_RES=$(curl -s -X POST "$API_URL/ipd/admissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$IPD_PAYLOAD")

echo "$IPD_RES" | jq .
