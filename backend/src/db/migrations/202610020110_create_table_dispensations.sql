-- migrate:up
CREATE TABLE dispensations (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id           uuid NOT NULL REFERENCES organizations(id),
    facility_id               uuid NOT NULL REFERENCES facilities(id),
    dispensation_no           text NOT NULL,
    kind                      text NOT NULL DEFAULT 'sale' CHECK (kind IN ('sale','return')),
    store_id                  uuid NOT NULL REFERENCES stores(id),
    patient_id                uuid REFERENCES patients(id),      -- NULL for anonymous OTC sale
    encounter_id              uuid REFERENCES encounters(id),
    prescription_id           uuid REFERENCES prescriptions(id),
    original_dispensation_id  uuid REFERENCES dispensations(id), -- return -> original sale
    customer_name             text,
    status                    text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
    invoice_id                uuid REFERENCES invoices(id),
    subtotal                  numeric(14,2) NOT NULL DEFAULT 0,
    discount_total            numeric(14,2) NOT NULL DEFAULT 0,
    tax_total                 numeric(14,2) NOT NULL DEFAULT 0,
    total_amount              numeric(14,2) NOT NULL DEFAULT 0,
    dispensed_by              uuid REFERENCES staff(id),
    dispensed_at              timestamptz,
    notes                     text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, dispensation_no),
    CHECK (kind = 'sale' OR original_dispensation_id IS NOT NULL)
);
CREATE INDEX idx_dispensations_patient ON dispensations (patient_id, dispensed_at DESC);
CREATE INDEX idx_dispensations_rx      ON dispensations (prescription_id);

-- migrate:down
-- TODO: add drop statements
