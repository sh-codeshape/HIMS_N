-- migrate:up
CREATE TABLE patient_consents (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_type  text NOT NULL CHECK (consent_type IN ('general_treatment','data_sharing','abdm_linking','research',
                                                        'marketing','telemedicine','photography','procedure','other')),
    status        text NOT NULL DEFAULT 'granted' CHECK (status IN ('granted','revoked','expired')),
    granted_at    timestamptz NOT NULL DEFAULT now(),
    revoked_at    timestamptz,
    valid_to      date,
    given_by      text,                                       -- patient / guardian name
    captured_by   uuid,
    document_attachment_id uuid REFERENCES attachments(id),
    notes         text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_patient_consents_patient ON patient_consents (patient_id, consent_type);

-- Insurance / corporate coverage held by the patient

-- migrate:down
-- TODO: add drop statements
