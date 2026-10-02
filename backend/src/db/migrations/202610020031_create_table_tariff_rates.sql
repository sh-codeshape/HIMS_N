-- migrate:up
CREATE TABLE tariff_rates (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tariff_plan_id   uuid NOT NULL REFERENCES tariff_plans(id) ON DELETE CASCADE,
    service_id       uuid NOT NULL REFERENCES services(id),
    bed_category_id  uuid REFERENCES bed_categories(id),
    facility_id      uuid REFERENCES facilities(id),
    rate             numeric(14,2) NOT NULL CHECK (rate >= 0),
    effective_from   date NOT NULL DEFAULT CURRENT_DATE,
    effective_to     date,                             -- exclusive; NULL = open ended
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CHECK (effective_to IS NULL OR effective_to > effective_from),
    EXCLUDE USING gist (
        tariff_plan_id WITH =,
        service_id WITH =,
        (COALESCE(bed_category_id, '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
        (COALESCE(facility_id,     '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
        daterange(effective_from, effective_to, '[)') WITH &&
    )
);
CREATE INDEX idx_tariff_rates_lookup ON tariff_rates (service_id, tariff_plan_id, effective_from);

-- Resolve the price: plan -> parent plans -> service default rate.

-- migrate:down
-- TODO: add drop statements
