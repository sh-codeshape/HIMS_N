-- migrate:up
CREATE TABLE prescription_items (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id      uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    item_id              uuid REFERENCES items(id),            -- NULL = free-text / outside medicine
    drug_name            text NOT NULL,
    dose_quantity        numeric(10,3),
    dose_unit            text,
    frequency_code       text,                                 -- 'OD','BD','TDS','1-0-1','SOS' ...
    doses_per_day        numeric(6,2),
    route                text,
    duration_value       int,
    duration_unit        text CHECK (duration_unit IN ('days','weeks','months')),
    total_quantity       numeric(14,3),
    instructions         text,                                 -- "after food"
    is_prn               boolean NOT NULL DEFAULT false,
    prn_reason           text,
    substitution_allowed boolean NOT NULL DEFAULT true,
    start_at             timestamptz,
    stop_at              timestamptz,
    status               text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','stopped','cancelled','on_hold')),
    sort_order           int NOT NULL DEFAULT 0
);
CREATE INDEX idx_prescription_items_rx ON prescription_items (prescription_id);

-- Medication Administration Record (inpatient nursing)

-- migrate:down
-- TODO: add drop statements
