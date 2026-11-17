-- Portfolio analytics + admin auth. Cookie-free visitor analytics: no raw IP, no precise location.

-- One row per tracked event (pageview, engagement, interaction, heartbeat).
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,           -- client-generated UUID: INSERT OR IGNORE de-duplicates retries
  ts          INTEGER NOT NULL,           -- server receive time, ms since epoch (UTC)
  type        TEXT NOT NULL,              -- 'pageview' | 'engagement' | 'event' | 'ping'
  name        TEXT,                       -- event name for type='event' (e.g. 'project_click')
  pv          TEXT,                       -- pageview id this event belongs to
  path        TEXT NOT NULL,              -- path only, no query string
  locale      TEXT,
  visitor     TEXT NOT NULL,              -- SHA-256(daily salt + ip + ua + host), rotates every UTC day
  session     TEXT NOT NULL,              -- server-assigned: 30 min inactivity window per visitor
  is_new      INTEGER NOT NULL DEFAULT 1, -- 0 when the browser carries the non-identifying "seen before" flag
  ref_host    TEXT,
  source      TEXT,                       -- normalised: 'Google', 'LinkedIn', 'GitHub', 'Direct', host…
  medium      TEXT,                       -- 'organic' | 'social' | 'referral' | 'none' | utm_medium
  campaign    TEXT,
  country     TEXT,                       -- ISO-3166 alpha-2 from Cloudflare
  region      TEXT,                       -- region name from Cloudflare (approximate)
  device      TEXT,                       -- 'desktop' | 'mobile' | 'tablet'
  os          TEXT,
  browser     TEXT,
  screen      TEXT,                       -- width bucket: 'xs' <576, 'sm' <768, 'md' <1024, 'lg' <1440, 'xl'
  duration_ms INTEGER,                    -- engagement events: visible time on the page
  target      TEXT                        -- interaction target (project slug, link host…), never free text
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);
CREATE INDEX IF NOT EXISTS idx_events_type_ts ON events (type, ts);
CREATE INDEX IF NOT EXISTS idx_events_session ON events (session, ts);
CREATE INDEX IF NOT EXISTS idx_events_visitor_ts ON events (visitor, ts);

-- Daily salts for the visitor hash; deleted after 2 days so old hashes can never be recomputed.
CREATE TABLE IF NOT EXISTS salts (day TEXT PRIMARY KEY, salt TEXT NOT NULL);

-- Administrators (no public registration: created with scripts/create-admin.mjs).
CREATE TABLE IF NOT EXISTS admins (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT NOT NULL UNIQUE,
  pw_hash    TEXT NOT NULL,               -- pbkdf2-sha256$iterations$salt_b64$hash_b64
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Server-side sessions: only SHA-256 of the cookie token is stored.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  ua         TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_admin ON admin_sessions (admin_id);

-- Failed login attempts per hashed client (rate limiting).
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT NOT NULL,
  ts  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts_key_ts ON login_attempts (key, ts);

-- Cached Google Search Console responses (avoid hitting the API on every dashboard view).
CREATE TABLE IF NOT EXISTS gsc_cache (
  key        TEXT PRIMARY KEY,
  body       TEXT NOT NULL,
  fetched_at INTEGER NOT NULL
);
