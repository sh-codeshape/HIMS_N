-- migrate:up
CREATE OR REPLACE FUNCTION audit_row_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_user uuid := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
    v_old jsonb; v_new jsonb; v_id text;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD); v_id := OLD.id::text;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old := to_jsonb(OLD); v_new := to_jsonb(NEW); v_id := NEW.id::text;
    ELSE
        v_new := to_jsonb(NEW); v_id := NEW.id::text;
    END IF;
    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data, new_data, request_id)
    VALUES (v_user, TG_TABLE_NAME, v_id, TG_OP, v_old, v_new, NULLIF(current_setting('app.request_id', true), ''));
    RETURN NULL;
END $$;

-- migrate:down
-- TODO: add drop statements
