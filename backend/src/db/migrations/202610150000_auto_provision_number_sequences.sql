-- migrate:up
-- ---------------------------------------------------------------------
-- ROOT-CAUSE FIX: Auto-provision number_sequences when an org or facility
-- is created, so new tenants never hit "number sequence not configured".
--
-- Problem: next_number() matches rows with
--   facility_id IS NOT DISTINCT FROM p_facility
-- Callers (controllers) default a missing facility_id to the nil UUID
-- ('00000000-...'), but an org-wide series row has facility_id = NULL.
-- NULL IS NOT DISTINCT FROM nil-UUID is FALSE, so the row never matches.
--
-- Fix 1: normalize the nil UUID to NULL inside next_number().
-- Fix 2: AFTER INSERT triggers on organizations/facilities that insert the
--        default sequence rows (org-wide + per-facility). Trigger wrapper
--        functions return `trigger` and use NEW internally, because
--        CREATE TRIGGER ... EXECUTE FUNCTION cannot take NEW.* as an
--        argument — only literal constants are allowed there.
-- Fix 3: backfill every existing org/facility (covers gaps created before
--        this migration).
-- ---------------------------------------------------------------------

-- 1. Make next_number treat the nil UUID as NULL (organization-wide series).
CREATE OR REPLACE FUNCTION next_number(p_org uuid, p_facility uuid, p_key text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE s number_sequences%ROWTYPE;
BEGIN
    -- Nil UUID means "no facility" => organization-wide series (facility_id = NULL).
    p_facility := NULLIF(p_facility, '00000000-0000-0000-0000-000000000000'::uuid);

    UPDATE number_sequences ns SET
        current_value = CASE
            WHEN ns.reset_policy = 'yearly'  AND ns.last_reset_on < date_trunc('year',  CURRENT_DATE)::date THEN 1
            WHEN ns.reset_policy = 'monthly' AND ns.last_reset_on < date_trunc('month', CURRENT_DATE)::date THEN 1
            ELSE ns.current_value + 1 END,
        last_reset_on = CASE
            WHEN ns.reset_policy = 'yearly'  AND ns.last_reset_on < date_trunc('year',  CURRENT_DATE)::date THEN CURRENT_DATE
            WHEN ns.reset_policy = 'monthly' AND ns.last_reset_on < date_trunc('month', CURRENT_DATE)::date THEN CURRENT_DATE
            ELSE ns.last_reset_on END
    WHERE ns.organization_id = p_org
      AND ns.facility_id IS NOT DISTINCT FROM p_facility
      AND ns.seq_key = p_key
    RETURNING * INTO s;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'number sequence % not configured (org %, facility %)', p_key, p_org, p_facility;
    END IF;

    RETURN s.prefix
        || CASE WHEN s.include_year THEN to_char(CURRENT_DATE, 'YY') || '-' ELSE '' END
        || lpad(s.current_value::text, s.padding, '0')
        || s.suffix;
END $$;


-- 2. Provision the default sequence set for one organization (org-wide series).
CREATE OR REPLACE FUNCTION ensure_number_sequences_for_org(p_org uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO number_sequences (
        organization_id, facility_id, seq_key, prefix, suffix, include_year,
        padding, current_value, reset_policy, last_reset_on
    )
    SELECT
        p_org,
        NULL::uuid,
        sd.seq_key,
        sd.prefix,
        sd.suffix,
        sd.include_year,
        sd.padding,
        0::bigint,
        sd.reset_policy,
        CURRENT_DATE
    FROM (VALUES
        ('ENCOUNTER', 'OPD-',  '', true,  4, 'yearly'),
        ('ADMISSION', 'ADM-',  '', true,  4, 'yearly'),
        ('INVOICE',   'INV-',  '', true,  4, 'yearly'),
        ('RECEIPT',   'REC-',  '', true,  4, 'yearly'),
        ('UHID',      'UHID-', '', true,  6, 'yearly')
    ) AS sd(seq_key, prefix, suffix, include_year, padding, reset_policy)
    ON CONFLICT (
        organization_id,
        COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid),
        seq_key
    ) DO NOTHING;
END $$;


-- 3. Provision the default sequence set for one facility (facility-level series).
CREATE OR REPLACE FUNCTION ensure_number_sequences_for_facility(p_facility uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_org uuid;
BEGIN
    SELECT organization_id INTO v_org FROM facilities WHERE id = p_facility;
    IF v_org IS NULL THEN RETURN; END IF;

    INSERT INTO number_sequences (
        organization_id, facility_id, seq_key, prefix, suffix, include_year,
        padding, current_value, reset_policy, last_reset_on
    )
    SELECT
        v_org,
        p_facility,
        sd.seq_key,
        sd.prefix,
        sd.suffix,
        sd.include_year,
        sd.padding,
        0::bigint,
        sd.reset_policy,
        CURRENT_DATE
    FROM (VALUES
        ('ENCOUNTER', 'OPD-',  '', true,  4, 'yearly'),
        ('ADMISSION', 'ADM-',  '', true,  4, 'yearly'),
        ('INVOICE',   'INV-',  '', true,  4, 'yearly'),
        ('RECEIPT',   'REC-',  '', true,  4, 'yearly'),
        ('UHID',      'UHID-', '', true,  6, 'yearly')
    ) AS sd(seq_key, prefix, suffix, include_year, padding, reset_policy)
    ON CONFLICT (
        organization_id,
        COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid),
        seq_key
    ) DO NOTHING;
END $$;


-- 4. Trigger wrapper functions (return `trigger`, use NEW internally).
CREATE OR REPLACE FUNCTION trg_org_ensure_number_sequences_func()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM ensure_number_sequences_for_org(NEW.id);
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION trg_facility_ensure_number_sequences_func()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM ensure_number_sequences_for_facility(NEW.id);
    RETURN NEW;
END $$;


-- 5. Triggers: auto-provision whenever a new org or facility is inserted.
DROP TRIGGER IF EXISTS trg_org_ensure_number_sequences ON organizations;
CREATE TRIGGER trg_org_ensure_number_sequences
    AFTER INSERT ON organizations
    FOR EACH ROW EXECUTE FUNCTION trg_org_ensure_number_sequences_func();

DROP TRIGGER IF EXISTS trg_facility_ensure_number_sequences ON facilities;
CREATE TRIGGER trg_facility_ensure_number_sequences
    AFTER INSERT ON facilities
    FOR EACH ROW EXECUTE FUNCTION trg_facility_ensure_number_sequences_func();


-- 6. Backfill: ensure all existing orgs/facilities have sequences (covers
--    gaps created before this migration was applied).
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT id FROM organizations LOOP
        PERFORM ensure_number_sequences_for_org(r.id);
    END LOOP;
    FOR r IN SELECT id FROM facilities LOOP
        PERFORM ensure_number_sequences_for_facility(r.id);
    END LOOP;
END $$;


-- migrate:down
DROP TRIGGER IF EXISTS trg_facility_ensure_number_sequences ON facilities;
DROP TRIGGER IF EXISTS trg_org_ensure_number_sequences ON organizations;
DROP FUNCTION IF EXISTS trg_facility_ensure_number_sequences_func();
DROP FUNCTION IF EXISTS trg_org_ensure_number_sequences_func();
DROP FUNCTION IF EXISTS ensure_number_sequences_for_facility(uuid);
DROP FUNCTION IF EXISTS ensure_number_sequences_for_org(uuid);
-- next_number is left as-is on rollback (the nil-UUID normalization is
-- backwards compatible; callers passing NULL continue to work).
