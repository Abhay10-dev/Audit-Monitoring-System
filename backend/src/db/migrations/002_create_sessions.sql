-- Migration: 002_create_sessions.sql
-- Stores login session data (IP, device, timestamps, duration)

CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address      VARCHAR(45),
  location        VARCHAR(255),
  device_info     TEXT,
  browser         VARCHAR(255),
  login_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_time     TIMESTAMPTZ,
  duration_secs   INTEGER,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_login_time ON sessions(login_time);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
