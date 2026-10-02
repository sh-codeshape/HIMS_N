-- migrate:up
CREATE TABLE invoices (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       uuid NOT NULL REFERENCES organizations(id),
    facility_id           uuid NOT NULL REFERENCES facilities(id),
    invoice_no            text NOT NULL,                       -- next_number(...,'INVOICE')
    invoice_type          text NOT NULL DEFAULT 'opd'
                          CHECK (invoice_type IN ('opd','ipd_interim','ipd_final','pharmacy','diagnostics','package','misc')),
    patient_id            uuid NOT NULL REFERENCES patients(id),
    encounter_id          uuid REFERENCES encounters(id),
    bill_to               text NOT NULL DEFAULT 'patient' CHECK (bill_to IN ('patient','payer')),
    payer_id              uuid REFERENCES payers(id),
    patient_coverage_id   uuid REFERENCES patient_coverages(id),
    status                text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','issued','partially_paid','paid','cancelled','written_off')),
    is_final              boolean NOT NULL DEFAULT false,
    issued_at             timestamptz,
    due_date              date,
    period_from           timestamptz,                         -- interim bill window
    period_to             timestamptz,
    currency              char(3) NOT NULL DEFAULT 'INR',
    place_of_supply       text,                                -- GST state code
    discount_reason_id    uuid REFERENCES discount_reasons(id),
    discount_approved_by  uuid,
    subtotal              numeric(14,2) NOT NULL DEFAULT 0,    -- sum of line gross
    discount_total        numeric(14,2) NOT NULL DEFAULT 0,    -- sum of line discounts
    tax_total             numeric(14,2) NOT NULL DEFAULT 0,
    round_off             numeric(14,2) NOT NULL DEFAULT 0,
    total_amount          numeric(14,2) NOT NULL DEFAULT 0,
    credit_note_total     numeric(14,2) NOT NULL DEFAULT 0,
    write_off_amount      numeric(14,2) NOT NULL DEFAULT 0 CHECK (write_off_amount >= 0),
    paid_amount           numeric(14,2) NOT NULL DEFAULT 0,    -- net of refunds
    due_amount            numeric(14,2) NOT NULL DEFAULT 0,    -- negative = refundable
    notes                 text,
    external_refs         jsonb NOT NULL DEFAULT '{}'::jsonb,  -- e-invoice IRN, claim refs ...
    cancelled_at          timestamptz,
    cancelled_by          uuid,
    cancel_reason         text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, invoice_no),
    CHECK (bill_to <> 'payer' OR payer_id IS NOT NULL),
    CHECK (total_amount = subtotal - discount_total + tax_total + round_off),
    CHECK (due_amount   = total_amount - credit_note_total - write_off_amount - paid_amount),
    CHECK (status IN ('draft','cancelled') OR issued_at IS NOT NULL),
    CHECK (status <> 'cancelled' OR cancelled_at IS NOT NULL)
);
CREATE INDEX idx_invoices_patient   ON invoices (patient_id, issued_at DESC);
CREATE INDEX idx_invoices_encounter ON invoices (encounter_id);
CREATE INDEX idx_invoices_status    ON invoices (facility_id, status) WHERE status IN ('issued','partially_paid');
CREATE INDEX idx_invoices_payer     ON invoices (payer_id, status) WHERE payer_id IS NOT NULL;

-- migrate:down
-- TODO: add drop statements
