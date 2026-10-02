-- migrate:up
CREATE TABLE schedule_exceptions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    facility_id     uuid REFERENCES facilities(id),
    exception_type  text NOT NULL DEFAULT 'leave' CHECK (exception_type IN ('leave','holiday','conference','block','other')),
    starts_at       timestamptz NOT NULL,
    ends_at         timestamptz NOT NULL,
    reason          text,
    CHECK (ends_at > starts_at)
);
CREATE INDEX idx_sched_exc ON schedule_exceptions (practitioner_id, starts_at);

-- ---------------------------------------------------------------------
-- 4. PATIENT REGISTRY (MPI)
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
