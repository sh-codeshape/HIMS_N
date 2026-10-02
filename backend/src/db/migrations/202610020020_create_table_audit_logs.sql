-- migrate:up
CREATE TABLE audit_logs (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occurred_at    timestamptz NOT NULL DEFAULT now(),
    user_id        uuid,
    table_name     text NOT NULL,
    record_id      text NOT NULL,
    action         text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
    old_data       jsonb,
    new_data       jsonb,
    request_id     text,
    ip_address     inet
);
CREATE INDEX idx_audit_logs_record ON audit_logs (table_name, record_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_user   ON audit_logs (user_id, occurred_at DESC);

-- ---------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
