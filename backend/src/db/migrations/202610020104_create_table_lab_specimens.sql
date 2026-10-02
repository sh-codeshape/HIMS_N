-- migrate:up
CREATE TABLE lab_specimens (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid NOT NULL REFERENCES organizations(id),
    facility_id       uuid NOT NULL REFERENCES facilities(id),
    specimen_no       text NOT NULL,                           -- barcode
    patient_id        uuid NOT NULL REFERENCES patients(id),
    encounter_id      uuid NOT NULL REFERENCES encounters(id),
    order_id          uuid REFERENCES orders(id),
    specimen_type     text NOT NULL,
    container         text,
    status            text NOT NULL DEFAULT 'pending_collection'
                      CHECK (status IN ('pending_collection','collected','received','in_process','rejected','stored','discarded')),
    collected_at      timestamptz,
    collected_by      uuid REFERENCES staff(id),
    received_at       timestamptz,
    received_by       uuid REFERENCES staff(id),
    rejection_reason  text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, specimen_no)
);
CREATE INDEX idx_lab_specimens_enc ON lab_specimens (encounter_id);

-- migrate:down
-- TODO: add drop statements
