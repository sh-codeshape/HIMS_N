-- migrate:up
CREATE TABLE preauthorizations (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      uuid NOT NULL REFERENCES organizations(id),
    facility_id          uuid NOT NULL REFERENCES facilities(id),
    patient_id           uuid NOT NULL REFERENCES patients(id),
    encounter_id         uuid NOT NULL REFERENCES encounters(id),
    patient_coverage_id  uuid NOT NULL REFERENCES patient_coverages(id),
    payer_id             uuid NOT NULL REFERENCES payers(id),
    tpa_payer_id         uuid REFERENCES payers(id),
    preauth_no           text,                                  -- reference issued by payer / TPA
    request_type         text NOT NULL DEFAULT 'planned_admission'
                         CHECK (request_type IN ('planned_admission','emergency','enhancement','final_discharge','opd_cashless')),
    status               text NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','submitted','query_raised','approved','partially_approved',
                                           'rejected','cancelled','expired')),
    requested_amount     numeric(14,2) NOT NULL DEFAULT 0 CHECK (requested_amount >= 0),
    approved_amount      numeric(14,2) CHECK (approved_amount >= 0),
    approved_bed_category_id uuid REFERENCES bed_categories(id),
    approved_days        int,
    diagnosis_summary    text,
    planned_procedure    text,
    submitted_at         timestamptz,
    responded_at         timestamptz,
    valid_until          date,
    rejection_reason     text,
    remarks              text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_preauth_encounter ON preauthorizations (encounter_id);
CREATE INDEX idx_preauth_status    ON preauthorizations (payer_id, status);

-- migrate:down
-- TODO: add drop statements
