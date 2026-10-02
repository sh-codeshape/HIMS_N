-- migrate:up
CREATE TABLE imaging_reports (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id            uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    modality                 text NOT NULL CHECK (modality IN ('xray','ct','mri','ultrasound','mammography','pet',
                                                               'fluoroscopy','echo','ecg','eeg','other')),
    body_part                text,
    accession_no             text,
    study_instance_uid       text,                             -- DICOM
    pacs_url                 text,
    contrast_used            boolean NOT NULL DEFAULT false,
    performed_at             timestamptz,
    technologist_staff_id    uuid REFERENCES staff(id),
    radiologist_practitioner_id uuid REFERENCES practitioners(id),
    findings                 text,
    impression               text,
    is_critical              boolean NOT NULL DEFAULT false,
    status                   text NOT NULL DEFAULT 'scheduled'
                             CHECK (status IN ('scheduled','performed','preliminary','final','amended','cancelled')),
    reported_at              timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_imaging_item ON imaging_reports (order_item_id);

-- ---------------------------------------------------------------------
-- 10. PRESCRIPTIONS, MAR & DISPENSING
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
