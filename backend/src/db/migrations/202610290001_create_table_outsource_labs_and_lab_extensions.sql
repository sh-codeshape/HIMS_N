-- migrate:up
CREATE TABLE IF NOT EXISTS outsource_labs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    name            text NOT NULL,
    code            text,
    contact_person  text,
    phone           text,
    email           text,
    address         text,
    contract_rate   numeric(5,2) DEFAULT 0,
    turnaround_days int DEFAULT 2,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    created_by      uuid,
    updated_by      uuid,
    UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_outsource_labs_org ON outsource_labs (organization_id);

ALTER TABLE lab_specimens
  ADD COLUMN IF NOT EXISTS processing_source  text NOT NULL DEFAULT 'in_house'
    CHECK (processing_source IN ('in_house','outsource_send','outsource_return','external_upload')),
  ADD COLUMN IF NOT EXISTS outsource_lab_id   uuid REFERENCES outsource_labs(id),
  ADD COLUMN IF NOT EXISTS sent_at            timestamptz,
  ADD COLUMN IF NOT EXISTS expected_return_at timestamptz,
  ADD COLUMN IF NOT EXISTS returned_at        timestamptz,
  ADD COLUMN IF NOT EXISTS outsource_ref_no   text,
  ADD COLUMN IF NOT EXISTS outsource_cost     numeric(14,2);

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS processing_source  text DEFAULT 'in_house'
    CHECK (processing_source IN ('in_house','outsource_send','outsource_return','external_upload')),
  ADD COLUMN IF NOT EXISTS outsource_lab_id   uuid REFERENCES outsource_labs(id);

-- Ensure a diagnostic department for Pathology & Laboratory exists for all facilities
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, organization_id FROM facilities LOOP
        IF NOT EXISTS (
            SELECT 1 FROM departments 
            WHERE facility_id = r.id AND (code = 'LAB' OR department_type = 'diagnostic')
        ) THEN
            INSERT INTO departments (
                organization_id, facility_id, code, name, department_type, is_active
            ) VALUES (
                r.organization_id, r.id, 'LAB', 'Pathology & Laboratory', 'diagnostic', true
            ) ON CONFLICT (facility_id, code) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- Pre-seed standard outsource lab partners for existing organizations
DO $$
DECLARE
    o RECORD;
BEGIN
    FOR o IN SELECT id FROM organizations LOOP
        INSERT INTO outsource_labs (organization_id, name, code, contact_person, phone, email, address, contract_rate, turnaround_days)
        VALUES
            (o.id, 'Dr Lal PathLabs', 'DRLAL', 'Dr. Alok Verma', '+91 11 3988 5050', 'support@lalpathlabs.com', 'National Reference Lab, Delhi / Regional Center Varanasi', 20.00, 2),
            (o.id, 'SRL Diagnostics (Agilus)', 'SRL', 'Vikram Singh', '+91 1800 222 000', 'care@agilus.in', 'SRL Reference Lab, Mumbai / Regional Hub', 15.00, 2),
            (o.id, 'Thyrocare Technologies', 'THYRO', 'Kavita Nair', '+91 22 2762 2762', 'ramesh@thyrocare.com', 'D-37/1, TTC Industrial Area, MIDC Turbhe, Navi Mumbai', 25.00, 3),
            (o.id, 'Metropolis Healthcare', 'METRO', 'Rajesh Joshi', '+91 22 6666 0222', 'support@metropolisindia.com', 'Metropolis Reference Lab, Mumbai / Central Hub', 18.00, 2)
        ON CONFLICT (organization_id, name) DO NOTHING;
    END LOOP;
END $$;

-- migrate:down
DROP TABLE IF EXISTS outsource_labs CASCADE;
