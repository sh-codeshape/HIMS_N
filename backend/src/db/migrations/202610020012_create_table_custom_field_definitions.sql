-- migrate:up
CREATE TABLE custom_field_definitions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    entity_type     text NOT NULL,                    -- table name, e.g. 'patients'
    field_key       text NOT NULL,
    label           text NOT NULL,
    data_type       text NOT NULL CHECK (data_type IN ('text','number','date','boolean','select','multiselect')),
    options         jsonb,                            -- choices for select / multiselect
    validation      jsonb,                            -- min, max, regex ...
    is_required     boolean NOT NULL DEFAULT false,
    is_searchable   boolean NOT NULL DEFAULT false,
    sort_order      int NOT NULL DEFAULT 0,
    is_active       boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, entity_type, field_key)
);

-- ---- Identity & access ----------------------------------------------

-- migrate:down
-- TODO: add drop statements
