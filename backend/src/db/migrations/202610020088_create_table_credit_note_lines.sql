-- migrate:up
CREATE TABLE credit_note_lines (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_id   uuid NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
    invoice_line_id  uuid REFERENCES invoice_lines(id),
    description      text NOT NULL,
    quantity         numeric(12,3) NOT NULL CHECK (quantity > 0),
    unit_price       numeric(14,2) NOT NULL CHECK (unit_price >= 0),
    taxable_amount   numeric(14,2) NOT NULL,
    tax_amount       numeric(14,2) NOT NULL DEFAULT 0,
    line_total       numeric(14,2) NOT NULL,
    CHECK (line_total = taxable_amount + tax_amount)
);
CREATE INDEX idx_credit_note_lines ON credit_note_lines (credit_note_id);

-- INSURANCE: cashless pre-authorisation and claims

-- migrate:down
-- TODO: add drop statements
