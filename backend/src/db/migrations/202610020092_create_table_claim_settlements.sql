-- migrate:up
CREATE TABLE claim_settlements (       -- each payer remittance against a claim
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id         uuid NOT NULL REFERENCES insurance_claims(id) ON DELETE CASCADE,
    payment_id       uuid REFERENCES payments(id),
    settled_amount   numeric(14,2) NOT NULL CHECK (settled_amount >= 0),
    tds_amount       numeric(14,2) NOT NULL DEFAULT 0 CHECK (tds_amount >= 0),
    disallowed_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (disallowed_amount >= 0),
    disallowance_reason text,
    utr_number       text,
    settled_on       date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_claim_settlements_claim ON claim_settlements (claim_id);

-- ---- Billing integrity triggers ---------------------------------------
-- Lines of a non-draft invoice are frozen. Fix mistakes with a credit note.

-- migrate:down
-- TODO: add drop statements
