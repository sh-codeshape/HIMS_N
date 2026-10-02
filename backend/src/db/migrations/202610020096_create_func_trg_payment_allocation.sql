-- migrate:up
CREATE OR REPLACE FUNCTION trg_payment_allocation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_status text;
BEGIN
    IF TG_OP IN ('INSERT','UPDATE') THEN
        SELECT status INTO v_status FROM invoices WHERE id = NEW.invoice_id;
        IF v_status IN ('draft','cancelled') THEN
            RAISE EXCEPTION 'cannot allocate a payment to a % invoice', v_status;
        END IF;
    END IF;

    IF TG_OP IN ('UPDATE','DELETE') THEN
        UPDATE payments SET allocated_amount =
            (SELECT COALESCE(SUM(amount),0) FROM payment_allocations WHERE payment_id = OLD.payment_id)
         WHERE id = OLD.payment_id;
        PERFORM recalc_invoice_totals(OLD.invoice_id);
    END IF;
    IF TG_OP IN ('INSERT','UPDATE') THEN
        UPDATE payments SET allocated_amount =
            (SELECT COALESCE(SUM(amount),0) FROM payment_allocations WHERE payment_id = NEW.payment_id)
         WHERE id = NEW.payment_id;
        PERFORM recalc_invoice_totals(NEW.invoice_id);
    END IF;
    RETURN NULL;
END $$;
CREATE TRIGGER trg_payment_alloc_sync AFTER INSERT OR UPDATE OR DELETE ON payment_allocations
    FOR EACH ROW EXECUTE FUNCTION trg_payment_allocation();

-- If a payment is reversed/failed, the invoices it paid must be re-derived.

-- migrate:down
-- TODO: add drop statements
