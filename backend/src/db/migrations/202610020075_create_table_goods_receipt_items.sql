-- migrate:up
CREATE TABLE goods_receipt_items (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id   uuid NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    po_item_id         uuid REFERENCES purchase_order_items(id),
    item_id            uuid NOT NULL REFERENCES items(id),
    batch_id           uuid REFERENCES stock_batches(id),   -- set when the GRN is posted
    batch_no           text NOT NULL,
    manufactured_on    date,
    expiry_date        date,
    received_qty       numeric(14,3) NOT NULL CHECK (received_qty > 0),
    free_qty           numeric(14,3) NOT NULL DEFAULT 0 CHECK (free_qty >= 0),
    unit_cost          numeric(14,4) NOT NULL CHECK (unit_cost >= 0),
    mrp                numeric(14,2),
    discount_amount    numeric(14,2) NOT NULL DEFAULT 0,
    tax_group_id       uuid REFERENCES tax_groups(id),
    tax_amount         numeric(14,2) NOT NULL DEFAULT 0,
    line_total         numeric(14,2) NOT NULL DEFAULT 0
);
CREATE INDEX idx_grn_items_grn ON goods_receipt_items (goods_receipt_id);

-- Inter-store requisition / transfer

-- migrate:down
-- TODO: add drop statements
