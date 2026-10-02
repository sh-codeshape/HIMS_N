-- migrate:up
CREATE TABLE patients (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id        uuid NOT NULL REFERENCES organizations(id),
    registered_facility_id uuid REFERENCES facilities(id),
    uhid                   text NOT NULL,                     -- hospital-wide MRN, from next_number(...,'UHID')
    first_name             text NOT NULL,
    middle_name            text,
    last_name              text,
    full_name              text GENERATED ALWAYS AS
                           (first_name || COALESCE(' ' || middle_name, '') || COALESCE(' ' || last_name, '')) STORED,
    date_of_birth          date,
    dob_is_estimated       boolean NOT NULL DEFAULT false,
    gender                 text NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male','female','other','unknown')),
    marital_status         text CHECK (marital_status IN ('single','married','divorced','widowed','separated','other')),
    blood_group            text CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    phone                  text,
    alternate_phone        text,
    email                  citext,
    preferred_language     text,
    nationality            text DEFAULT 'IN',
    occupation             text,
    photo_storage_key      text,
    allergy_status         text NOT NULL DEFAULT 'unknown' CHECK (allergy_status IN ('unknown','nkda','has_allergies')),
    is_vip                 boolean NOT NULL DEFAULT false,
    is_deceased            boolean NOT NULL DEFAULT false,
    deceased_at            timestamptz,
    status                 text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','merged','deceased')),
    merged_into_patient_id uuid REFERENCES patients(id),      -- duplicate resolution
    registration_source    text,
    custom_fields          jsonb NOT NULL DEFAULT '{}'::jsonb,
    deleted_at timestamptz,
    deleted_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, uhid)
);
CREATE INDEX idx_patients_name_trgm ON patients USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_patients_phone     ON patients (organization_id, phone);
CREATE INDEX idx_patients_dob       ON patients (organization_id, date_of_birth);

-- ABHA, passport, insurance member ids ... Never store raw Aadhaar: keep a
-- vault token / last-4 in id_value and the hash in id_value_hash.

-- migrate:down
-- TODO: add drop statements
