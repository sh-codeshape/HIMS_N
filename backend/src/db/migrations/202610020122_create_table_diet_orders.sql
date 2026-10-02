-- migrate:up
CREATE TABLE diet_orders (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      uuid NOT NULL REFERENCES patients(id),
    encounter_id    uuid NOT NULL REFERENCES encounters(id),
    diet_type_id    uuid NOT NULL REFERENCES diet_types(id),
    meal_slots      text[] NOT NULL DEFAULT '{breakfast,lunch,dinner}',
    restrictions    text,
    start_date      date NOT NULL DEFAULT CURRENT_DATE,
    end_date        date,
    status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
    ordered_by      uuid REFERENCES practitioners(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_diet_orders_enc ON diet_orders (encounter_id);


-- ---------------------------------------------------------------------
-- 12. OPTIONAL MODULES (drop these tables if you do not need them)
-- ---------------------------------------------------------------------

-- migrate:down
-- TODO: add drop statements
