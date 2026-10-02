-- migrate:up
CREATE TABLE specialties (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    code            text NOT NULL,
    name            text NOT NULL,
    is_active       boolean NOT NULL DEFAULT true,
    UNIQUE (organization_id, code)
);

-- migrate:down
-- TODO: add drop statements
