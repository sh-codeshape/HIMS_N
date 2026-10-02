-- migrate:up
CREATE TABLE purchase_order_items (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id           uuid NOT NULL REFERENCES items(id),
    ordered_qty       numeric(14,3) NOT NULL CHECK (ordered_qty > 0),
    received_qty      numeric(14,3) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
    unit_cost         numeric(14,4) NOT NULL CHECK (unit_cost >= 0),
    discount_percent  numeric(5,2) NOT NULL DEFAULT 0,
    tax_group_id      uuid REFERENCES tax_groups(id),
    tax_amount        numeric(14,2) NOT NULL DEFAULT 0,
    line_total        numeric(14,2) NOT NULL DEFAULT 0
);
CREATE INDEX idx_po_items_po ON purchase_order_items (purchase_order_id);

-- migrate:down
-- TODO: add drop statements
