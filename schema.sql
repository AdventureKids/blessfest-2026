-- Blessfest 2026 volunteer roster + comms.
-- Apply:  npx wrangler d1 execute blessfest-roster --file schema.sql
-- Local:  add --local to test against the dev SQLite.

-- One row per volunteer, created when Formstack fires its submission webhook.
CREATE TABLE IF NOT EXISTS volunteers (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id  TEXT UNIQUE,            -- Formstack's unique submission id; makes the webhook idempotent
  first_name     TEXT NOT NULL,
  last_name      TEXT,
  email          TEXT,
  phone          TEXT,                   -- E.164 (+1…) once normalized
  sms_consent    INTEGER NOT NULL DEFAULT 0,  -- 1 only if they ticked the opt-in on the form
  raw_json       TEXT,                   -- the full submission, so we never lose a field we didn't map
  created_at     TEXT NOT NULL,          -- ISO8601, stamped by the Worker
  choice1        TEXT,                   -- 1st area choice from the form (raw text)
  choice2        TEXT,                   -- 2nd area choice from the form (raw text)
  staff_role     TEXT,                   -- e.g. "Staff Leadership"; NULL for regular volunteers
  area_id        TEXT,                   -- set at wave-2 assignment; matches data.js area ids
  assigned_at    TEXT,
  assigned_by    TEXT,
  photo          TEXT,                   -- optional leader headshot, a small resized JPEG data URL
  shift          TEXT,                   -- '1' or '2' (a person may have one row per shift); NULL for staff
  last_login_at  TEXT,                   -- ISO8601 of the leader/admin's last email-code sign-in; NULL = never
  note           TEXT                    -- coordinator's private note about this volunteer (set on the Queue, edited in the Directory)
);

CREATE INDEX IF NOT EXISTS idx_volunteers_phone ON volunteers(phone);
CREATE INDEX IF NOT EXISTS idx_volunteers_area  ON volunteers(area_id);

-- Every message we attempt to send (SMS or email, wave 1 or 2). One row per send
-- attempt, so we have a delivery log and can avoid double-sending on webhook retries.
CREATE TABLE IF NOT EXISTS messages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  volunteer_id  INTEGER NOT NULL REFERENCES volunteers(id),
  wave          TEXT NOT NULL,           -- 'welcome' | 'onboarding'
  channel       TEXT NOT NULL,           -- 'sms' | 'email'
  to_addr       TEXT NOT NULL,           -- phone or email actually used
  status        TEXT NOT NULL,           -- 'queued' | 'sent' | 'skipped' | 'failed'
  provider_id   TEXT,                    -- Twilio/Resend message id, when sent
  error         TEXT,
  created_at    TEXT NOT NULL,
  UNIQUE (volunteer_id, wave, channel)   -- one welcome-sms per volunteer, etc.
);

-- Access tokens for the wave-2 team portal (/team/<token>). Minted at assignment.
CREATE TABLE IF NOT EXISTS tokens (
  token         TEXT PRIMARY KEY,        -- random, URL-safe
  volunteer_id  INTEGER NOT NULL REFERENCES volunteers(id),
  created_at    TEXT NOT NULL,
  last_used_at  TEXT,
  revoked_at    TEXT
);

-- Team-portal message board. Announcements are area-scoped; pinned rises to top.
CREATE TABLE IF NOT EXISTS posts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  area_id     TEXT,                      -- NULL = shown on every area's board
  author      TEXT NOT NULL,
  body        TEXT NOT NULL,
  pinned      INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_area ON posts(area_id);

-- One-time login codes for the email-code admin login (see session.js).
CREATE TABLE IF NOT EXISTS login_codes (
  email       TEXT PRIMARY KEY,
  code        TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0
);
