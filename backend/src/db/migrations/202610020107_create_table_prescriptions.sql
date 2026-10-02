-- migrate:up
CREATE TABLE prescriptions (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         uuid NOT NULL REFERENCES organizations(id),
    facility_id             uuid NOT NULL REFERENCES facilities(id),
    prescription_no         text NOT NULL,
    patient_id              uuid NOT NULL REFERENCES patients(id),
    encounter_id            uuid NOT NULL REFERENCES encounters(id),
    prescriber_id           uuid NOT NULL REFERENCES practitioners(id),
    status                  text NOT NULL DEFAULT 'active'
                            CHECK (status IN ('draft','active','partially_dispensed','dispensed','completed','cancelled','expired')),
    prescribed_at           timestamptz NOT NULL DEFAULT now(),
    valid_until             date,
    is_discharge_prescription boolean NOT NULL DEFAULT false,
    diagnosis_summary       text,
    advice                  text,
    follow_up_date          date,
    notes                   text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, prescription_no)
);
CREATE INDEX idx_prescriptions_enc ON prescriptions (encounter_id);
CREATE INDEX idx_prescriptions_pat ON prescriptions (patient_id, prescribed_at DESC);

-- migrate:down
-- TODO: add drop statements
