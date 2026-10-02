-- migrate:up
CREATE OR REPLACE FUNCTION get_service_rate(
    p_service uuid, p_plan uuid,
    p_bed_category uuid DEFAULT NULL, p_facility uuid DEFAULT NULL, p_on date DEFAULT CURRENT_DATE)
RETURNS numeric LANGUAGE plpgsql STABLE AS $$
DECLARE v numeric;
BEGIN
    IF p_plan IS NOT NULL THEN
        WITH RECURSIVE chain AS (
            SELECT id, parent_plan_id, 0 AS depth FROM tariff_plans WHERE id = p_plan
            UNION ALL
            SELECT tp.id, tp.parent_plan_id, c.depth + 1
            FROM tariff_plans tp JOIN chain c ON tp.id = c.parent_plan_id
            WHERE c.depth < 5
        )
        SELECT tr.rate INTO v
        FROM chain c
        JOIN tariff_rates tr ON tr.tariff_plan_id = c.id
         AND tr.service_id = p_service
         AND tr.effective_from <= p_on
         AND (tr.effective_to IS NULL OR tr.effective_to > p_on)
         AND (tr.bed_category_id IS NULL OR tr.bed_category_id = p_bed_category)
         AND (tr.facility_id IS NULL OR tr.facility_id = p_facility)
        ORDER BY c.depth, (tr.facility_id IS NULL), (tr.bed_category_id IS NULL)
        LIMIT 1;
    END IF;
    IF v IS NULL THEN
        SELECT default_rate INTO v FROM services WHERE id = p_service;
    END IF;
    RETURN v;
END $$;

-- PACKAGES (surgery bundles, health check-ups, maternity, daycare)

-- migrate:down
-- TODO: add drop statements
