-- migrate:up
CREATE TABLE items (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       uuid NOT NULL REFERENCES organizations(id),
    category_id           uuid REFERENCES item_categories(id),
    manufacturer_id       uuid REFERENCES manufacturers(id),
    tax_group_id          uuid REFERENCES tax_groups(id),
    medical_code_id       uuid REFERENCES medical_codes(id),     -- ATC / RxNorm / SNOMED
    service_id            uuid REFERENCES services(id),          -- optional link when billed via charge master
    code                  text NOT NULL,
    name                  text NOT NULL,
    generic_name          text,
    brand_name            text,
    item_type             text NOT NULL DEFAULT 'drug'
                          CHECK (item_type IN ('drug','consumable','implant','reagent','equipment','general')),
    dosage_form           text,                                  -- tablet, syrup, injection ...
    strength              text,
    route                 text,
    drug_schedule         text NOT NULL DEFAULT 'none' CHECK (drug_schedule IN ('none','otc','h','h1','x','g')),
    requires_prescription boolean NOT NULL DEFAULT false,
    is_controlled         boolean NOT NULL DEFAULT false,
    is_high_alert         boolean NOT NULL DEFAULT false,
    base_uom              text NOT NULL DEFAULT 'unit',          -- unit the stock is counted in
    pack_size             numeric(12,3) NOT NULL DEFAULT 1 CHECK (pack_size > 0),   -- base units per pack
    hsn_code              text,
    mrp                   numeric(14,2),                         -- per base unit, default; batches override
    reorder_level         numeric(14,3) NOT NULL DEFAULT 0,
    reorder_quantity      numeric(14,3) NOT NULL DEFAULT 0,
    max_stock_level       numeric(14,3),
    track_batches         boolean NOT NULL DEFAULT true,
    track_expiry          boolean NOT NULL DEFAULT true,
    storage_conditions    text,
    barcode               text,
    is_active             boolean NOT NULL DEFAULT true,
    custom_fields         jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code)
);
CREATE INDEX idx_items_name_trgm    ON items USING gin (name gin_trgm_ops);
CREATE INDEX idx_items_generic_trgm ON items USING gin (generic_name gin_trgm_ops);
CREATE INDEX idx_items_barcode      ON items (barcode);

-- migrate:down
-- TODO: add drop statements
