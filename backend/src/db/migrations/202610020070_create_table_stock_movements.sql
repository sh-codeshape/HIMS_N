-- migrate:up
CREATE TABLE stock_movements (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id        uuid NOT NULL REFERENCES stores(id),
    item_id         uuid NOT NULL REFERENCES items(id),
    batch_id        uuid NOT NULL REFERENCES stock_batches(id),
    movement_type   text NOT NULL CHECK (movement_type IN
                    ('opening','purchase_receipt','purchase_return','dispense','dispense_return',
                     'transfer_out','transfer_in','consumption','adjustment_in','adjustment_out',
                     'write_off_expired','write_off_damaged')),
    quantity        numeric(14,3) NOT NULL CHECK (quantity <> 0),
    unit_cost       numeric(14,4),
    reference_type  text,                                     -- 'goods_receipt','dispensation','stock_transfer' ...
    reference_id    uuid,
    moved_at        timestamptz NOT NULL DEFAULT now(),
    moved_by        uuid,
    notes           text
);
CREATE INDEX idx_stock_mov_item  ON stock_movements (item_id, store_id, moved_at DESC);
CREATE INDEX idx_stock_mov_batch ON stock_movements (batch_id, moved_at DESC);
CREATE INDEX idx_stock_mov_ref   ON stock_movements (reference_type, reference_id);

-- migrate:down
-- TODO: add drop statements
