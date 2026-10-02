-- migrate:up
CREATE TABLE suppliers (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     uuid NOT NULL REFERENCES organizations(id),
    code                text NOT NULL,
    name                text NOT NULL,
    contact_person      text,
    phone               text,
    email               citext,
    address             text,
    gstin               text,
    drug_license_no     text,
    payment_terms_days  int NOT NULL DEFAULT 30,
    bank_details        jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active           boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);

-- migrate:down
-- TODO: add drop statements
