-- migrate:up
CREATE TABLE stores (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     uuid NOT NULL REFERENCES organizations(id),
    facility_id         uuid NOT NULL REFERENCES facilities(id),
    department_id       uuid REFERENCES departments(id),
    parent_store_id     uuid REFERENCES stores(id),
    code                text NOT NULL,
    name                text NOT NULL,
    store_type          text NOT NULL DEFAULT 'pharmacy'
                        CHECK (store_type IN ('central','pharmacy','ward','ot','lab','other')),
    is_dispensing_point boolean NOT NULL DEFAULT false,
    is_active           boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, code)
);

-- migrate:down
-- TODO: add drop statements
