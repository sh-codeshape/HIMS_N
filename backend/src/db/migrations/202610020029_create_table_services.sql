-- migrate:up
CREATE TABLE services (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid NOT NULL REFERENCES organizations(id),
    category_id       uuid REFERENCES service_categories(id),
    department_id     uuid REFERENCES departments(id),
    tax_group_id      uuid REFERENCES tax_groups(id),
    medical_code_id   uuid REFERENCES medical_codes(id),  -- CPT / SNOMED / LOINC mapping
    code              text NOT NULL,
    name              text NOT NULL,
    description       text,
    service_type      text NOT NULL DEFAULT 'service'
                      CHECK (service_type IN ('service','consultation','lab_test','imaging','procedure','bed',
                                              'package','consumable','nursing','other')),
    hsn_sac_code      text,
    billing_unit      text NOT NULL DEFAULT 'each' CHECK (billing_unit IN ('each','per_day','per_hour','per_visit','per_km')),
    default_rate      numeric(14,2) NOT NULL DEFAULT 0 CHECK (default_rate >= 0),  -- fallback when no tariff rate
    is_rate_editable  boolean NOT NULL DEFAULT false,
    is_discountable   boolean NOT NULL DEFAULT true,
    requires_order    boolean NOT NULL DEFAULT false,
    is_active         boolean NOT NULL DEFAULT true,
    custom_fields     jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);
CREATE INDEX idx_services_name_trgm ON services USING gin (name gin_trgm_ops);
CREATE INDEX idx_services_category  ON services (category_id);

-- PRICE LISTS. A plan may inherit from a parent plan (e.g. "TPA-X" falls
-- back to "General"), so you only store the exceptions.

-- migrate:down
-- TODO: add drop statements
