-- migrate:up
CREATE TABLE order_items (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id               uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_id             uuid NOT NULL REFERENCES services(id),
    quantity               numeric(12,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status                 text NOT NULL DEFAULT 'ordered'
                           CHECK (status IN ('ordered','scheduled','in_progress','completed','cancelled')),
    scheduled_at           timestamptz,
    started_at             timestamptz,
    completed_at           timestamptz,
    performed_by_staff_id  uuid REFERENCES staff(id),
    charge_id              uuid REFERENCES charges(id),
    notes                  text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_order_items_order  ON order_items (order_id);
CREATE INDEX idx_order_items_status ON order_items (status, scheduled_at);

-- ---- Laboratory ----

-- migrate:down
-- TODO: add drop statements
