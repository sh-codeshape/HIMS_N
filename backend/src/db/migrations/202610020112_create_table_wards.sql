-- migrate:up
CREATE TABLE wards (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    facility_id     uuid NOT NULL REFERENCES facilities(id),
    department_id   uuid REFERENCES departments(id),
    bed_category_id uuid REFERENCES bed_categories(id),
    code            text NOT NULL,
    name            text NOT NULL,
    ward_type       text NOT NULL DEFAULT 'general'
                    CHECK (ward_type IN ('general','semi_private','private','icu','nicu','picu','hdu','isolation',
                                         'emergency','maternity','daycare','other')),
    gender_policy   text NOT NULL DEFAULT 'any' CHECK (gender_policy IN ('any','male','female')),
    floor           text,
    is_active       boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, code)
);

-- migrate:down
-- TODO: add drop statements
