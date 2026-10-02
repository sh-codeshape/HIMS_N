-- migrate:up
CREATE TABLE dispensation_items (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensation_id       uuid NOT NULL REFERENCES dispensations(id) ON DELETE CASCADE,
    prescription_item_id  uuid REFERENCES prescription_items(id),
    item_id               uuid NOT NULL REFERENCES items(id),
    batch_id              uuid NOT NULL REFERENCES stock_batches(id),
    quantity              numeric(14,3) NOT NULL CHECK (quantity > 0),
    unit_price            numeric(14,2) NOT NULL CHECK (unit_price >= 0),   -- per base unit
    mrp                   numeric(14,2),
    discount_amount       numeric(14,2) NOT NULL DEFAULT 0,
    tax_group_id          uuid REFERENCES tax_groups(id),
    tax_amount            numeric(14,2) NOT NULL DEFAULT 0,
    line_total            numeric(14,2) NOT NULL DEFAULT 0,
    charge_id             uuid REFERENCES charges(id),
    original_item_id      uuid REFERENCES dispensation_items(id)
);
CREATE INDEX idx_dispensation_items ON dispensation_items (dispensation_id);
CREATE INDEX idx_dispensation_items_batch ON dispensation_items (batch_id);

-- ---------------------------------------------------------------------
-- 11. INPATIENT: WARDS, BEDS, ADMISSIONS, OT, DISCHARGE
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
