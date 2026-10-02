-- migrate:up
CREATE TABLE stock_transfer_items (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_transfer_id uuid NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    item_id           uuid NOT NULL REFERENCES items(id),
    batch_id          uuid REFERENCES stock_batches(id),
    requested_qty     numeric(14,3) NOT NULL CHECK (requested_qty > 0),
    issued_qty        numeric(14,3) NOT NULL DEFAULT 0 CHECK (issued_qty >= 0),
    received_qty      numeric(14,3) NOT NULL DEFAULT 0 CHECK (received_qty >= 0)
);
CREATE INDEX idx_stock_transfer_items ON stock_transfer_items (stock_transfer_id);


-- ---------------------------------------------------------------------
-- 8. BILLING & REVENUE CYCLE
--    CHARGES (accrue) -> INVOICES (bill) -> PAYMENTS (settle)
--    plus CREDIT NOTES, ADVANCES, CASH SESSIONS, PRE-AUTH and CLAIMS
--
--    Amount rules (enforced by CHECK constraints):
--      gross   = quantity x unit_price           (tax-EXCLUSIVE base price;
--                                                  back out tax from MRP-inclusive items in the app)
--      taxable = gross - discount
--      net     = taxable + tax
--    All discounts live on lines so tax is always computed on the taxable base.
-- ---------------------------------------------------------------------

-- A package opened on an encounter (e.g. "Knee replacement package")

-- migrate:down
-- TODO: add drop statements
