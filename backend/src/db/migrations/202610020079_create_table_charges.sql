-- migrate:up
CREATE TABLE charges (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id        uuid NOT NULL REFERENCES organizations(id),
    facility_id            uuid NOT NULL REFERENCES facilities(id),
    patient_id             uuid NOT NULL REFERENCES patients(id),
    encounter_id           uuid NOT NULL REFERENCES encounters(id),
    service_id             uuid REFERENCES services(id),         -- NULL for ad-hoc charges
    item_id                uuid REFERENCES items(id),            -- pharmacy / consumable charges
    description            text NOT NULL,
    department_id          uuid REFERENCES departments(id),
    quantity               numeric(12,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price             numeric(14,2) NOT NULL CHECK (unit_price >= 0),
    gross_amount           numeric(14,2) GENERATED ALWAYS AS (round(quantity * unit_price, 2)) STORED,
    discount_percent       numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    discount_amount        numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    taxable_amount         numeric(14,2) NOT NULL,
    tax_group_id           uuid REFERENCES tax_groups(id),
    tax_amount             numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    net_amount             numeric(14,2) NOT NULL,
    responsibility         text NOT NULL DEFAULT 'patient' CHECK (responsibility IN ('patient','payer')),
    patient_coverage_id    uuid REFERENCES patient_coverages(id),
    status                 text NOT NULL DEFAULT 'billable'
                           CHECK (status IN ('planned','billable','billed','cancelled','entered_in_error')),
    source_type            text NOT NULL DEFAULT 'manual'
                           CHECK (source_type IN ('manual','appointment','order_item','dispensation','bed_assignment',
                                                  'surgery','package','blood_issue','ambulance_trip','other')),
    source_id              uuid,
    encounter_package_id   uuid REFERENCES encounter_packages(id),
    is_package_inclusion   boolean NOT NULL DEFAULT false,      -- covered by package: price 0 on the bill
    ordered_by_practitioner_id uuid REFERENCES practitioners(id),
    performed_by_staff_id  uuid REFERENCES staff(id),
    performed_at           timestamptz,
    charged_at             timestamptz NOT NULL DEFAULT now(),
    cancel_reason          text,
    custom_fields          jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CHECK (discount_amount <= gross_amount),
    CHECK (taxable_amount = gross_amount - discount_amount),
    CHECK (net_amount = taxable_amount + tax_amount),
    CHECK (responsibility = 'patient' OR patient_coverage_id IS NOT NULL)
);
CREATE INDEX idx_charges_encounter ON charges (encounter_id, status);
CREATE INDEX idx_charges_patient   ON charges (patient_id, charged_at DESC);
CREATE INDEX idx_charges_source    ON charges (source_type, source_id);
CREATE INDEX idx_charges_unbilled  ON charges (facility_id, encounter_id) WHERE status = 'billable';

-- INVOICES (bills). One encounter can have many: OPD bill, interim IPD bills,
-- final bill, separate pharmacy bills, or split bills (patient share / payer share).

-- migrate:down
-- TODO: add drop statements
