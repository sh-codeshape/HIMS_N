-- migrate:up
CREATE TABLE rooms (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id     uuid NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    room_no     text NOT NULL,
    room_type   text,
    is_active   boolean NOT NULL DEFAULT true,
    UNIQUE (ward_id, room_no)
);

-- migrate:down
-- TODO: add drop statements
