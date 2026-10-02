-- migrate:up
CREATE TABLE encounter_coverages (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id         uuid NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_coverage_id  uuid NOT NULL REFERENCES patient_coverages(id),
    priority             smallint NOT NULL DEFAULT 1,
    is_cashless          boolean NOT NULL DEFAULT false,
    approved_limit       numeric(14,2),
    copay_percent        numeric(5,2) CHECK (copay_percent BETWEEN 0 AND 100),
    UNIQUE (encounter_id, patient_coverage_id)
);

-- ---------------------------------------------------------------------
-- 6. CLINICAL RECORD
-- ---------------------------------------------------------------------
-- Catalogue of "questions": BP systolic, temperature, SpO2, pain score ...
-- New vitals / scores need a row here, not a new column.

-- migrate:down
-- TODO: add drop statements
