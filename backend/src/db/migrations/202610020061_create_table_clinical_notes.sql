-- migrate:up
CREATE TABLE clinical_notes (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id),
    patient_id       uuid NOT NULL REFERENCES patients(id),
    encounter_id     uuid NOT NULL REFERENCES encounters(id),
    note_type        text NOT NULL CHECK (note_type IN ('soap','progress','history_physical','consultation','nursing',
                                                        'procedure','operative','discharge','handover','referral','other')),
    author_staff_id  uuid REFERENCES staff(id),
    title            text,
    subjective       text,
    objective        text,
    assessment       text,
    plan             text,
    body             text,
    structured       jsonb NOT NULL DEFAULT '{}'::jsonb,
    status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','signed','amended','entered_in_error')),
    amends_note_id   uuid REFERENCES clinical_notes(id),
    is_confidential  boolean NOT NULL DEFAULT false,
    noted_at         timestamptz NOT NULL DEFAULT now(),
    signed_at        timestamptz,
    signed_by        uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_clinical_notes_enc ON clinical_notes (encounter_id, noted_at);
CREATE INDEX idx_clinical_notes_pat ON clinical_notes (patient_id, noted_at DESC);

-- Configurable forms (consent forms, pre-anaesthesia check, nursing assessment ...)
-- `schema` holds the field definitions; answers are stored as JSONB.

-- migrate:down
-- TODO: add drop statements
