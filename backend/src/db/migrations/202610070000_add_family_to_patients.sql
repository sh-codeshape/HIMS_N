-- migrate:up
ALTER TABLE patients ADD COLUMN family_head_id uuid REFERENCES patients(id) ON DELETE SET NULL;
ALTER TABLE patients ADD COLUMN relation_to_head text;

-- migrate:down
ALTER TABLE patients DROP COLUMN relation_to_head;
ALTER TABLE patients DROP COLUMN family_head_id;
