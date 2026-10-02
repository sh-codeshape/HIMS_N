-- migrate:up
CREATE TABLE form_templates (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    code            text NOT NULL,
    name            text NOT NULL,
    version         int NOT NULL DEFAULT 1,
    applies_to      text,                                    -- encounter type / department hint
    schema          jsonb NOT NULL,
    ui_schema       jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active       boolean NOT NULL DEFAULT true,
    published_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code, version)
);

-- migrate:down
-- TODO: add drop statements
