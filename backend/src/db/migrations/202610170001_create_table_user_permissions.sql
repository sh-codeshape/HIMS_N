-- migrate:up
-- User-level direct permission grants.
-- Allows the super admin to give a specific user permission to see/do something
-- regardless of the roles assigned to them (e.g. "this receptionist can view lab reports").
CREATE TABLE user_permissions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by    uuid REFERENCES users(id),
    granted_at    timestamptz NOT NULL DEFAULT now(),
    expires_at    timestamptz,          -- NULL = no expiry
    UNIQUE (user_id, permission_id)
);

-- migrate:down
-- TODO: add drop statements
