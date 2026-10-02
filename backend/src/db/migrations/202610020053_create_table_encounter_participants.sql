-- migrate:up
CREATE TABLE encounter_participants (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id    uuid NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    staff_id        uuid NOT NULL REFERENCES staff(id),
    role            text NOT NULL CHECK (role IN ('primary','consulting','referring','assisting','nurse',
                                                  'anesthetist','surgeon','technician','other')),
    period_start    timestamptz,
    period_end      timestamptz
);
CREATE INDEX idx_encounter_participants ON encounter_participants (encounter_id);

-- Which coverage(s) pay for this encounter (primary / secondary)

-- migrate:down
-- TODO: add drop statements
