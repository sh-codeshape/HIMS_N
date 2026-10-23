-- migrate:up
-- Module registry: stores which top-level modules are enabled/disabled globally.
-- A developer can toggle modules on/off. When disabled, no one (except developer)
-- can see or access the module.
CREATE TABLE module_registry (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_key    text NOT NULL UNIQUE,      -- matches sidebarConfig key: 'pharmacy', 'laboratory', etc.
    label         text NOT NULL,             -- 'Pharmacy / OOM', 'Laboratory'
    is_enabled    boolean NOT NULL DEFAULT true,
    disabled_by   uuid REFERENCES users(id),
    disabled_at   timestamptz,
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- migrate:down
-- TODO: add drop statements
