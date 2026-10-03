-- migrate:up
CREATE TABLE notifications (          -- outbox
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    facility_id     uuid REFERENCES facilities(id),
    patient_id      uuid REFERENCES patients(id),
    user_id         uuid REFERENCES users(id),
    template_id     uuid REFERENCES notification_templates(id),
    channel         text NOT NULL CHECK (channel IN ('sms','email','whatsapp','push','in_app')),
    recipient       text NOT NULL,
    subject         text,
    body            text NOT NULL,
    status          text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed','cancelled')),
    provider_ref    text,
    error           text,
    related_type    text,
    related_id      uuid,
    scheduled_at    timestamptz NOT NULL DEFAULT now(),
    sent_at         timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);
CREATE INDEX idx_notifications_queue   ON notifications (scheduled_at) WHERE status = 'queued';
CREATE INDEX idx_notifications_patient ON notifications (patient_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 14. REPORTING VIEWS
-- ---------------------------------------------------------------------
-- Outstanding and advance balance per patient
CREATE VIEW v_patient_account AS
SELECT p.id AS patient_id, p.uhid, p.full_name,
       COALESCE(i.billed, 0)      AS total_billed,
       COALESCE(i.paid, 0)        AS total_paid_on_invoices,
       COALESCE(i.due, 0)         AS total_due,
       COALESCE(a.unapplied, 0)   AS advance_balance
FROM patients p
LEFT JOIN (SELECT patient_id, SUM(total_amount) billed, SUM(paid_amount) paid, SUM(due_amount) due
             FROM invoices WHERE status IN ('issued','partially_paid','paid','written_off') GROUP BY patient_id) i
       ON i.patient_id = p.id
LEFT JOIN (SELECT patient_id, SUM(amount - allocated_amount) unapplied
             FROM payments WHERE direction = 'in' AND status = 'completed' AND payment_type = 'advance' GROUP BY patient_id) a
       ON a.patient_id = p.id;

-- Live running bill for an encounter (what the cashier sees before discharge)
CREATE VIEW v_encounter_billing_summary AS
SELECT e.id AS encounter_id, e.encounter_no, e.patient_id, e.encounter_type, e.status AS encounter_status,
       COALESCE(c.unbilled_net, 0)  AS unbilled_charges,
       COALESCE(i.invoiced, 0)      AS invoiced_total,
       COALESCE(i.paid, 0)          AS paid_total,
       COALESCE(i.due, 0)           AS invoice_due,
       COALESCE(c.unbilled_net, 0) + COALESCE(i.due, 0) AS total_outstanding
FROM encounters e
LEFT JOIN (SELECT encounter_id, SUM(net_amount) FILTER (WHERE status = 'billable') AS unbilled_net
             FROM charges GROUP BY encounter_id) c ON c.encounter_id = e.id
LEFT JOIN (SELECT encounter_id, SUM(total_amount) invoiced, SUM(paid_amount) paid, SUM(due_amount) due
             FROM invoices WHERE status IN ('issued','partially_paid','paid') GROUP BY encounter_id) i
       ON i.encounter_id = e.id;

-- Bed board: who is in which bed right now
CREATE VIEW v_bed_board AS
SELECT b.id AS bed_id, b.facility_id, w.name AS ward, b.bed_no, b.status AS bed_status,
       a.id AS admission_id, p.uhid, p.full_name AS patient_name, ba.assigned_from
FROM beds b
JOIN wards w ON w.id = b.ward_id
LEFT JOIN bed_assignments ba ON ba.bed_id = b.id AND ba.assigned_to IS NULL
LEFT JOIN admissions a       ON a.id = ba.admission_id
LEFT JOIN patients p         ON p.id = a.patient_id
WHERE b.is_active;

-- Stock on hand per store/item with reorder and expiry flags
CREATE VIEW v_stock_on_hand AS
SELECT st.facility_id, sb.store_id, st.name AS store, sb.item_id, i.code, i.name AS item,
       SUM(sb.quantity_on_hand) FILTER (WHERE sb.status = 'active')  AS available_qty,
       MIN(sb.expiry_date) FILTER (WHERE sb.quantity_on_hand > 0)    AS nearest_expiry,
       i.reorder_level,
       COALESCE(SUM(sb.quantity_on_hand) FILTER (WHERE sb.status = 'active'), 0) <= i.reorder_level AS needs_reorder
FROM stock_batches sb
JOIN items i   ON i.id = sb.item_id
JOIN stores st ON st.id = sb.store_id
GROUP BY st.facility_id, sb.store_id, st.name, sb.item_id, i.code, i.name, i.reorder_level;

-- Revenue by department and day (from issued invoices)
CREATE VIEW v_revenue_by_department AS
SELECT i.facility_id, il.department_id, d.name AS department, i.issued_at::date AS bill_date,
       SUM(il.taxable_amount) AS net_revenue, SUM(il.tax_amount) AS tax, SUM(il.line_total) AS gross_billed
FROM invoice_lines il
JOIN invoices i ON i.id = il.invoice_id AND i.status IN ('issued','partially_paid','paid','written_off')
LEFT JOIN departments d ON d.id = il.department_id
GROUP BY i.facility_id, il.department_id, d.name, i.issued_at::date;

-- ---------------------------------------------------------------------
-- 15. TRIGGER WIRING
-- ---------------------------------------------------------------------
-- created_by / updated_by / updated_at on every table that has updated_at
DO $$
DECLARE r record;
BEGIN
    FOR r IN
        SELECT c.table_name
          FROM information_schema.columns c
          JOIN information_schema.tables t
            ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
         WHERE c.table_schema = 'public' AND c.column_name = 'updated_at'
    LOOP
        EXECUTE format('CREATE TRIGGER trg_%s_touch BEFORE INSERT OR UPDATE ON %I
                        FOR EACH ROW EXECUTE FUNCTION touch_row()', r.table_name, r.table_name);
    END LOOP;
END $$;

-- Row-level audit trail on the sensitive tables. Add more names as needed.
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'patients','patient_coverages','encounters','admissions','diagnoses','clinical_notes','prescriptions',
        'services','tariff_rates','charges','invoices','invoice_lines','payments','payment_allocations',
        'credit_notes','preauthorizations','insurance_claims','claim_settlements',
        'users','user_roles','role_permissions','cash_sessions','stock_batches','goods_receipts'
    ] LOOP
        EXECUTE format('CREATE TRIGGER trg_%s_audit AFTER INSERT OR UPDATE OR DELETE ON %I
                        FOR EACH ROW EXECUTE FUNCTION audit_row_change()', t, t);
    END LOOP;
END $$;

CREATE TRIGGER trg_audit_logs_immutable BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION forbid_change();

-- ---------------------------------------------------------------------
-- 16. STARTER SEED (global, tenant-independent)
-- ---------------------------------------------------------------------
INSERT INTO lookup_types (code, name, is_system) VALUES
    ('relationship',      'Relationship to patient',  true),
    ('religion',          'Religion',                 false),
    ('referral_source',   'Referral source',          false),
    ('cancel_reason',     'Cancellation reasons',     false),
    ('discharge_reason',  'Discharge reasons',        false),
    ('write_off_reason',  'Write-off reasons',        false),
    ('claim_rejection',   'Claim rejection reasons',  false);

INSERT INTO lookup_values (type_code, code, label, sort_order) VALUES
    ('relationship','self','Self',1), ('relationship','spouse','Spouse',2), ('relationship','father','Father',3),
    ('relationship','mother','Mother',4), ('relationship','son','Son',5), ('relationship','daughter','Daughter',6),
    ('relationship','sibling','Sibling',7), ('relationship','guardian','Guardian',8), ('relationship','other','Other',9);

INSERT INTO permissions (code, module, description) VALUES
    ('patient.read','registration','View patient records'),
    ('patient.create','registration','Register patients'),
    ('patient.update','registration','Edit patient demographics'),
    ('patient.merge','registration','Merge duplicate patients'),
    ('appointment.manage','scheduling','Book / reschedule / cancel appointments'),
    ('encounter.create','clinical','Open encounters'),
    ('clinical.read','clinical','View clinical record'),
    ('clinical.write','clinical','Write notes, diagnoses, vitals'),
    ('clinical.sign','clinical','Sign clinical notes'),
    ('prescription.create','clinical','Prescribe'),
    ('order.create','orders','Place lab / imaging / procedure orders'),
    ('lab.enter_result','lab','Enter lab results'),
    ('lab.verify_result','lab','Verify / release lab results'),
    ('imaging.report','imaging','Report imaging studies'),
    ('pharmacy.dispense','pharmacy','Dispense medicines'),
    ('pharmacy.return','pharmacy','Process pharmacy returns'),
    ('inventory.manage','inventory','Manage items, batches, adjustments'),
    ('purchase.create','inventory','Raise purchase orders'),
    ('purchase.approve','inventory','Approve purchase orders'),
    ('grn.post','inventory','Post goods receipts'),
    ('admission.manage','ipd','Admit / transfer / discharge'),
    ('bed.manage','ipd','Manage bed board'),
    ('ot.schedule','ot','Schedule surgeries'),
    ('charge.create','billing','Add manual charges'),
    ('charge.cancel','billing','Cancel charges'),
    ('invoice.create','billing','Create invoices'),
    ('invoice.issue','billing','Issue invoices'),
    ('invoice.cancel','billing','Cancel invoices'),
    ('discount.apply','billing','Apply discounts within limits'),
    ('discount.approve','billing','Approve discounts above limit'),
    ('payment.collect','billing','Collect payments / advances'),
    ('payment.refund','billing','Issue refunds'),
    ('creditnote.issue','billing','Issue credit notes'),
    ('writeoff.approve','billing','Approve write-offs'),
    ('cashsession.manage','billing','Open / close cash sessions'),
    ('insurance.manage','insurance','Pre-auth and claims'),
    ('tariff.manage','masters','Edit tariffs, services, packages'),
    ('report.view','reports','View reports'),
    ('report.financial','reports','View financial reports'),
    ('admin.users','admin','Manage users and roles'),
    ('admin.settings','admin','Manage settings and masters'),
    ('audit.view','admin','View audit logs');

----
-- Well based on my frontend analyse this and tell me if we scale how fit this schema will be :? 
-- 
-- also i want few changes token per doctor, and uhid generation per patient should be unique with mmyy-xxxx
-- 
-- and it will be based on what (in my previous project we used name + phone number) as we have whatsapp chatbot too so : but here we don't have one but the thing is i want that family related booking flexibility so what do you thing tell me : 
-- 
-- Also this schema i have given mostly a direction even i lack some information in there so i want you write me proper documentation under docs/ folder and add  docs/ under gitignore okay .... now you tell me how should i proceed?

-- migrate:down
-- TODO: add drop statements
