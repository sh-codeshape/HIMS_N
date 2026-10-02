-- migrate:up
CREATE TABLE beds (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         uuid NOT NULL REFERENCES organizations(id),
    facility_id             uuid NOT NULL REFERENCES facilities(id),
    ward_id                 uuid NOT NULL REFERENCES wards(id),
    room_id                 uuid REFERENCES rooms(id),
    bed_category_id         uuid REFERENCES bed_categories(id),
    bed_charge_service_id   uuid REFERENCES services(id),        -- daily bed charge (rate via tariff + bed class)
    bed_no                  text NOT NULL,
    status                  text NOT NULL DEFAULT 'available'
                            CHECK (status IN ('available','occupied','reserved','cleaning','maintenance','blocked')),
    features                jsonb NOT NULL DEFAULT '{}'::jsonb,    -- oxygen, monitor, ventilator ...
    is_active               boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (ward_id, bed_no)
);
CREATE INDEX idx_beds_status ON beds (facility_id, status) WHERE is_active;

-- migrate:down
-- TODO: add drop statements
