-- migrate:up
CREATE TABLE ambulance_trips (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id),
    facility_id      uuid NOT NULL REFERENCES facilities(id),
    ambulance_id     uuid NOT NULL REFERENCES ambulances(id),
    patient_id       uuid REFERENCES patients(id),
    encounter_id     uuid REFERENCES encounters(id),
    pickup_address   text,
    drop_address     text,
    requested_at     timestamptz NOT NULL DEFAULT now(),
    dispatched_at    timestamptz,
    arrived_at       timestamptz,
    completed_at     timestamptz,
    distance_km      numeric(8,2),
    status           text NOT NULL DEFAULT 'requested'
                     CHECK (status IN ('requested','dispatched','on_scene','transporting','completed','cancelled')),
    crew             jsonb NOT NULL DEFAULT '[]'::jsonb,
    charge_id        uuid REFERENCES charges(id),
    notes            text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- ---------------------------------------------------------------------
-- 13. COMMUNICATION
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
