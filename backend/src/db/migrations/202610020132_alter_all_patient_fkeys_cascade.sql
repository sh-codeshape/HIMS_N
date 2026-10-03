-- migrate:up
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE observations DROP CONSTRAINT IF EXISTS observations_patient_id_fkey;
ALTER TABLE observations ADD CONSTRAINT observations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE diagnoses DROP CONSTRAINT IF EXISTS diagnoses_patient_id_fkey;
ALTER TABLE diagnoses ADD CONSTRAINT diagnoses_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE clinical_notes DROP CONSTRAINT IF EXISTS clinical_notes_patient_id_fkey;
ALTER TABLE clinical_notes ADD CONSTRAINT clinical_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE form_submissions DROP CONSTRAINT IF EXISTS form_submissions_patient_id_fkey;
ALTER TABLE form_submissions ADD CONSTRAINT form_submissions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE encounter_packages DROP CONSTRAINT IF EXISTS encounter_packages_patient_id_fkey;
ALTER TABLE encounter_packages ADD CONSTRAINT encounter_packages_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE charges DROP CONSTRAINT IF EXISTS charges_patient_id_fkey;
ALTER TABLE charges ADD CONSTRAINT charges_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_patient_id_fkey;
ALTER TABLE invoices ADD CONSTRAINT invoices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_patient_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE credit_notes DROP CONSTRAINT IF EXISTS credit_notes_patient_id_fkey;
ALTER TABLE credit_notes ADD CONSTRAINT credit_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE preauthorizations DROP CONSTRAINT IF EXISTS preauthorizations_patient_id_fkey;
ALTER TABLE preauthorizations ADD CONSTRAINT preauthorizations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE insurance_claims DROP CONSTRAINT IF EXISTS insurance_claims_patient_id_fkey;
ALTER TABLE insurance_claims ADD CONSTRAINT insurance_claims_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_patient_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE lab_specimens DROP CONSTRAINT IF EXISTS lab_specimens_patient_id_fkey;
ALTER TABLE lab_specimens ADD CONSTRAINT lab_specimens_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_patient_id_fkey;
ALTER TABLE prescriptions ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE medication_administrations DROP CONSTRAINT IF EXISTS medication_administrations_patient_id_fkey;
ALTER TABLE medication_administrations ADD CONSTRAINT medication_administrations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE dispensations DROP CONSTRAINT IF EXISTS dispensations_patient_id_fkey;
ALTER TABLE dispensations ADD CONSTRAINT dispensations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE admissions DROP CONSTRAINT IF EXISTS admissions_patient_id_fkey;
ALTER TABLE admissions ADD CONSTRAINT admissions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE discharge_summaries DROP CONSTRAINT IF EXISTS discharge_summaries_patient_id_fkey;
ALTER TABLE discharge_summaries ADD CONSTRAINT discharge_summaries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE surgeries DROP CONSTRAINT IF EXISTS surgeries_patient_id_fkey;
ALTER TABLE surgeries ADD CONSTRAINT surgeries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE diet_orders DROP CONSTRAINT IF EXISTS diet_orders_patient_id_fkey;
ALTER TABLE diet_orders ADD CONSTRAINT diet_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE blood_donors DROP CONSTRAINT IF EXISTS blood_donors_patient_id_fkey;
ALTER TABLE blood_donors ADD CONSTRAINT blood_donors_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE blood_requests DROP CONSTRAINT IF EXISTS blood_requests_patient_id_fkey;
ALTER TABLE blood_requests ADD CONSTRAINT blood_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE ambulance_trips DROP CONSTRAINT IF EXISTS ambulance_trips_patient_id_fkey;
ALTER TABLE ambulance_trips ADD CONSTRAINT ambulance_trips_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_patient_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;


-- migrate:down
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE observations DROP CONSTRAINT IF EXISTS observations_patient_id_fkey;
ALTER TABLE observations ADD CONSTRAINT observations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE diagnoses DROP CONSTRAINT IF EXISTS diagnoses_patient_id_fkey;
ALTER TABLE diagnoses ADD CONSTRAINT diagnoses_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE clinical_notes DROP CONSTRAINT IF EXISTS clinical_notes_patient_id_fkey;
ALTER TABLE clinical_notes ADD CONSTRAINT clinical_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE form_submissions DROP CONSTRAINT IF EXISTS form_submissions_patient_id_fkey;
ALTER TABLE form_submissions ADD CONSTRAINT form_submissions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE encounter_packages DROP CONSTRAINT IF EXISTS encounter_packages_patient_id_fkey;
ALTER TABLE encounter_packages ADD CONSTRAINT encounter_packages_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE charges DROP CONSTRAINT IF EXISTS charges_patient_id_fkey;
ALTER TABLE charges ADD CONSTRAINT charges_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_patient_id_fkey;
ALTER TABLE invoices ADD CONSTRAINT invoices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_patient_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE credit_notes DROP CONSTRAINT IF EXISTS credit_notes_patient_id_fkey;
ALTER TABLE credit_notes ADD CONSTRAINT credit_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE preauthorizations DROP CONSTRAINT IF EXISTS preauthorizations_patient_id_fkey;
ALTER TABLE preauthorizations ADD CONSTRAINT preauthorizations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE insurance_claims DROP CONSTRAINT IF EXISTS insurance_claims_patient_id_fkey;
ALTER TABLE insurance_claims ADD CONSTRAINT insurance_claims_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_patient_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE lab_specimens DROP CONSTRAINT IF EXISTS lab_specimens_patient_id_fkey;
ALTER TABLE lab_specimens ADD CONSTRAINT lab_specimens_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_patient_id_fkey;
ALTER TABLE prescriptions ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE medication_administrations DROP CONSTRAINT IF EXISTS medication_administrations_patient_id_fkey;
ALTER TABLE medication_administrations ADD CONSTRAINT medication_administrations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE dispensations DROP CONSTRAINT IF EXISTS dispensations_patient_id_fkey;
ALTER TABLE dispensations ADD CONSTRAINT dispensations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE admissions DROP CONSTRAINT IF EXISTS admissions_patient_id_fkey;
ALTER TABLE admissions ADD CONSTRAINT admissions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE discharge_summaries DROP CONSTRAINT IF EXISTS discharge_summaries_patient_id_fkey;
ALTER TABLE discharge_summaries ADD CONSTRAINT discharge_summaries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE surgeries DROP CONSTRAINT IF EXISTS surgeries_patient_id_fkey;
ALTER TABLE surgeries ADD CONSTRAINT surgeries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE diet_orders DROP CONSTRAINT IF EXISTS diet_orders_patient_id_fkey;
ALTER TABLE diet_orders ADD CONSTRAINT diet_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE blood_donors DROP CONSTRAINT IF EXISTS blood_donors_patient_id_fkey;
ALTER TABLE blood_donors ADD CONSTRAINT blood_donors_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE blood_requests DROP CONSTRAINT IF EXISTS blood_requests_patient_id_fkey;
ALTER TABLE blood_requests ADD CONSTRAINT blood_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE ambulance_trips DROP CONSTRAINT IF EXISTS ambulance_trips_patient_id_fkey;
ALTER TABLE ambulance_trips ADD CONSTRAINT ambulance_trips_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_patient_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);
