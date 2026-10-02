-- migrate:up
CREATE TABLE credit_notes (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid NOT NULL REFERENCES organizations(id),
    facility_id       uuid NOT NULL REFERENCES facilities(id),
    credit_note_no    text NOT NULL,
    invoice_id        uuid NOT NULL REFERENCES invoices(id),
    patient_id        uuid NOT NULL REFERENCES patients(id),
    reason            text NOT NULL,
    status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','cancelled')),
    subtotal          numeric(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_total         numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
    total_amount      numeric(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    issued_at         timestamptz,
    issued_by         uuid,
    approved_by       uuid,
    refund_payment_id uuid REFERENCES payments(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, credit_note_no),
    CHECK (total_amount = subtotal + tax_total),
    CHECK (status <> 'issued' OR issued_at IS NOT NULL)
);
CREATE INDEX idx_credit_notes_invoice ON credit_notes (invoice_id);

-- migrate:down
-- TODO: add drop statements
