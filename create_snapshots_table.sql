
CREATE TABLE IF NOT EXISTS system_snapshots (
  snapshot_key TEXT PRIMARY KEY,
  snapshot_data TEXT,
  updated_at TEXT
);
