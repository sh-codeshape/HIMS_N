-- migrate:up
CREATE TABLE patient_coverages (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id              uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    payer_id                uuid NOT NULL REFERENCES payers(id),
    tpa_payer_id            uuid REFERENCES payers(id),
    payer_plan_id           uuid REFERENCES payer_plans(id),
    policy_number           text NOT NULL,
    member_id               text,
    group_number            text,
    policyholder_name       text,
    relationship_to_holder  text NOT NULL DEFAULT 'self',
    valid_from              date,
    valid_to                date,
    sum_insured             numeric(14,2),
    copay_percent           numeric(5,2) CHECK (copay_percent BETWEEN 0 AND 100),
    priority                smallint NOT NULL DEFAULT 1,     -- 1 = primary, 2 = secondary ...
    status                  text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','suspended','cancelled')),
    is_verified             boolean NOT NULL DEFAULT false,
    card_attachment_id      uuid REFERENCES attachments(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_patient_coverages_patient ON patient_coverages (patient_id, status);


-- ---------------------------------------------------------------------
-- 5. APPOINTMENTS & ENCOUNTERS (the spine of the system)
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
