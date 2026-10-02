-- migrate:up
CREATE TABLE appointments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     uuid NOT NULL REFERENCES organizations(id),
    facility_id         uuid NOT NULL REFERENCES facilities(id),
    patient_id          uuid NOT NULL REFERENCES patients(id),
    practitioner_id     uuid NOT NULL REFERENCES practitioners(id),
    department_id       uuid REFERENCES departments(id),
    appointment_type    text NOT NULL DEFAULT 'new'
                        CHECK (appointment_type IN ('new','follow_up','procedure','teleconsult','health_checkup')),
    mode                text NOT NULL DEFAULT 'in_person' CHECK (mode IN ('in_person','teleconsult','home_visit')),
    scheduled_start     timestamptz NOT NULL,
    scheduled_end       timestamptz NOT NULL,
    status              text NOT NULL DEFAULT 'booked'
                        CHECK (status IN ('booked','confirmed','checked_in','in_consultation','completed',
                                          'cancelled','no_show','rescheduled')),
    source              text NOT NULL DEFAULT 'walk_in' CHECK (source IN ('walk_in','phone','online','app','referral')),
    token_number        int,
    reason              text,
    notes               text,
    teleconsult_url     text,
    booked_by           uuid,
    checked_in_at       timestamptz,
    cancelled_at        timestamptz,
    cancel_reason       text,
    rescheduled_from_id uuid REFERENCES appointments(id),
    reminder_sent_at    timestamptz,
    custom_fields       jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CHECK (scheduled_end > scheduled_start)
);
CREATE INDEX idx_appt_practitioner ON appointments (practitioner_id, scheduled_start);
CREATE INDEX idx_appt_patient      ON appointments (patient_id, scheduled_start DESC);
CREATE INDEX idx_appt_facility_day ON appointments (facility_id, scheduled_start);
-- Slot-based booking: one active booking per practitioner per slot start.
-- Walk-ins (token queue) are exempt, so a doctor can still be over-booked on purpose.
CREATE UNIQUE INDEX uq_appt_slot ON appointments (practitioner_id, scheduled_start)
    WHERE status IN ('booked','confirmed','checked_in','in_consultation') AND source <> 'walk_in';

-- ENCOUNTER = one clinical/financial episode: an OPD visit, an admission,
-- an ER visit, a lab-only or pharmacy-only visit. Charges, orders, notes,
-- prescriptions and invoices all attach here.

-- migrate:down
-- TODO: add drop statements
