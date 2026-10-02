-- migrate:up
CREATE TABLE payment_allocations (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id    uuid NOT NULL REFERENCES payments(id),
    invoice_id    uuid NOT NULL REFERENCES invoices(id),
    amount        numeric(14,2) NOT NULL CHECK (amount > 0),
    allocated_at  timestamptz NOT NULL DEFAULT now(),
    allocated_by  uuid,
    UNIQUE (payment_id, invoice_id)
);
CREATE INDEX idx_payment_alloc_invoice ON payment_allocations (invoice_id);

-- CREDIT NOTES: the only way to reduce an issued invoice.

-- migrate:down
-- TODO: add drop statements
