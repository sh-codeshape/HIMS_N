-- migrate:up
CREATE TABLE bed_assignments (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id              uuid NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    bed_id                    uuid NOT NULL REFERENCES beds(id),
    billing_bed_category_id   uuid REFERENCES bed_categories(id),  -- class billed (can differ on upgrade / unavailability)
    assigned_from             timestamptz NOT NULL DEFAULT now(),
    assigned_to               timestamptz,
    reason                    text,
    assigned_by               uuid,
    CHECK (assigned_to IS NULL OR assigned_to > assigned_from),
    EXCLUDE USING gist (bed_id WITH =,       tstzrange(assigned_from, assigned_to) WITH &&),
    EXCLUDE USING gist (admission_id WITH =, tstzrange(assigned_from, assigned_to) WITH &&)
);
CREATE INDEX idx_bed_assignments_adm ON bed_assignments (admission_id);

-- migrate:down
-- TODO: add drop statements
