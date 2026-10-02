-- migrate:up
CREATE TABLE permissions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code        text NOT NULL UNIQUE,                 -- 'billing.invoice.create'
    module      text NOT NULL,
    description text
);

-- migrate:down
-- TODO: add drop statements
