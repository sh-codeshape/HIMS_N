-- migrate:up
CREATE TABLE ambulances (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id      uuid NOT NULL REFERENCES facilities(id),
    vehicle_no       text NOT NULL,
    ambulance_type   text NOT NULL DEFAULT 'basic' CHECK (ambulance_type IN ('basic','advanced','icu','neonatal','patient_transport')),
    driver_staff_id  uuid REFERENCES staff(id),
    status           text NOT NULL DEFAULT 'available' CHECK (status IN ('available','on_trip','maintenance','inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, vehicle_no)
);

-- migrate:down
-- TODO: add drop statements
