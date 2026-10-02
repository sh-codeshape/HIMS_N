-- migrate:up
CREATE TABLE notification_templates (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id),
    code            text NOT NULL,                  -- 'APPT_REMINDER','BILL_RECEIPT','LAB_READY' ...
    channel         text NOT NULL CHECK (channel IN ('sms','email','whatsapp','push','in_app')),
    language        text NOT NULL DEFAULT 'en',
    subject         text,
    body            text NOT NULL,                  -- with {{placeholders}}
    is_active       boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    UNIQUE (organization_id, code, channel, language)
);

-- migrate:down
-- TODO: add drop statements
