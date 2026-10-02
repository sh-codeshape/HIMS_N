-- migrate:up
CREATE TABLE blood_requests (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id),
    facility_id      uuid NOT NULL REFERENCES facilities(id),
    patient_id       uuid NOT NULL REFERENCES patients(id),
    encounter_id     uuid NOT NULL REFERENCES encounters(id),
    requested_by     uuid REFERENCES practitioners(id),
    component        text NOT NULL CHECK (component IN ('whole_blood','prbc','ffp','platelets','cryoprecipitate')),
    blood_group      text CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    units_requested  int NOT NULL CHECK (units_requested > 0),
    urgency          text NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine','urgent','emergency')),
    indication       text,
    status           text NOT NULL DEFAULT 'requested'
                     CHECK (status IN ('requested','crossmatching','ready','partially_issued','issued','cancelled')),
    requested_at     timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- migrate:down
-- TODO: add drop statements
