-- migrate:up
CREATE TABLE users (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   uuid NOT NULL REFERENCES organizations(id),
    username          citext NOT NULL,
    email             citext,
    phone             text,
    full_name         text NOT NULL,
    password_hash     text,                           -- NULL when using external SSO
    external_auth_id  text,
    is_active         boolean NOT NULL DEFAULT true,
    is_superadmin     boolean NOT NULL DEFAULT false,
    mfa_enabled       boolean NOT NULL DEFAULT false,
    failed_attempts   int NOT NULL DEFAULT 0,
    locked_until      timestamptz,
    last_login_at     timestamptz,
    password_changed_at timestamptz,
    default_facility_id uuid REFERENCES facilities(id),
    preferences       jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, username)
);

-- migrate:down
-- TODO: add drop statements
