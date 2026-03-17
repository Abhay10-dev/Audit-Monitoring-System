-- Migration: 006_create_feedback.sql
-- Admin feedback on alerts: true positive vs false positive (used to improve ML model)

CREATE TABLE IF NOT EXISTS feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id      UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  admin_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anomaly_id    UUID REFERENCES anomalies(id) ON DELETE SET NULL,
  label         VARCHAR(20) NOT NULL CHECK (label IN ('true_positive', 'false_positive')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_alert_id ON feedback(alert_id);
CREATE INDEX IF NOT EXISTS idx_feedback_admin_id ON feedback(admin_id);
CREATE INDEX IF NOT EXISTS idx_feedback_label ON feedback(label);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
