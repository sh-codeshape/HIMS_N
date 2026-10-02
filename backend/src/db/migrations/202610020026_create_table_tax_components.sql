-- migrate:up
CREATE TABLE tax_components (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_group_id  uuid NOT NULL REFERENCES tax_groups(id) ON DELETE CASCADE,
    component_code text NOT NULL CHECK (component_code IN ('CGST','SGST','UTGST','IGST','CESS','VAT','OTHER')),
    rate          numeric(6,3) NOT NULL CHECK (rate >= 0),
    applies_to    text NOT NULL DEFAULT 'both' CHECK (applies_to IN ('intra_state','inter_state','both')),
    UNIQUE (tax_group_id, component_code, applies_to)
);

-- migrate:down
-- TODO: add drop statements
