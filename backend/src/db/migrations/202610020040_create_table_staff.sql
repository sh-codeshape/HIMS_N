-- migrate:up
CREATE TABLE staff (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    user_id         uuid UNIQUE REFERENCES users(id),
    department_id   uuid REFERENCES departments(id),
    staff_code      text NOT NULL,
    first_name      text NOT NULL,
    last_name       text,
    staff_type      text NOT NULL CHECK (staff_type IN ('doctor','nurse','technician','pharmacist','receptionist',
                                                         'billing','admin','paramedic','support','other')),
    designation     text,
    phone           text,
    email           citext,
    joined_on       date,
    left_on         date,
    is_active       boolean NOT NULL DEFAULT true,
    custom_fields   jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, staff_code)
);
CREATE INDEX idx_staff_department ON staff (department_id);

ALTER TABLE departments ADD CONSTRAINT fk_departments_head FOREIGN KEY (head_staff_id) REFERENCES staff(id);

-- migrate:down
-- TODO: add drop statements
