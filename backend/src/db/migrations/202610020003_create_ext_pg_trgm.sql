-- migrate:up
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- fuzzy patient / drug search

-- migrate:down
-- TODO: add drop statements
