-- migrate:up
CREATE TABLE operation_theatres (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id   uuid NOT NULL REFERENCES facilities(id),
    department_id uuid REFERENCES departments(id),
    code          text NOT NULL,
    name          text NOT NULL,
    ot_type       text NOT NULL DEFAULT 'major' CHECK (ot_type IN ('major','minor','cath_lab','endoscopy','labour_room','other')),
    is_active     boolean NOT NULL DEFAULT true,
    UNIQUE (facility_id, code)
);

-- migrate:down
-- TODO: add drop statements
