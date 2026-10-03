-- migrate:up
ALTER TABLE encounters DROP CONSTRAINT encounters_patient_id_fkey;
ALTER TABLE encounters ADD CONSTRAINT encounters_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- migrate:down
ALTER TABLE encounters DROP CONSTRAINT encounters_patient_id_fkey;
ALTER TABLE encounters ADD CONSTRAINT encounters_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);
