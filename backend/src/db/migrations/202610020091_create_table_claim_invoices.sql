-- migrate:up
CREATE TABLE claim_invoices (          -- invoices covered by a claim
    claim_id    uuid NOT NULL REFERENCES insurance_claims(id) ON DELETE CASCADE,
    invoice_id  uuid NOT NULL REFERENCES invoices(id),
    amount      numeric(14,2) NOT NULL CHECK (amount >= 0),
    PRIMARY KEY (claim_id, invoice_id)
);

-- migrate:down
-- TODO: add drop statements
