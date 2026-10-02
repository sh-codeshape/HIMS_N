-- migrate:up
CREATE OR REPLACE FUNCTION apply_stock_movement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    UPDATE stock_batches
       SET quantity_on_hand = quantity_on_hand + NEW.quantity,
           status = CASE WHEN status = 'active' AND quantity_on_hand + NEW.quantity = 0 THEN 'depleted'
                         WHEN status = 'depleted' AND quantity_on_hand + NEW.quantity > 0 THEN 'active'
                         ELSE status END
     WHERE id = NEW.batch_id AND store_id = NEW.store_id AND item_id = NEW.item_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'stock movement references batch % that does not match store/item', NEW.batch_id;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_stock_movements_apply AFTER INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION apply_stock_movement();
CREATE TRIGGER trg_stock_movements_immutable BEFORE UPDATE OR DELETE ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION forbid_change();

-- PROCUREMENT

-- migrate:down
-- TODO: add drop statements
