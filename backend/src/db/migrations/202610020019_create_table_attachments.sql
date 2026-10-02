-- migrate:up
CREATE TABLE attachments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    entity_type     text NOT NULL,                    -- table name
    entity_id       uuid NOT NULL,
    category        text,                             -- 'lab_report','consent','id_proof','claim_doc' ...
    file_name       text NOT NULL,
    mime_type       text,
    size_bytes      bigint,
    storage_key     text NOT NULL,                    -- S3 / blob key, never the bytes
    checksum_sha256 text,
    is_confidential boolean NOT NULL DEFAULT false,
    uploaded_by     uuid,
    uploaded_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);
CREATE INDEX idx_attachments_entity ON attachments (entity_type, entity_id);

-- Row-level change trail. Consider partitioning by month at scale.

-- migrate:down
-- TODO: add drop statements
