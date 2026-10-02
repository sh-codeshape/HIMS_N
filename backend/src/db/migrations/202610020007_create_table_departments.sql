-- migrate:up
CREATE TABLE departments (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      uuid NOT NULL REFERENCES organizations(id),
    facility_id          uuid NOT NULL REFERENCES facilities(id),
    parent_department_id uuid REFERENCES departments(id),
    code                 text NOT NULL,
    name                 text NOT NULL,
    department_type      text NOT NULL DEFAULT 'clinical'
                         CHECK (department_type IN ('clinical','diagnostic','pharmacy','nursing','administrative','support')),
    head_staff_id        uuid,                   -- FK added after staff table
    is_active            boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, code)
);

-- Editable code lists (relationship types, referral sources, religions ...).
-- organization_id NULL = global default shared by all tenants.

-- migrate:down
-- TODO: add drop statements
