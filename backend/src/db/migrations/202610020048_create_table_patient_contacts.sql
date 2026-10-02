-- migrate:up
CREATE TABLE patient_contacts (       -- next of kin, guardian, emergency contact
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name          text NOT NULL,
    relationship  text,
    phone         text,
    email         citext,
    address       text,
    is_emergency_contact boolean NOT NULL DEFAULT false,
    is_guardian   boolean NOT NULL DEFAULT false,
    is_primary    boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_patient_contacts_patient ON patient_contacts (patient_id);

-- migrate:down
-- TODO: add drop statements
