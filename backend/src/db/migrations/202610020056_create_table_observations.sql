-- migrate:up
CREATE TABLE observations (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       uuid NOT NULL REFERENCES organizations(id),
    facility_id           uuid REFERENCES facilities(id),
    patient_id            uuid NOT NULL REFERENCES patients(id),
    encounter_id          uuid REFERENCES encounters(id),
    definition_id         uuid NOT NULL REFERENCES observation_definitions(id),
    parent_observation_id uuid REFERENCES observations(id),  -- grouping (e.g. BP panel)
    status                text NOT NULL DEFAULT 'final'
                          CHECK (status IN ('preliminary','final','amended','cancelled','entered_in_error')),
    value_numeric         numeric,
    value_text            text,
    value_boolean         boolean,
    value_datetime        timestamptz,
    value_coded           text,
    unit                  text,
    interpretation        text CHECK (interpretation IN ('normal','low','high','critical_low','critical_high','abnormal')),
    observed_at           timestamptz NOT NULL DEFAULT now(),
    recorded_by_staff_id  uuid REFERENCES staff(id),
    device_info           text,
    notes                 text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CHECK (num_nonnulls(value_numeric, value_text, value_boolean, value_datetime, value_coded) <= 1)
);
CREATE INDEX idx_obs_patient_def ON observations (patient_id, definition_id, observed_at DESC);
CREATE INDEX idx_obs_encounter   ON observations (encounter_id);

-- migrate:down
-- TODO: add drop statements
