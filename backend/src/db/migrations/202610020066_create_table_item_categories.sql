-- migrate:up
CREATE TABLE item_categories (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    parent_id       uuid REFERENCES item_categories(id),
    code            text NOT NULL,
    name            text NOT NULL,
    category_type   text NOT NULL DEFAULT 'drug'
                    CHECK (category_type IN ('drug','consumable','implant','surgical','reagent','equipment','general')),
    is_active       boolean NOT NULL DEFAULT true,
    UNIQUE (organization_id, code)
);

-- Drugs, consumables, implants, reagents, equipment

-- migrate:down
-- TODO: add drop statements
