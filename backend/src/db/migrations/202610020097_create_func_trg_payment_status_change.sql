-- migrate:up
CREATE OR REPLACE FUNCTION trg_payment_status_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        FOR r IN SELECT DISTINCT invoice_id FROM payment_allocations WHERE payment_id = NEW.id LOOP
            PERFORM recalc_invoice_totals(r.invoice_id);
        END LOOP;
    END IF;
    RETURN NULL;
END $$;
CREATE TRIGGER trg_payments_status AFTER UPDATE OF status ON payments
    FOR EACH ROW EXECUTE FUNCTION trg_payment_status_change();

-- Issuing an invoice marks its charges 'billed'; cancelling releases them.

-- migrate:down
-- TODO: add drop statements
