-- migrate:up
CREATE TABLE practitioner_schedules (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id    uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    facility_id        uuid NOT NULL REFERENCES facilities(id),
    department_id      uuid REFERENCES departments(id),
    day_of_week        smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),   -- 0 = Sunday
    start_time         time NOT NULL,
    end_time           time NOT NULL,
    slot_minutes       int NOT NULL DEFAULT 15 CHECK (slot_minutes > 0),
    max_appointments   int,                                   -- NULL = slot_count
    consultation_mode  text NOT NULL DEFAULT 'in_person' CHECK (consultation_mode IN ('in_person','teleconsult','both')),
    valid_from         date,
    valid_to           date,
    is_active          boolean NOT NULL DEFAULT true,
    CHECK (end_time > start_time)
);
CREATE INDEX idx_prac_sched ON practitioner_schedules (practitioner_id, facility_id, day_of_week);

-- Leave, holidays, blocked time

-- migrate:down
-- TODO: add drop statements
