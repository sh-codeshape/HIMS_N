-- migrate:up
CREATE TABLE lab_results (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id    uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    parameter_id     uuid NOT NULL REFERENCES lab_parameters(id),
    specimen_id      uuid REFERENCES lab_specimens(id),
    value_numeric    numeric,
    value_text       text,
    unit             text,
    reference_low    numeric,                                  -- snapshot of the range applied
    reference_high   numeric,
    flag             text CHECK (flag IN ('normal','low','high','critical_low','critical_high','abnormal','positive','negative')),
    status           text NOT NULL DEFAULT 'preliminary' CHECK (status IN ('preliminary','final','corrected','cancelled')),
    instrument       text,
    comments         text,
    performed_by     uuid REFERENCES staff(id),
    performed_at     timestamptz,
    verified_by      uuid REFERENCES staff(id),
    verified_at      timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (order_item_id, parameter_id)
);
CREATE INDEX idx_lab_results_item ON lab_results (order_item_id);

-- ---- Radiology / imaging / cardiology reports ----

-- migrate:down
-- TODO: add drop statements
