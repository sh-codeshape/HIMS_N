-- migrate:up
CREATE TABLE blood_donors (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id    uuid NOT NULL REFERENCES organizations(id),
    donor_no           text NOT NULL,
    patient_id         uuid REFERENCES patients(id),
    name               text NOT NULL,
    date_of_birth      date,
    gender             text CHECK (gender IN ('male','female','other')),
    blood_group        text CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    phone              text,
    last_donation_date date,
    deferred_until     date,
    is_eligible        boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, donor_no)
);

-- migrate:down
-- TODO: add drop statements
