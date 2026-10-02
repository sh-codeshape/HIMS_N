-- migrate:up
CREATE TABLE diagnoses (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id        uuid NOT NULL REFERENCES organizations(id),
    patient_id             uuid NOT NULL REFERENCES patients(id),
    encounter_id           uuid NOT NULL REFERENCES encounters(id),
    medical_code_id        uuid REFERENCES medical_codes(id),  -- ICD-10 etc. (free text allowed)
    description            text NOT NULL,
    diagnosis_type         text NOT NULL DEFAULT 'provisional'
                           CHECK (diagnosis_type IN ('provisional','differential','final','admitting','discharge',
                                                     'complication','cause_of_death')),
    rank                   smallint NOT NULL DEFAULT 1,       -- 1 = principal
    diagnosed_by_practitioner_id uuid REFERENCES practitioners(id),
    diagnosed_at           timestamptz NOT NULL DEFAULT now(),
    status                 text NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','ruled_out','entered_in_error')),
    notes                  text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_diagnoses_encounter ON diagnoses (encounter_id);
CREATE INDEX idx_diagnoses_patient   ON diagnoses (patient_id, diagnosed_at DESC);

-- Problem list, past medical/surgical/family/social history

-- migrate:down
-- TODO: add drop statements
