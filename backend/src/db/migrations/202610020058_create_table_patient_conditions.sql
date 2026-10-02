-- migrate:up
CREATE TABLE patient_conditions (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id               uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medical_code_id          uuid REFERENCES medical_codes(id),
    description              text NOT NULL,
    category                 text NOT NULL DEFAULT 'problem_list'
                             CHECK (category IN ('problem_list','past_medical','past_surgical','family','social')),
    clinical_status          text NOT NULL DEFAULT 'active'
                             CHECK (clinical_status IN ('active','recurrence','relapse','inactive','remission','resolved')),
    family_relationship      text,                             -- when category = 'family'
    onset_date               date,
    resolved_date            date,
    recorded_in_encounter_id uuid REFERENCES encounters(id),
    notes                    text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_patient_conditions ON patient_conditions (patient_id, category);

-- migrate:down
-- TODO: add drop statements
