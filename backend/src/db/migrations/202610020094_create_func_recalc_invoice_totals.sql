-- migrate:up
CREATE OR REPLACE FUNCTION recalc_invoice_totals(p_invoice_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    v_sub numeric(14,2); v_disc numeric(14,2); v_tax numeric(14,2);
    v_paid numeric(14,2); v_cn numeric(14,2); v_round numeric(14,2); v_wo numeric(14,2);
    v_total numeric(14,2); v_due numeric(14,2);
BEGIN
    SELECT COALESCE(SUM(gross_amount),0), COALESCE(SUM(discount_amount),0), COALESCE(SUM(tax_amount),0)
      INTO v_sub, v_disc, v_tax FROM invoice_lines WHERE invoice_id = p_invoice_id;

    SELECT COALESCE(SUM(CASE p.direction WHEN 'in' THEN pa.amount ELSE -pa.amount END), 0)
      INTO v_paid
      FROM payment_allocations pa JOIN payments p ON p.id = pa.payment_id
     WHERE pa.invoice_id = p_invoice_id AND p.status = 'completed';

    SELECT COALESCE(SUM(total_amount),0) INTO v_cn
      FROM credit_notes WHERE invoice_id = p_invoice_id AND status = 'issued';

    SELECT round_off, write_off_amount INTO v_round, v_wo FROM invoices WHERE id = p_invoice_id;

    v_total := v_sub - v_disc + v_tax + v_round;
    v_due   := v_total - v_cn - v_wo - v_paid;

    UPDATE invoices SET
        subtotal = v_sub, discount_total = v_disc, tax_total = v_tax,
        total_amount = v_total, credit_note_total = v_cn, paid_amount = v_paid, due_amount = v_due,
        status = CASE
            WHEN status IN ('draft','cancelled') THEN status
            WHEN v_wo > 0 AND v_due <= 0 THEN 'written_off'
            WHEN v_due <= 0 THEN 'paid'
            WHEN v_paid > 0 THEN 'partially_paid'
            ELSE 'issued' END
     WHERE id = p_invoice_id;
END $$;

-- migrate:down
-- TODO: add drop statements
