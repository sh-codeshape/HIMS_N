-- migrate:up
CREATE TABLE blood_units (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id),
    facility_id      uuid NOT NULL REFERENCES facilities(id),
    unit_no          text NOT NULL,
    donor_id         uuid REFERENCES blood_donors(id),
    component        text NOT NULL CHECK (component IN ('whole_blood','prbc','ffp','platelets','cryoprecipitate')),
    blood_group      text NOT NULL CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    volume_ml        int,
    collected_at     timestamptz NOT NULL DEFAULT now(),
    expires_at       timestamptz NOT NULL,
    status           text NOT NULL DEFAULT 'quarantine'
                     CHECK (status IN ('quarantine','available','reserved','issued','transfused','discarded','expired')),
    screening_results jsonb NOT NULL DEFAULT '{}'::jsonb,      -- HIV, HBsAg, HCV, VDRL, malaria
    storage_location text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, unit_no)
);
CREATE INDEX idx_blood_units_avail ON blood_units (facility_id, blood_group, component) WHERE status = 'available';

-- migrate:down
-- TODO: add drop statements
