-- migrate:up
CREATE TABLE bed_categories (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    code            text NOT NULL,
    name            text NOT NULL,
    rank            int NOT NULL DEFAULT 0,           -- higher = more premium (upgrade/downgrade logic)
    is_icu          boolean NOT NULL DEFAULT false,
    is_active       boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);

-- CHARGE MASTER: everything that can appear on a bill.

-- migrate:down
-- TODO: add drop statements
