-- migrate:up
CREATE TABLE facilities (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id),
    code             text NOT NULL,
    name             text NOT NULL,
    facility_type    text NOT NULL DEFAULT 'hospital'
                     CHECK (facility_type IN ('hospital','clinic','diagnostic_center','pharmacy','blood_bank','other')),
    address_line1    text,
    address_line2    text,
    city             text,
    district         text,
    state            text,
    state_code       text,                       -- GST state code, drives CGST/SGST vs IGST
    postal_code      text,
    country          char(2) NOT NULL DEFAULT 'IN',
    phone            text,
    email            citext,
    gstin            text,
    registration_no  text,
    latitude         numeric(9,6),
    longitude        numeric(9,6),
    is_active        boolean NOT NULL DEFAULT true,
    custom_fields    jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);

-- migrate:down
-- TODO: add drop statements
