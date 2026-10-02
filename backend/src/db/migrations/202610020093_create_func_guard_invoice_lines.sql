-- migrate:up
CREATE OR REPLACE FUNCTION guard_invoice_lines() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_status text; v_id uuid := COALESCE(NEW.invoice_id, OLD.invoice_id);
BEGIN
    SELECT status INTO v_status FROM invoices WHERE id = v_id;
    IF v_status IS DISTINCT FROM 'draft' THEN
        RAISE EXCEPTION 'invoice % is % - lines are locked; issue a credit note instead', v_id, v_status;
    END IF;
    RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_invoice_lines_guard BEFORE INSERT OR UPDATE OR DELETE ON invoice_lines
    FOR EACH ROW EXECUTE FUNCTION guard_invoice_lines();

-- Re-derive every stored money field on an invoice from its lines,
-- allocations and credit notes. Called by triggers; safe to call manually.

-- migrate:down
-- TODO: add drop statements
