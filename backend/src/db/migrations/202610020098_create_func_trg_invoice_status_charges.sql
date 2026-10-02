-- migrate:up
CREATE OR REPLACE FUNCTION trg_invoice_status_charges() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status = 'draft' AND NEW.status = 'issued' THEN
        UPDATE charges SET status = 'billed'
         WHERE status = 'billable'
           AND id IN (SELECT charge_id FROM invoice_lines WHERE invoice_id = NEW.id AND charge_id IS NOT NULL);
    ELSIF OLD.status <> 'cancelled' AND NEW.status = 'cancelled' THEN
        UPDATE charges SET status = 'billable'
         WHERE status = 'billed'
           AND id IN (SELECT charge_id FROM invoice_lines WHERE invoice_id = NEW.id AND charge_id IS NOT NULL);
    END IF;
    RETURN NULL;
END $$;
CREATE TRIGGER trg_invoices_charge_sync AFTER UPDATE OF status ON invoices
    FOR EACH ROW EXECUTE FUNCTION trg_invoice_status_charges();


-- ---------------------------------------------------------------------
-- 9. ORDERS, LAB, IMAGING
--    One generic ORDER -> ORDER_ITEMS pipeline serves lab, radiology,
--    procedures, nursing tasks, diet and referrals. Each item points at a
--    service (so it is billable) and at the charge it generated.
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
