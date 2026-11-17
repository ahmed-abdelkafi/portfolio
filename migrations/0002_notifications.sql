-- Visit notifications: on/off switch, daily cap, and a per-day counter.
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('notify_enabled', '1'), ('notify_daily_cap', '30');

CREATE TABLE IF NOT EXISTS notify_log (
  day   TEXT PRIMARY KEY,  -- UTC day
  count INTEGER NOT NULL DEFAULT 0
);
