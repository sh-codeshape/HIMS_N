-- migrate:up
CREATE TABLE medication_administrations (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       uuid NOT NULL REFERENCES organizations(id),
    facility_id           uuid NOT NULL REFERENCES facilities(id),
    patient_id            uuid NOT NULL REFERENCES patients(id),
    encounter_id          uuid NOT NULL REFERENCES encounters(id),
    prescription_item_id  uuid NOT NULL REFERENCES prescription_items(id),
    batch_id              uuid REFERENCES stock_batches(id),
    scheduled_at          timestamptz NOT NULL,
    administered_at       timestamptz,
    dose_given            numeric(10,3),
    dose_unit             text,
    route                 text,
    site                  text,
    status                text NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled','given','held','refused','missed','not_given_other')),
    administered_by       uuid REFERENCES staff(id),
    witnessed_by          uuid REFERENCES staff(id),            -- double-check for high-alert drugs
    reason_not_given      text,
    notes                 text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_mar_encounter ON medication_administrations (encounter_id, scheduled_at);
CREATE INDEX idx_mar_due       ON medication_administrations (facility_id, scheduled_at) WHERE status = 'scheduled';

-- Pharmacy sale / return. Completing a dispensation creates stock_movements
-- (type 'dispense'/'dispense_return') and charges (source_type 'dispensation').

-- migrate:down
-- TODO: add drop statements
