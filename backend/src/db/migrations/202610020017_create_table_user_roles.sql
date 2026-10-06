-- migrate:up
CREATE TABLE user_roles (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    facility_id uuid REFERENCES facilities(id),       -- NULL = role applies at every facility
    valid_from  date,
    valid_to    date
);
CREATE UNIQUE INDEX uq_user_roles
    ON user_roles (user_id, role_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ---- Shared building blocks -----------------------------------------
-- Standard code systems (ICD-10, SNOMED CT, LOINC, CPT, ATC, HSN/SAC ...).

-- migrate:down
-- TODO: add drop statements
--/fixes