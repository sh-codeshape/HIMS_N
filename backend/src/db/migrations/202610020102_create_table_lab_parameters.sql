-- migrate:up
CREATE TABLE lab_parameters (          -- analytes under a test / panel
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_service_id  uuid NOT NULL REFERENCES lab_test_definitions(service_id) ON DELETE CASCADE,
    code             text NOT NULL,
    name             text NOT NULL,
    unit             text,
    data_type        text NOT NULL DEFAULT 'numeric' CHECK (data_type IN ('numeric','text','coded')),
    decimal_places   smallint,
    formula          text,                                     -- derived analytes
    allowed_values   jsonb,
    medical_code_id  uuid REFERENCES medical_codes(id),        -- LOINC
    sort_order       int NOT NULL DEFAULT 0,
    is_active        boolean NOT NULL DEFAULT true,
    UNIQUE (test_service_id, code)
);

-- migrate:down
-- TODO: add drop statements
