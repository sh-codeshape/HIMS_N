-- migrate:up
CREATE TABLE medical_codes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code_system text NOT NULL,                        -- 'ICD10','SNOMED','LOINC','CPT','ATC','HSN','SAC'
    code        text NOT NULL,
    display     text NOT NULL,
    parent_code text,
    is_active   boolean NOT NULL DEFAULT true,
    UNIQUE (code_system, code)
);
CREATE INDEX idx_medical_codes_display_trgm ON medical_codes USING gin (display gin_trgm_ops);

-- Polymorphic file store (scans, reports, consent forms, claim documents).

-- migrate:down
-- TODO: add drop statements
