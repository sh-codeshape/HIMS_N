-- migrate:up
CREATE EXTENSION IF NOT EXISTS citext;       -- case-insensitive email/username

-- ---------------------------------------------------------------------
-- 1. PLATFORM: tenancy, configuration, RBAC, audit
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
