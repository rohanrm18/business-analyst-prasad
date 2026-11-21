CREATE TABLE IF NOT EXISTS sync_snapshots (
  company_key TEXT PRIMARY KEY NOT NULL,
  encrypted_payload TEXT NOT NULL,
  synced_at TEXT NOT NULL
);
