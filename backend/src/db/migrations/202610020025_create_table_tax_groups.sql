-- migrate:up
CREATE TABLE tax_groups (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    code            text NOT NULL,                    -- 'GST0','GST5','GST12','GST18'
    name            text NOT NULL,
    total_rate      numeric(6,3) NOT NULL DEFAULT 0 CHECK (total_rate >= 0),
    is_exempt       boolean NOT NULL DEFAULT false,
    is_active       boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);

-- migrate:down
-- TODO: add drop statements
