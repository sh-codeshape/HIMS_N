-- migrate:up
CREATE OR REPLACE FUNCTION touch_row() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_user uuid := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_by := COALESCE(NEW.created_by, v_user);
        NEW.updated_by := COALESCE(NEW.updated_by, v_user);
    ELSE
        NEW.updated_by := COALESCE(v_user, NEW.updated_by);
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END $$;

-- migrate:down
-- TODO: add drop statements
