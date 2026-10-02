-- migrate:up
CREATE TABLE patient_addresses (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    address_type  text NOT NULL DEFAULT 'home' CHECK (address_type IN ('home','work','temporary','billing')),
    line1         text,
    line2         text,
    city          text,
    district      text,
    state         text,
    state_code    text,
    postal_code   text,
    country       char(2) NOT NULL DEFAULT 'IN',
    is_primary    boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_patient_addresses_patient ON patient_addresses (patient_id);

-- migrate:down
-- TODO: add drop statements
