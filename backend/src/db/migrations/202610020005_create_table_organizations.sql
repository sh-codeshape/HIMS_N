-- migrate:up
CREATE TABLE organizations (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code             text NOT NULL UNIQUE,
    name             text NOT NULL,
    legal_name       text,
    gstin            text,
    pan              text,
    default_currency char(3) NOT NULL DEFAULT 'INR',
    timezone         text NOT NULL DEFAULT 'Asia/Kolkata',
    is_active        boolean NOT NULL DEFAULT true,
    settings         jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- migrate:down
-- TODO: add drop statements
