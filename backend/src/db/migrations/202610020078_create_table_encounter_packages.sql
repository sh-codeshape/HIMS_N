-- migrate:up
CREATE TABLE encounter_packages (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id   uuid NOT NULL REFERENCES encounters(id),
    patient_id     uuid NOT NULL REFERENCES patients(id),
    package_id     uuid NOT NULL REFERENCES packages(id),
    package_price  numeric(14,2) NOT NULL CHECK (package_price >= 0),
    status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
    started_at     timestamptz NOT NULL DEFAULT now(),
    ended_at       timestamptz,
    notes          text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_encounter_packages_enc ON encounter_packages (encounter_id);

-- CHARGES: every billable event lands here first, from any module
-- (consultation, lab order, bed-day, pharmacy dispense, surgery, manual entry).

-- migrate:down
-- TODO: add drop statements
