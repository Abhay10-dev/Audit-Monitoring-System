-- Migration: 007_create_rules_config.sql
-- Configurable rule engine thresholds, managed by admins

CREATE TABLE IF NOT EXISTS rules_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name     VARCHAR(100) UNIQUE NOT NULL,
  description   TEXT,
  threshold     NUMERIC(10,2) NOT NULL,   -- The trigger threshold value
  score_weight  NUMERIC(5,2) NOT NULL,    -- Points added to rule_score when triggered
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default rules
INSERT INTO rules_config (rule_name, description, threshold, score_weight, is_active) VALUES
  ('login_outside_hours',   'Login outside working hours (before 8AM or after 6PM)', 0,   20, TRUE),
  ('failed_login_attempts', 'Multiple failed login attempts',                         3,   25, TRUE),
  ('new_device_detected',   'Login from an unrecognized device',                      0,   30, TRUE),
  ('new_location_detected', 'Login from a new IP/location',                          0,   15, TRUE)
ON CONFLICT (rule_name) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rules_config_is_active ON rules_config(is_active);
