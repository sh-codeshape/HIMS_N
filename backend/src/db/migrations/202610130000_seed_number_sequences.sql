-- migrate:up
WITH org_rows AS (
    SELECT id AS organization_id, NULL::uuid AS facility_id FROM organizations
    UNION ALL
    SELECT o.id AS organization_id, f.id AS facility_id
    FROM organizations o
    JOIN facilities f ON f.organization_id = o.id
), seq_rows AS (
    SELECT 'ENCOUNTER'::text AS seq_key, 'OPD-'::text AS prefix, ''::text AS suffix, true AS include_year, 4 AS padding, 0::bigint AS current_value, 'yearly'::text AS reset_policy
    UNION ALL
    SELECT 'ADMISSION', 'ADM-', '', true, 4, 0, 'yearly'
    UNION ALL
    SELECT 'INVOICE', 'INV-', '', true, 4, 0, 'yearly'
    UNION ALL
    SELECT 'RECEIPT', 'REC-', '', true, 4, 0, 'yearly'
)
INSERT INTO number_sequences (
    organization_id,
    facility_id,
    seq_key,
    prefix,
    suffix,
    include_year,
    padding,
    current_value,
    reset_policy,
    last_reset_on
)
SELECT
    org_rows.organization_id,
    org_rows.facility_id,
    seq_rows.seq_key,
    seq_rows.prefix,
    seq_rows.suffix,
    seq_rows.include_year,
    seq_rows.padding,
    seq_rows.current_value,
    seq_rows.reset_policy,
    CURRENT_DATE
FROM org_rows
CROSS JOIN seq_rows
ON CONFLICT (organization_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid), seq_key)
DO NOTHING;

-- migrate:down
-- Intentionally left as a no-op to avoid deleting live sequence rows that may already exist
-- in production. Sequence tables are operational state, not migration artifacts.
