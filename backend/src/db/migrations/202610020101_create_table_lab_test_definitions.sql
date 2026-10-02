-- migrate:up
CREATE TABLE lab_test_definitions (    -- extends a `services` row of type 'lab_test'
    service_id          uuid PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    lab_section         text,                                  -- haematology, biochemistry, microbiology ...
    specimen_type       text,
    container           text,
    min_volume_ml       numeric(8,2),
    method              text,
    tat_hours           int,
    fasting_required    boolean NOT NULL DEFAULT false,
    is_panel            boolean NOT NULL DEFAULT false,
    patient_instructions text
);

-- migrate:down
-- TODO: add drop statements
