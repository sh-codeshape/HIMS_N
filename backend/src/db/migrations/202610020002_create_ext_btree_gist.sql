-- migrate:up
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- exclusion constraints (no overlaps)

-- migrate:down
-- TODO: add drop statements
