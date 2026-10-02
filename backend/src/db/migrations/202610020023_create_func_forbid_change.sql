-- migrate:up
CREATE OR REPLACE FUNCTION forbid_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION '% is append-only; % is not allowed', TG_TABLE_NAME, TG_OP;
END $$;

-- Atomic, gap-free-per-transaction number generator with yearly/monthly reset.

-- migrate:down
-- TODO: add drop statements
