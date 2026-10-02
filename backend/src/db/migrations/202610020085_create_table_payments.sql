-- migrate:up
CREATE TABLE payments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     uuid NOT NULL REFERENCES organizations(id),
    facility_id         uuid NOT NULL REFERENCES facilities(id),
    receipt_no          text NOT NULL,                         -- next_number(...,'RECEIPT')
    patient_id          uuid REFERENCES patients(id),
    payer_id            uuid REFERENCES payers(id),
    encounter_id        uuid REFERENCES encounters(id),
    direction           text NOT NULL DEFAULT 'in' CHECK (direction IN ('in','out')),
    payment_type        text NOT NULL DEFAULT 'invoice_payment'
                        CHECK (payment_type IN ('invoice_payment','advance','refund','payer_settlement')),
    payment_method_id   uuid NOT NULL REFERENCES payment_methods(id),
    amount              numeric(14,2) NOT NULL CHECK (amount > 0),
    allocated_amount    numeric(14,2) NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
    reference_no        text,                                  -- UPI txn id / cheque no / card RRN
    method_details      jsonb NOT NULL DEFAULT '{}'::jsonb,    -- bank, card last4, cheque date ...
    status              text NOT NULL DEFAULT 'completed'
                        CHECK (status IN ('pending','completed','failed','reversed','cancelled')),
    paid_at             timestamptz NOT NULL DEFAULT now(),
    cash_session_id     uuid REFERENCES cash_sessions(id),
    received_by         uuid,
    original_payment_id uuid REFERENCES payments(id),          -- refund -> the payment being refunded
    notes               text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, receipt_no),
    CHECK (allocated_amount <= amount),
    CHECK (patient_id IS NOT NULL OR payer_id IS NOT NULL),
    CHECK (direction = 'out' OR payment_type <> 'refund'),
    CHECK (payment_type <> 'refund' OR direction = 'out')
);
CREATE INDEX idx_payments_patient  ON payments (patient_id, paid_at DESC);
CREATE INDEX idx_payments_payer    ON payments (payer_id, paid_at DESC);
CREATE INDEX idx_payments_session  ON payments (cash_session_id);

-- migrate:down
-- TODO: add drop statements
