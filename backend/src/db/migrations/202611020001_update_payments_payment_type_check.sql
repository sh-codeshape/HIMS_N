-- migrate:up
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
  CHECK (payment_type IN ('invoice_payment', 'advance', 'refund', 'payer_settlement', 'settlement', 'payment'));

-- migrate:down
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
  CHECK (payment_type IN ('invoice_payment', 'advance', 'refund', 'payer_settlement'));
