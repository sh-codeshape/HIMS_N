-- migrate:up
CREATE TABLE purchase_orders (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    facility_id     uuid NOT NULL REFERENCES facilities(id),
    po_number       text NOT NULL,
    supplier_id     uuid NOT NULL REFERENCES suppliers(id),
    store_id        uuid NOT NULL REFERENCES stores(id),
    status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','approved','sent','partially_received','received','cancelled','closed')),
    order_date      date NOT NULL DEFAULT CURRENT_DATE,
    expected_date   date,
    subtotal        numeric(14,2) NOT NULL DEFAULT 0,
    tax_total       numeric(14,2) NOT NULL DEFAULT 0,
    total_amount    numeric(14,2) NOT NULL DEFAULT 0,
    terms           text,
    notes           text,
    approved_by     uuid,
    approved_at     timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, po_number)
);

-- migrate:down
-- TODO: add drop statements
