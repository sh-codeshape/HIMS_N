-- migrate:up
CREATE TABLE payer_plans (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_id        uuid NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
    tariff_plan_id  uuid REFERENCES tariff_plans(id),
    code            text NOT NULL,
    name            text NOT NULL,
    coverage_rules  jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active       boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (payer_id, code)
);

-- ---------------------------------------------------------------------
-- 3. STAFF, PRACTITIONERS & SCHEDULING
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
