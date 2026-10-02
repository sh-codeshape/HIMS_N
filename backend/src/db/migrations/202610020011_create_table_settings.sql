-- migrate:up
CREATE TABLE settings (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    facility_id     uuid REFERENCES facilities(id),   -- NULL = org default, row with facility overrides it
    key             text NOT NULL,
    value           jsonb NOT NULL,
    description     text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE UNIQUE INDEX uq_settings
    ON settings (organization_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid), key);

-- Admin-defined extra fields. Values live in the `custom_fields` JSONB
-- column of the entity table (patients, encounters, services, items ...).

-- migrate:down
-- TODO: add drop statements
