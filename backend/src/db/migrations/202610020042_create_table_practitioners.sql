-- migrate:up
CREATE TABLE practitioners (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id                  uuid NOT NULL UNIQUE REFERENCES staff(id),
    specialty_id              uuid REFERENCES specialties(id),
    registration_no           text,                       -- medical council number
    registration_council      text,
    qualifications            text,
    experience_years          int,
    consultation_service_id   uuid REFERENCES services(id),   -- first-visit fee (via tariff)
    followup_service_id       uuid REFERENCES services(id),
    followup_validity_days    int NOT NULL DEFAULT 7,         -- follow-up inside this window can be free/discounted
    teleconsult_enabled       boolean NOT NULL DEFAULT false,
    signature_storage_key     text,
    bio                       text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- Weekly recurring availability

-- migrate:down
-- TODO: add drop statements
