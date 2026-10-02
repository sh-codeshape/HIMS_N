-- migrate:up
CREATE TABLE roles (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    code            text NOT NULL,
    name            text NOT NULL,
    description     text,
    is_system       boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);

-- migrate:down
-- TODO: add drop statements
