-- migrate:up
CREATE TABLE package_items (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id     uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    service_id     uuid NOT NULL REFERENCES services(id),
    quantity       numeric(12,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    is_optional    boolean NOT NULL DEFAULT false,
    UNIQUE (package_id, service_id)
);

-- migrate:down
-- TODO: add drop statements
