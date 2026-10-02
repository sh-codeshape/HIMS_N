-- migrate:up
CREATE TABLE surgeries (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       uuid NOT NULL REFERENCES organizations(id),
    facility_id           uuid NOT NULL REFERENCES facilities(id),
    patient_id            uuid NOT NULL REFERENCES patients(id),
    encounter_id          uuid NOT NULL REFERENCES encounters(id),
    admission_id          uuid REFERENCES admissions(id),
    procedure_service_id  uuid REFERENCES services(id),         -- billable procedure
    medical_code_id       uuid REFERENCES medical_codes(id),
    procedure_name        text NOT NULL,
    operation_theatre_id  uuid REFERENCES operation_theatres(id),
    status                text NOT NULL DEFAULT 'requested'
                          CHECK (status IN ('requested','scheduled','pre_op','in_progress','completed','cancelled','postponed')),
    priority              text NOT NULL DEFAULT 'elective' CHECK (priority IN ('elective','urgent','emergency')),
    scheduled_start       timestamptz,
    scheduled_end         timestamptz,
    actual_start          timestamptz,
    actual_end            timestamptz,
    anesthesia_type       text CHECK (anesthesia_type IN ('general','spinal','epidural','regional','local','sedation','none')),
    asa_grade             smallint CHECK (asa_grade BETWEEN 1 AND 6),
    laterality            text CHECK (laterality IN ('left','right','bilateral','not_applicable')),
    pre_op_diagnosis      text,
    post_op_diagnosis     text,
    operative_notes       text,
    complications         text,
    blood_loss_ml         int,
    implants              jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CHECK (scheduled_end IS NULL OR scheduled_end > scheduled_start),
    -- no double-booking of a theatre
    EXCLUDE USING gist (operation_theatre_id WITH =, tstzrange(scheduled_start, scheduled_end) WITH &&)
        WHERE (status IN ('scheduled','pre_op','in_progress') AND operation_theatre_id IS NOT NULL
               AND scheduled_start IS NOT NULL AND scheduled_end IS NOT NULL)
);
CREATE INDEX idx_surgeries_encounter ON surgeries (encounter_id);
CREATE INDEX idx_surgeries_schedule  ON surgeries (facility_id, scheduled_start);

-- migrate:down
-- TODO: add drop statements
