-- migrate:up
CREATE TABLE cash_sessions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_counter_id   uuid NOT NULL REFERENCES cash_counters(id),
    user_id           uuid NOT NULL REFERENCES users(id),
    opened_at         timestamptz NOT NULL DEFAULT now(),
    closed_at         timestamptz,
    opening_float     numeric(14,2) NOT NULL DEFAULT 0,
    expected_closing  numeric(14,2),
    actual_closing    numeric(14,2),
    variance          numeric(14,2) GENERATED ALWAYS AS (actual_closing - expected_closing) STORED,
    status            text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','reconciled')),
    notes             text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE UNIQUE INDEX uq_cash_sessions_open ON cash_sessions (cash_counter_id) WHERE status = 'open';

-- PAYMENTS = money movements. direction 'in' = receipt, 'out' = refund.
-- Advances/deposits are payments with payment_type 'advance'; they are
-- consumed by allocating them to invoices. A payer remittance is a single
-- payment allocated across many invoices.

-- migrate:down
-- TODO: add drop statements
