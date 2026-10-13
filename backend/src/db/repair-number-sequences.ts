import { db } from '../config/database';
import { logger } from '../config/logger';

const DEFAULT_SEQUENCES = [
  { seq_key: 'UHID', prefix: 'UHID-', suffix: '', include_year: true, padding: 6, reset_policy: 'yearly' },
  { seq_key: 'ENCOUNTER', prefix: 'OPD-', suffix: '', include_year: true, padding: 4, reset_policy: 'yearly' },
  { seq_key: 'ADMISSION', prefix: 'ADM-', suffix: '', include_year: true, padding: 4, reset_policy: 'yearly' },
  { seq_key: 'INVOICE', prefix: 'INV-', suffix: '', include_year: true, padding: 4, reset_policy: 'yearly' },
  { seq_key: 'RECEIPT', prefix: 'REC-', suffix: '', include_year: true, padding: 4, reset_policy: 'yearly' },
] as const;

async function ensureNumberSequences() {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    await client.query(`
      WITH org_facilities AS (
        SELECT o.id AS organization_id, f.id AS facility_id
        FROM organizations o
        LEFT JOIN facilities f ON f.organization_id = o.id
        UNION
        SELECT id, NULL::uuid FROM organizations
      ),
      seq_defs AS (
        SELECT 'UHID'::text AS seq_key, 'UHID-'::text AS prefix, ''::text AS suffix, true AS include_year, 6 AS padding, 'yearly'::text AS reset_policy
        UNION ALL
        SELECT 'ENCOUNTER'::text, 'OPD-'::text, ''::text, true, 4, 'yearly'::text
        UNION ALL
        SELECT 'ADMISSION'::text, 'ADM-'::text, ''::text, true, 4, 'yearly'::text
        UNION ALL
        SELECT 'INVOICE'::text, 'INV-'::text, ''::text, true, 4, 'yearly'::text
        UNION ALL
        SELECT 'RECEIPT'::text, 'REC-'::text, ''::text, true, 4, 'yearly'::text
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
        of.organization_id,
        of.facility_id,
        sd.seq_key,
        sd.prefix,
        sd.suffix,
        sd.include_year,
        sd.padding,
        0::bigint,
        sd.reset_policy,
        CURRENT_DATE
      FROM org_facilities of
      CROSS JOIN seq_defs sd
      ON CONFLICT (organization_id, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid), seq_key)
      DO NOTHING;
    `);

    await client.query('COMMIT');
    logger.info('Ensured number sequences for all organizations and facilities.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error }, 'Failed to ensure number sequences');
    throw error;
  } finally {
    client.release();
  }
}

ensureNumberSequences()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
