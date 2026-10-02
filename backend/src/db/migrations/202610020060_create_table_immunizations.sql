-- migrate:up
CREATE TABLE immunizations (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id       uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id     uuid REFERENCES encounters(id),
    vaccine_name     text NOT NULL,
    medical_code_id  uuid REFERENCES medical_codes(id),
    dose_number      smallint,
    lot_number       text,
    expiry_date      date,
    administered_at  timestamptz NOT NULL DEFAULT now(),
    administered_by_staff_id uuid REFERENCES staff(id),
    site             text,
    route            text,
    next_due_date    date,
    status           text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','not_done','entered_in_error')),
    notes            text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_immunizations_patient ON immunizations (patient_id, administered_at DESC);

-- SOAP notes, progress notes, nursing notes, operative notes, handover ...

-- migrate:down
-- TODO: add drop statements
