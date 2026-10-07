-- migrate:up
ALTER TABLE encounters
ADD COLUMN IF NOT EXISTS attendant_name text,
ADD COLUMN IF NOT EXISTS attendant_relation text,
ADD COLUMN IF NOT EXISTS attendant_phone text;

ALTER TABLE admissions
ADD COLUMN IF NOT EXISTS attendant_name text,
ADD COLUMN IF NOT EXISTS attendant_relation text,
ADD COLUMN IF NOT EXISTS attendant_phone text;

-- migrate:down
ALTER TABLE encounters
DROP COLUMN IF EXISTS attendant_name,
DROP COLUMN IF EXISTS attendant_relation,
DROP COLUMN IF EXISTS attendant_phone;

ALTER TABLE admissions
DROP COLUMN IF EXISTS attendant_name,
DROP COLUMN IF EXISTS attendant_relation,
DROP COLUMN IF EXISTS attendant_phone;
