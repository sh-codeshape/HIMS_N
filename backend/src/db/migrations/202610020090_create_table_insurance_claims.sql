-- migrate:up
CREATE TABLE insurance_claims (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      uuid NOT NULL REFERENCES organizations(id),
    facility_id          uuid NOT NULL REFERENCES facilities(id),
    claim_no             text NOT NULL,
    patient_id           uuid NOT NULL REFERENCES patients(id),
    encounter_id         uuid NOT NULL REFERENCES encounters(id),
    patient_coverage_id  uuid NOT NULL REFERENCES patient_coverages(id),
    payer_id             uuid NOT NULL REFERENCES payers(id),
    preauthorization_id  uuid REFERENCES preauthorizations(id),
    claim_type           text NOT NULL DEFAULT 'cashless' CHECK (claim_type IN ('cashless','reimbursement')),
    status               text NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','submitted','query_raised','approved','partially_settled',
                                           'settled','rejected','appealed','closed')),
    claimed_amount       numeric(14,2) NOT NULL DEFAULT 0 CHECK (claimed_amount >= 0),
    approved_amount      numeric(14,2) CHECK (approved_amount >= 0),
    settled_amount       numeric(14,2) NOT NULL DEFAULT 0 CHECK (settled_amount >= 0),
    tds_amount           numeric(14,2) NOT NULL DEFAULT 0 CHECK (tds_amount >= 0),
    disallowed_amount    numeric(14,2) NOT NULL DEFAULT 0 CHECK (disallowed_amount >= 0),
    submitted_at         timestamptz,
    due_date             date,
    settled_at           timestamptz,
    rejection_reason     text,
    notes                text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, claim_no)
);
CREATE INDEX idx_claims_payer_status ON insurance_claims (payer_id, status);
CREATE INDEX idx_claims_encounter    ON insurance_claims (encounter_id);

-- migrate:down
-- TODO: add drop statements
