-- migrate:up
CREATE TABLE patient_allergies (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen_type   text NOT NULL CHECK (allergen_type IN ('drug','food','environment','latex','other')),
    allergen_name   text NOT NULL,
    medical_code_id uuid REFERENCES medical_codes(id),
    reaction        text,
    severity        text CHECK (severity IN ('mild','moderate','severe','life_threatening')),
    status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','resolved','entered_in_error')),
    onset_date      date,
    is_verified     boolean NOT NULL DEFAULT false,
    notes           text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_patient_allergies ON patient_allergies (patient_id, status);

-- migrate:down
-- TODO: add drop statements
