-- migrate:up
CREATE TABLE stock_batches (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id          uuid NOT NULL REFERENCES stores(id),
    item_id           uuid NOT NULL REFERENCES items(id),
    supplier_id       uuid REFERENCES suppliers(id),
    batch_no          text NOT NULL,
    manufactured_on   date,
    expiry_date       date,
    mrp               numeric(14,2),
    purchase_rate     numeric(14,4),
    sale_rate         numeric(14,2),
    quantity_on_hand  numeric(14,3) NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved numeric(14,3) NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active','quarantined','expired','recalled','depleted')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (store_id, item_id, batch_no)
);
CREATE INDEX idx_stock_batches_item   ON stock_batches (item_id, store_id);
CREATE INDEX idx_stock_batches_expiry ON stock_batches (expiry_date) WHERE quantity_on_hand > 0;

-- APPEND-ONLY stock ledger. quantity is signed (+in / -out).
-- A trigger applies each row to stock_batches.quantity_on_hand.

-- migrate:down
-- TODO: add drop statements
