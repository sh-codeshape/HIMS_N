-- migrate:up
CREATE TABLE observation_definitions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    code            text NOT NULL,
    name            text NOT NULL,
    category        text NOT NULL DEFAULT 'vital_signs'
                    CHECK (category IN ('vital_signs','anthropometry','examination','laboratory','imaging',
                                        'social_history','survey','scoring','other')),
    data_type       text NOT NULL CHECK (data_type IN ('numeric','text','boolean','datetime','coded')),
    unit            text,
    decimal_places  smallint,
    normal_low      numeric,
    normal_high     numeric,
    critical_low    numeric,
    critical_high   numeric,
    allowed_values  jsonb,                                  -- for coded answers
    medical_code_id uuid REFERENCES medical_codes(id),      -- LOINC / SNOMED
    sort_order      int NOT NULL DEFAULT 0,
    is_active       boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);

-- migrate:down
-- TODO: add drop statements
