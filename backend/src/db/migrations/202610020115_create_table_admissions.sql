-- migrate:up
CREATE TABLE admissions (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id           uuid NOT NULL REFERENCES organizations(id),
    facility_id               uuid NOT NULL REFERENCES facilities(id),
    encounter_id              uuid NOT NULL UNIQUE REFERENCES encounters(id),
    patient_id                uuid NOT NULL REFERENCES patients(id),
    admission_no              text NOT NULL,
    admitting_practitioner_id uuid REFERENCES practitioners(id),
    attending_practitioner_id uuid REFERENCES practitioners(id),
    department_id             uuid REFERENCES departments(id),
    admission_type            text NOT NULL DEFAULT 'elective' CHECK (admission_type IN ('elective','emergency','maternity','daycare')),
    admission_source          text CHECK (admission_source IN ('opd','emergency','referral','transfer','direct','birth')),
    entitled_bed_category_id  uuid REFERENCES bed_categories(id),   -- class the payer / package allows
    status                    text NOT NULL DEFAULT 'admitted'
                              CHECK (status IN ('pending','admitted','discharge_initiated','discharged','cancelled')),
    admitted_at               timestamptz NOT NULL DEFAULT now(),
    expected_discharge_at     timestamptz,
    discharged_at             timestamptz,
    discharge_type            text CHECK (discharge_type IN ('normal','lama','dama','absconded','referred','transferred','death')),
    admission_diagnosis       text,
    discharge_condition       text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, admission_no),
    CHECK (discharged_at IS NULL OR discharged_at >= admitted_at),
    CHECK (status <> 'discharged' OR (discharged_at IS NOT NULL AND discharge_type IS NOT NULL))
);
CREATE INDEX idx_admissions_patient ON admissions (patient_id, admitted_at DESC);
CREATE INDEX idx_admissions_active  ON admissions (facility_id) WHERE status IN ('admitted','discharge_initiated');

-- Bed history (admit, transfer, upgrade). The two exclusion constraints
-- guarantee: a bed has one occupant at a time, and a patient one bed at a time.

-- migrate:down
-- TODO: add drop statements
