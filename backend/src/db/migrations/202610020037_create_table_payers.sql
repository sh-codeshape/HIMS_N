-- migrate:up
CREATE TABLE payers (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      uuid NOT NULL REFERENCES organizations(id),
    code                 text NOT NULL,
    name                 text NOT NULL,
    payer_type           text NOT NULL CHECK (payer_type IN ('insurer','tpa','corporate','government_scheme','trust','other')),
    default_tariff_plan_id uuid REFERENCES tariff_plans(id),
    contact_person       text,
    phone                text,
    email                citext,
    address              text,
    gstin                text,
    credit_days          int NOT NULL DEFAULT 30,
    claim_submission_mode text NOT NULL DEFAULT 'portal' CHECK (claim_submission_mode IN ('portal','email','paper','api')),
    is_cashless_network  boolean NOT NULL DEFAULT false,
    empanelment_valid_to date,
    is_active            boolean NOT NULL DEFAULT true,
    custom_fields        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);

-- A payer's product / scheme. coverage_rules is free-form JSON, e.g.
-- {"room_rent_cap_per_day":5000,"copay_percent":10,"excluded_categories":["cosmetic"]}

-- migrate:down
-- TODO: add drop statements
