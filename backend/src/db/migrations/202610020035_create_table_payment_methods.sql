-- migrate:up
CREATE TABLE payment_methods (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id    uuid NOT NULL REFERENCES organizations(id),
    code               text NOT NULL,
    name               text NOT NULL,
    method_type        text NOT NULL CHECK (method_type IN ('cash','card','upi','net_banking','cheque','wallet',
                                                            'insurance','credit','other')),
    requires_reference boolean NOT NULL DEFAULT false,
    is_active          boolean NOT NULL DEFAULT true,
    UNIQUE (organization_id, code)
);

-- migrate:down
-- TODO: add drop statements
