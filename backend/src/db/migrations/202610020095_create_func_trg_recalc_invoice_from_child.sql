-- migrate:up
CREATE OR REPLACE FUNCTION trg_recalc_invoice_from_child() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalc_invoice_totals(OLD.invoice_id);
    ELSE
        PERFORM recalc_invoice_totals(NEW.invoice_id);
        IF TG_OP = 'UPDATE' AND OLD.invoice_id IS DISTINCT FROM NEW.invoice_id THEN
            PERFORM recalc_invoice_totals(OLD.invoice_id);
        END IF;
    END IF;
    RETURN NULL;
END $$;
CREATE TRIGGER trg_invoice_lines_recalc AFTER INSERT OR UPDATE OR DELETE ON invoice_lines
    FOR EACH ROW EXECUTE FUNCTION trg_recalc_invoice_from_child();
CREATE TRIGGER trg_credit_notes_recalc AFTER INSERT OR UPDATE OR DELETE ON credit_notes
    FOR EACH ROW EXECUTE FUNCTION trg_recalc_invoice_from_child();

-- Allocations: only against open invoices; keep payments.allocated_amount in sync.

-- migrate:down
-- TODO: add drop statements
