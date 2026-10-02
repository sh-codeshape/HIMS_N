-- migrate:up
CREATE TABLE encounters (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         uuid NOT NULL REFERENCES organizations(id),
    facility_id             uuid NOT NULL REFERENCES facilities(id),
    encounter_no            text NOT NULL,                  -- next_number(...,'ENCOUNTER')
    patient_id              uuid NOT NULL REFERENCES patients(id),
    encounter_type          text NOT NULL
                            CHECK (encounter_type IN ('opd','ipd','emergency','daycare','teleconsult','home_care',
                                                      'health_checkup','diagnostic_only','pharmacy_only')),
    status                  text NOT NULL DEFAULT 'in_progress'
                            CHECK (status IN ('planned','arrived','in_progress','on_hold','finished','cancelled','entered_in_error')),
    department_id           uuid REFERENCES departments(id),
    primary_practitioner_id uuid REFERENCES practitioners(id),
    appointment_id          uuid REFERENCES appointments(id),
    parent_encounter_id     uuid REFERENCES encounters(id), -- OPD -> IPD conversion, ER -> IPD
    tariff_plan_id          uuid REFERENCES tariff_plans(id), -- price list applied to this episode
    started_at              timestamptz NOT NULL DEFAULT now(),
    ended_at                timestamptz,
    priority                text NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine','urgent','emergency')),
    triage_category         smallint CHECK (triage_category BETWEEN 1 AND 5),   -- ESI 1 (critical) .. 5
    arrival_mode            text CHECK (arrival_mode IN ('walk_in','ambulance','referred','transfer','police')),
    referral_source         text,
    referred_by             text,
    chief_complaint         text,
    is_medico_legal         boolean NOT NULL DEFAULT false,
    mlc_number              text,
    billing_status          text NOT NULL DEFAULT 'open' CHECK (billing_status IN ('open','interim','finalized','closed')),
    custom_fields           jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, encounter_no),
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX idx_encounters_patient  ON encounters (patient_id, started_at DESC);
CREATE INDEX idx_encounters_facility ON encounters (facility_id, encounter_type, status);
CREATE INDEX idx_encounters_prac     ON encounters (primary_practitioner_id, started_at DESC);

-- migrate:down
-- TODO: add drop statements
