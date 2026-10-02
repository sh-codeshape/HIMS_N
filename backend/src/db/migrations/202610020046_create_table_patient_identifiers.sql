-- migrate:up
CREATE TABLE patient_identifiers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    patient_id      uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    id_type         text NOT NULL CHECK (id_type IN ('abha_number','abha_address','aadhaar_token','pan','passport',
                                                     'driving_licence','voter_id','ration_card','external_mrn','other')),
    id_value        text NOT NULL,
    id_value_hash   text,
    issuer          text,
    valid_to        date,
    is_verified     boolean NOT NULL DEFAULT false,
    verified_at     timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, id_type, id_value)
);
CREATE INDEX idx_patient_identifiers_patient ON patient_identifiers (patient_id);

-- migrate:down
-- TODO: add drop statements
