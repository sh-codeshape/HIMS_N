-- migrate:up
CREATE TABLE stock_transfers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    transfer_no     text NOT NULL,
    from_store_id   uuid NOT NULL REFERENCES stores(id),
    to_store_id     uuid NOT NULL REFERENCES stores(id),
    status          text NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested','approved','in_transit','received','rejected','cancelled')),
    requested_by    uuid,
    approved_by     uuid,
    requested_at    timestamptz NOT NULL DEFAULT now(),
    received_at     timestamptz,
    notes           text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, transfer_no),
    CHECK (from_store_id <> to_store_id)
);

-- migrate:down
-- TODO: add drop statements
