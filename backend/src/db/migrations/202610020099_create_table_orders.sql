-- migrate:up
CREATE TABLE orders (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             uuid NOT NULL REFERENCES organizations(id),
    facility_id                 uuid NOT NULL REFERENCES facilities(id),
    order_no                    text NOT NULL,
    patient_id                  uuid NOT NULL REFERENCES patients(id),
    encounter_id                uuid NOT NULL REFERENCES encounters(id),
    order_type                  text NOT NULL CHECK (order_type IN
                                ('lab','imaging','procedure','consultation','nursing','diet','referral','other')),
    priority                    text NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine','urgent','stat')),
    status                      text NOT NULL DEFAULT 'active'
                                CHECK (status IN ('draft','active','in_progress','completed','cancelled','on_hold','entered_in_error')),
    ordered_by_practitioner_id  uuid REFERENCES practitioners(id),
    performing_department_id    uuid REFERENCES departments(id),
    ordered_at                  timestamptz NOT NULL DEFAULT now(),
    clinical_info               text,
    notes                       text,
    cancel_reason               text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, order_no)
);
CREATE INDEX idx_orders_encounter ON orders (encounter_id);
CREATE INDEX idx_orders_queue     ON orders (facility_id, order_type, status);

-- migrate:down
-- TODO: add drop statements
