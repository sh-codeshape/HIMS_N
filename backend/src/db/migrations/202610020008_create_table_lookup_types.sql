-- migrate:up
CREATE TABLE lookup_types (
    code        text PRIMARY KEY,
    name        text NOT NULL,
    description text,
    is_system   boolean NOT NULL DEFAULT false
);

-- migrate:down
-- TODO: add drop statements
