-- migrate:up
INSERT INTO discount_reasons (
    organization_id, code, name, default_percent, max_percent, requires_approval, is_active
)
SELECT o.id, r.code, r.name, r.default_percent, r.max_percent, r.requires_approval, true
FROM organizations o
CROSS JOIN (
    VALUES
        ('DOC_REF', 'Doctor Referral / Consultant Recommendation', 10.00, 50.00, false),
        ('MGMT_DISC', 'Management / Director Discretion', 20.00, 100.00, false),
        ('STAFF_FAMILY', 'Staff / Hospital Employee Privilege', 25.00, 50.00, false),
        ('SENIOR_CITIZEN', 'Senior Citizen Concession', 15.00, 30.00, false),
        ('BPL_CHARITY', 'Poor / Charitable Trust Assistance (BPL)', 50.00, 100.00, false),
        ('CAMP_PROMO', 'Community Health Camp / Health Drive', 20.00, 50.00, false),
        ('CORPORATE_TIEUP', 'Corporate / Institutional Tie-Up', 15.00, 40.00, false),
        ('EMERGENCY_RELIEF', 'Emergency / Humanitarian Relief', 25.00, 100.00, false)
) AS r(code, name, default_percent, max_percent, requires_approval)
ON CONFLICT (organization_id, code) 
DO UPDATE SET 
    name = EXCLUDED.name, 
    default_percent = EXCLUDED.default_percent, 
    max_percent = EXCLUDED.max_percent;

-- migrate:down
DELETE FROM discount_reasons WHERE code IN (
    'DOC_REF', 'MGMT_DISC', 'STAFF_FAMILY', 'SENIOR_CITIZEN', 'BPL_CHARITY', 'CAMP_PROMO', 'CORPORATE_TIEUP', 'EMERGENCY_RELIEF'
);
