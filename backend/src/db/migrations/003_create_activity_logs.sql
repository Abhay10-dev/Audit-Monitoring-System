-- Migration: 003_create_activity_logs.sql
-- Stores all user activity events with metadata

CREATE TABLE IF NOT EXISTS activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES sessions(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL,   -- e.g. 'login', 'logout', 'file_access', 'api_call'
  description   TEXT,
  ip_address    VARCHAR(45),
  device_info   TEXT,
  metadata      JSONB DEFAULT '{}',
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes (critical for performance on large datasets)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON activity_logs(session_id);

-- Partial index for recent logs (last 90 days optimization)
CREATE INDEX IF NOT EXISTS idx_activity_logs_recent 
  ON activity_logs(timestamp) 
  WHERE timestamp > NOW() - INTERVAL '90 days';
