-- migrate:up
CREATE TABLE discharge_summaries (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id             uuid NOT NULL UNIQUE REFERENCES admissions(id),
    encounter_id             uuid NOT NULL REFERENCES encounters(id),
    patient_id               uuid NOT NULL REFERENCES patients(id),
    final_diagnosis          text,
    history_of_present_illness text,
    hospital_course          text,
    procedures_performed     text,
    condition_at_discharge   text,
    discharge_prescription_id uuid REFERENCES prescriptions(id),
    follow_up_instructions   text,
    follow_up_date           date,
    diet_advice              text,
    activity_advice          text,
    pending_results          text,
    status                   text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized','amended')),
    authored_by              uuid REFERENCES practitioners(id),
    signed_at                timestamptz,
    data                     jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- ---- Operation theatre ----

-- migrate:down
-- TODO: add drop statements
