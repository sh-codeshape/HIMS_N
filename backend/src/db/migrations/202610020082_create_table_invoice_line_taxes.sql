-- migrate:up
CREATE TABLE invoice_line_taxes (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_line_id  uuid NOT NULL REFERENCES invoice_lines(id) ON DELETE CASCADE,
    component_code   text NOT NULL,
    rate             numeric(6,3) NOT NULL,
    taxable_amount   numeric(14,2) NOT NULL,
    tax_amount       numeric(14,2) NOT NULL,
    UNIQUE (invoice_line_id, component_code)
);

-- migrate:down
-- TODO: add drop statements
