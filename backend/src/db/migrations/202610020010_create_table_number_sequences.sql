-- migrate:up
CREATE TABLE number_sequences (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    facility_id     uuid REFERENCES facilities(id),   -- NULL = organization-wide series
    seq_key         text NOT NULL,                    -- 'UHID','ENCOUNTER','INVOICE','RECEIPT','PO','GRN' ...
    prefix          text NOT NULL DEFAULT '',
    suffix          text NOT NULL DEFAULT '',
    include_year    boolean NOT NULL DEFAULT false,   -- inserts 2-digit year after prefix
    padding         int NOT NULL DEFAULT 6 CHECK (padding BETWEEN 1 AND 12),
    current_value   bigint NOT NULL DEFAULT 0,
    reset_policy    text NOT NULL DEFAULT 'never' CHECK (reset_policy IN ('never','yearly','monthly')),
    last_reset_on   date NOT NULL DEFAULT CURRENT_DATE
);
CREATE UNIQUE INDEX uq_number_sequences
    ON number_sequences (organization_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid), seq_key);

-- migrate:down
-- TODO: add drop statements
