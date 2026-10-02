-- migrate:up
CREATE TABLE staff_facilities (        -- staff may work at several branches
    staff_id    uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    PRIMARY KEY (staff_id, facility_id)
);

-- migrate:down
-- TODO: add drop statements
