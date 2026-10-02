-- migrate:up
CREATE TABLE lab_reference_ranges (    -- by sex and age band
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter_id    uuid NOT NULL REFERENCES lab_parameters(id) ON DELETE CASCADE,
    gender          text NOT NULL DEFAULT 'any' CHECK (gender IN ('male','female','any')),
    age_min_days    int NOT NULL DEFAULT 0,
    age_max_days    int,
    low_value       numeric,
    high_value      numeric,
    critical_low    numeric,
    critical_high   numeric,
    range_text      text,
    CHECK (age_max_days IS NULL OR age_max_days >= age_min_days)
);
CREATE INDEX idx_lab_ref_ranges ON lab_reference_ranges (parameter_id, gender);

-- migrate:down
-- TODO: add drop statements
