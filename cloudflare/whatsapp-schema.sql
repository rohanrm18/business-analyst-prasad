CREATE TABLE IF NOT EXISTS sync_snapshots (
  company_key TEXT PRIMARY KEY NOT NULL,
  encrypted_payload TEXT NOT NULL,
  synced_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wa_customer_contacts (
  customer_ref TEXT PRIMARY KEY NOT NULL,
  phone_e164 TEXT NOT NULL,
  opted_in INTEGER NOT NULL DEFAULT 0 CHECK (opted_in IN (0,1)),
  consent_source TEXT,
  consent_updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wa_reminder_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  customer_ref TEXT NOT NULL,
  invoice_ref TEXT NOT NULL,
  stage TEXT NOT NULL,
  template_name TEXT NOT NULL,
  language_code TEXT NOT NULL,
  parameters_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  scheduled_at TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  provider_response TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(customer_ref, invoice_ref, stage),
  FOREIGN KEY(customer_ref) REFERENCES wa_customer_contacts(customer_ref)
);
CREATE INDEX IF NOT EXISTS idx_wa_jobs_due ON wa_reminder_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_wa_jobs_customer ON wa_reminder_jobs(customer_ref, status);
CREATE INDEX IF NOT EXISTS idx_wa_jobs_provider_id ON wa_reminder_jobs(provider_message_id);
