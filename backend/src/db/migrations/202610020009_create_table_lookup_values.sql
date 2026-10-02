-- migrate:up
CREATE TABLE lookup_values (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id),
    type_code       text NOT NULL REFERENCES lookup_types(code),
    code            text NOT NULL,
    label           text NOT NULL,
    sort_order      int NOT NULL DEFAULT 0,
    is_active       boolean NOT NULL DEFAULT true,
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX uq_lookup_values
    ON lookup_values (COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), type_code, code);

-- Human-readable number series (UHID, visit no, invoice no, receipt no ...).
-- Use:  SELECT next_number(<org>, <facility or NULL>, 'INVOICE');

-- migrate:down
-- TODO: add drop statements
