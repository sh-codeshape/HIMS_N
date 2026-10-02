-- migrate:up
CREATE TABLE manufacturers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    name            text NOT NULL,
    country         char(2),
    is_active       boolean NOT NULL DEFAULT true,
    UNIQUE (organization_id, name)
);

-- migrate:down
-- TODO: add drop statements
