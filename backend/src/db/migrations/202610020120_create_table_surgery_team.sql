-- migrate:up
CREATE TABLE surgery_team (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    surgery_id  uuid NOT NULL REFERENCES surgeries(id) ON DELETE CASCADE,
    staff_id    uuid NOT NULL REFERENCES staff(id),
    role        text NOT NULL CHECK (role IN ('primary_surgeon','assistant_surgeon','anesthetist','scrub_nurse',
                                              'circulating_nurse','technician','other')),
    UNIQUE (surgery_id, staff_id, role)
);

-- ---- Dietary ----

-- migrate:down
-- TODO: add drop statements
