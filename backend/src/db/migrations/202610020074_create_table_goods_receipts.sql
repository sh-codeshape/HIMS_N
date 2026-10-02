-- migrate:up
CREATE TABLE goods_receipts (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       uuid NOT NULL REFERENCES organizations(id),
    facility_id           uuid NOT NULL REFERENCES facilities(id),
    grn_number            text NOT NULL,
    purchase_order_id     uuid REFERENCES purchase_orders(id),
    supplier_id           uuid NOT NULL REFERENCES suppliers(id),
    store_id              uuid NOT NULL REFERENCES stores(id),
    supplier_invoice_no   text,
    supplier_invoice_date date,
    received_at           timestamptz NOT NULL DEFAULT now(),
    status                text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','posted','cancelled')),
    subtotal              numeric(14,2) NOT NULL DEFAULT 0,
    discount_total        numeric(14,2) NOT NULL DEFAULT 0,
    tax_total             numeric(14,2) NOT NULL DEFAULT 0,
    total_amount          numeric(14,2) NOT NULL DEFAULT 0,
    received_by           uuid,
    notes                 text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (facility_id, grn_number)
);

-- migrate:down
-- TODO: add drop statements
