-- migrate:up
CREATE TABLE form_submissions (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id),
    form_template_id uuid NOT NULL REFERENCES form_templates(id),
    patient_id       uuid REFERENCES patients(id),
    encounter_id     uuid REFERENCES encounters(id),
    data             jsonb NOT NULL,
    status           text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft','submitted','amended','entered_in_error')),
    submitted_by     uuid,
    submitted_at     timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_form_submissions_enc ON form_submissions (encounter_id);
CREATE INDEX idx_form_submissions_pat ON form_submissions (patient_id);
CREATE INDEX idx_form_submissions_gin ON form_submissions USING gin (data jsonb_path_ops);


-- ---------------------------------------------------------------------
-- 7. INVENTORY & PHARMACY MASTERS
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
