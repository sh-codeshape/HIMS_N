-- migrate:up
CREATE TABLE blood_issues (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_request_id    uuid NOT NULL REFERENCES blood_requests(id),
    blood_unit_id       uuid NOT NULL UNIQUE REFERENCES blood_units(id),
    crossmatch_result   text CHECK (crossmatch_result IN ('compatible','incompatible','pending')),
    issued_at           timestamptz,
    issued_by           uuid REFERENCES staff(id),
    transfused_at       timestamptz,
    transfusion_reaction text,
    charge_id           uuid REFERENCES charges(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- migrate:down
-- TODO: add drop statements
