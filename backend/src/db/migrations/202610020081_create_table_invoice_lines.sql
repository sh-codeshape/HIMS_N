-- migrate:up
CREATE TABLE invoice_lines (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id           uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_no              int NOT NULL,
    charge_id            uuid REFERENCES charges(id),
    service_id           uuid REFERENCES services(id),
    item_id              uuid REFERENCES items(id),
    description          text NOT NULL,
    department_id        uuid REFERENCES departments(id),
    practitioner_id      uuid REFERENCES practitioners(id),    -- for doctor revenue-share reports
    hsn_sac_code         text,
    quantity             numeric(12,3) NOT NULL CHECK (quantity > 0),
    unit_price           numeric(14,2) NOT NULL CHECK (unit_price >= 0),
    gross_amount         numeric(14,2) GENERATED ALWAYS AS (round(quantity * unit_price, 2)) STORED,
    discount_percent     numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    discount_amount      numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    taxable_amount       numeric(14,2) NOT NULL,
    tax_group_id         uuid REFERENCES tax_groups(id),
    tax_amount           numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    line_total           numeric(14,2) NOT NULL,
    UNIQUE (invoice_id, line_no),
    CHECK (discount_amount <= gross_amount),
    CHECK (taxable_amount = gross_amount - discount_amount),
    CHECK (line_total = taxable_amount + tax_amount)
);
CREATE INDEX idx_invoice_lines_charge  ON invoice_lines (charge_id);
CREATE INDEX idx_invoice_lines_service ON invoice_lines (service_id);

-- GST split per line (CGST / SGST / IGST / CESS)

-- migrate:down
-- TODO: add drop statements
