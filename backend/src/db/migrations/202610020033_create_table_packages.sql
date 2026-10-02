-- migrate:up
CREATE TABLE packages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    service_id      uuid NOT NULL REFERENCES services(id),   -- the billable "package" service (price via tariff)
    code            text NOT NULL,
    name            text NOT NULL,
    package_type    text NOT NULL DEFAULT 'surgery'
                    CHECK (package_type IN ('surgery','health_checkup','maternity','daycare','medical_management','other')),
    validity_days   int,
    inclusions      text,
    exclusions      text,
    is_active       boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);

-- migrate:down
-- TODO: add drop statements
