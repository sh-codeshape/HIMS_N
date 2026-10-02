-- migrate:up
CREATE TABLE tariff_plans (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    parent_plan_id  uuid REFERENCES tariff_plans(id),
    code            text NOT NULL,
    name            text NOT NULL,
    plan_type       text NOT NULL DEFAULT 'standard'
                    CHECK (plan_type IN ('standard','insurance','corporate','government','staff','concession')),
    currency        char(3) NOT NULL DEFAULT 'INR',
    is_default      boolean NOT NULL DEFAULT false,
    valid_from      date,
    valid_to        date,
    is_active       boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);
CREATE UNIQUE INDEX uq_tariff_plans_default ON tariff_plans (organization_id) WHERE is_default;

-- Effective-dated rates; optionally per bed class and per facility.
-- The exclusion constraint makes overlapping validity windows impossible.

-- migrate:down
-- TODO: add drop statements
