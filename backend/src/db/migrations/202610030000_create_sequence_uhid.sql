-- migrate:up
CREATE SEQUENCE IF NOT EXISTS uhid_seq START 1;

-- migrate:down
DROP SEQUENCE IF EXISTS uhid_seq;
