-- migrate:up
CREATE TABLE cash_counters (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id uuid NOT NULL REFERENCES facilities(id),
    code        text NOT NULL,
    name        text NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    UNIQUE (facility_id, code)
);

-- Cashier shift: open with float, close with count, variance is computed.

-- migrate:down
-- TODO: add drop statements
