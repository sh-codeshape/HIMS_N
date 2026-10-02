-- migrate:up
CREATE TABLE discount_reasons (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      uuid NOT NULL REFERENCES organizations(id),
    code                 text NOT NULL,
    name                 text NOT NULL,
    default_percent      numeric(5,2) CHECK (default_percent BETWEEN 0 AND 100),
    max_percent          numeric(5,2) CHECK (max_percent BETWEEN 0 AND 100),
    requires_approval    boolean NOT NULL DEFAULT false,
    approver_role_id     uuid REFERENCES roles(id),
    is_active            boolean NOT NULL DEFAULT true,
    UNIQUE (organization_id, code)
);

-- PAYERS: insurers, TPAs, corporates, government schemes (PM-JAY, CGHS, ECHS ...)

-- migrate:down
-- TODO: add drop statements
