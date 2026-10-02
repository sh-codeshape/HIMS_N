-- migrate:up
CREATE OR REPLACE FUNCTION next_number(p_org uuid, p_facility uuid, p_key text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE s number_sequences%ROWTYPE;
BEGIN
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


-- ---------------------------------------------------------------------
-- 2. BILLING MASTERS (what can be sold, at what price, taxed how, to whom)
-- ---------------------------------------------------------------------

-- Tax is data, not code. A group = one GST slab; components split it
-- (CGST+SGST for intra-state, IGST for inter-state).

-- migrate:down
-- TODO: add drop statements
