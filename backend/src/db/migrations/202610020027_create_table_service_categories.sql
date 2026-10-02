-- migrate:up
CREATE TABLE service_categories (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    parent_id       uuid REFERENCES service_categories(id),
    code            text NOT NULL,
    name            text NOT NULL,
    category_type   text NOT NULL DEFAULT 'general'
                    CHECK (category_type IN ('consultation','procedure','laboratory','radiology','bed_charge','nursing',
                                             'ot','pharmacy','consumable','package','ambulance','blood_bank','diet','general')),
    sort_order      int NOT NULL DEFAULT 0,
    is_active       boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);

-- Bed / room classes used for class-based pricing (General, Semi-Pvt, Pvt, ICU ...)

-- migrate:down
-- TODO: add drop statements
